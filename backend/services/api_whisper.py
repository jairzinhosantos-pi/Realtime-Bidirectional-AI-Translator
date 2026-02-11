import os
from pathlib import Path
from openai import OpenAI


class WhisperService:
    def __init__(self, config):
        self.config = config
        self.client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        self.whisper_config = config.get_whisper_config()
        self.tts_config = config.get_tts_config()

    def speech_to_text(self, audio_file_path):
        try:
            with open(audio_file_path, 'rb') as audio_file:
                response = self.client.audio.transcriptions.create(
                    model=self.whisper_config.get('model', 'whisper-1'),
                    file=audio_file,
                    response_format=self.whisper_config.get('response_format', 'json')
                )
            
            if hasattr(response, 'text'):
                return response.text
            return response
            
        except Exception as e:
            raise Exception(f"Error in speech_to_text: {str(e)}")

    def text_to_speech(self, text, output_path):
        try:
            response = self.client.audio.speech.create(
                model=self.tts_config.get('model', 'tts-1'),
                voice=self.tts_config.get('voice', 'alloy'),
                input=text,
                speed=self.tts_config.get('speed', 1.0)
            )
            
            response.stream_to_file(output_path)
            return output_path
            
        except Exception as e:
            raise Exception(f"Error in text_to_speech: {str(e)}")

    def detect_language(self, audio_file_path):
        try:
            with open(audio_file_path, 'rb') as audio_file:
                response = self.client.audio.transcriptions.create(
                    model=self.whisper_config.get('model', 'whisper-1'),
                    file=audio_file,
                    response_format='verbose_json'
                )
            
            if hasattr(response, 'language'):
                return response.language
            return None
            
        except Exception as e:
            raise Exception(f"Error in detect_language: {str(e)}")
