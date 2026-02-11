import json
import os
from pathlib import Path


class Config:
    def __init__(self, config_file='config/config.json'):
        self.config_file = config_file
        self.config_data = self.load_config()
        self.validate_paths()

    def load_config(self):
        try:
            with open(self.config_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            raise Exception(f"Config file not found: {self.config_file}")
        except json.JSONDecodeError:
            raise Exception(f"Invalid JSON in config file: {self.config_file}")

    def validate_paths(self):
        paths = self.config_data.get('paths', {})
        for key, path in paths.items():
            if key != 'prompt':
                Path(path).mkdir(parents=True, exist_ok=True)

    def get(self, key, default=None):
        keys = key.split('.')
        value = self.config_data
        for k in keys:
            if isinstance(value, dict):
                value = value.get(k, default)
            else:
                return default
        return value

    def get_api_config(self):
        return self.config_data.get('api', {})

    def get_openai_config(self):
        return self.config_data.get('openai', {})

    def get_whisper_config(self):
        return self.config_data.get('whisper', {})

    def get_tts_config(self):
        return self.config_data.get('tts', {})

    def get_paths(self):
        return self.config_data.get('paths', {})

    def get_storage_config(self):
        return self.config_data.get('storage', {})
