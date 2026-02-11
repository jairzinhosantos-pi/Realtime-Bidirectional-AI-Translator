import json
import os
from datetime import datetime
from pathlib import Path
from services.api_whisper import WhisperService
from services.api_openai import OpenAIService


class Orchestrator:
    def __init__(self, config):
        self.config = config
        self.whisper_service = WhisperService(config)
        self.openai_service = OpenAIService(config)
        self.paths = config.get_paths()
        self.storage_config = config.get_storage_config()
        self.prompt_template = self.load_prompt()

    def load_prompt(self):
        prompt_path = self.paths.get('prompt', 'prompt/sp.prompt')
        try:
            with open(prompt_path, 'r', encoding='utf-8') as f:
                return f.read()
        except FileNotFoundError:
            return "Translate the following text from {source_language} to {target_language}:\n\n{text}\n\nTranslation:"

    def process_translation(self, audio_file_path, source_lang, target_lang):
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S_%f')
        
        try:
            transcription = self.whisper_service.speech_to_text(audio_file_path)
            
            if self.storage_config.get('save_text', True):
                self.save_text_input(transcription, timestamp, source_lang)
            
            translation = self.openai_service.translate_text(
                transcription,
                source_lang,
                target_lang,
                self.prompt_template
            )
            
            if self.storage_config.get('save_text', True):
                self.save_text_output(translation, timestamp, target_lang)
            
            output_audio_path = os.path.join(
                self.paths.get('audio_output'),
                f'translated_{timestamp}.mp3'
            )
            
            self.whisper_service.text_to_speech(translation, output_audio_path)
            
            if self.storage_config.get('save_history', True):
                self.save_translation_history({
                    'timestamp': timestamp,
                    'source_lang': source_lang,
                    'target_lang': target_lang,
                    'original_text': transcription,
                    'translated_text': translation,
                    'audio_input': audio_file_path,
                    'audio_output': output_audio_path
                })
            
            return {
                'success': True,
                'transcription': transcription,
                'translation': translation,
                'audio_output': output_audio_path
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }

    def save_text_input(self, text, timestamp, language):
        text_input_dir = self.paths.get('text_input')
        filename = f'input_{timestamp}_{language}.json'
        filepath = os.path.join(text_input_dir, filename)
        
        data = {
            'timestamp': timestamp,
            'language': language,
            'text': text
        }
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

    def save_text_output(self, text, timestamp, language):
        text_output_dir = self.paths.get('text_output')
        filename = f'output_{timestamp}_{language}.json'
        filepath = os.path.join(text_output_dir, filename)
        
        data = {
            'timestamp': timestamp,
            'language': language,
            'text': text
        }
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

    def save_translation_history(self, translation_data):
        history_file = self.storage_config.get('history_file')
        
        history = []
        if os.path.exists(history_file):
            try:
                with open(history_file, 'r', encoding='utf-8') as f:
                    history = json.load(f)
            except json.JSONDecodeError:
                history = []
        
        history.append(translation_data)
        
        with open(history_file, 'w', encoding='utf-8') as f:
            json.dump(history, f, ensure_ascii=False, indent=2)

    def get_translation_history(self, limit=10):
        history_file = self.storage_config.get('history_file')
        
        if not os.path.exists(history_file):
            return []
        
        try:
            with open(history_file, 'r', encoding='utf-8') as f:
                history = json.load(f)
                return history[-limit:] if limit else history
        except json.JSONDecodeError:
            return []
