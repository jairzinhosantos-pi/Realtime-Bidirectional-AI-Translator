import os
from openai import OpenAI


class OpenAIService:
    def __init__(self, config):
        self.config = config
        self.client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        self.openai_config = config.get_openai_config()

    def translate_text(self, text, source_lang, target_lang, prompt_template):
        try:
            prompt = prompt_template.format(
                source_language=source_lang,
                target_language=target_lang,
                text=text
            )
            
            response = self.client.chat.completions.create(
                model=self.openai_config.get('model', 'gpt-4'),
                messages=[
                    {
                        "role": "system",
                        "content": "You are a professional translator."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=self.openai_config.get('temperature', 0.3),
                max_tokens=self.openai_config.get('max_tokens', 500)
            )
            
            translation = response.choices[0].message.content.strip()
            return translation
            
        except Exception as e:
            raise Exception(f"Error in translate_text: {str(e)}")
