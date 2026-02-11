import uuid
from datetime import datetime
from typing import Dict, Optional, List


class SessionManager:
    def __init__(self):
        self.sessions: Dict[str, dict] = {}
    
    def create_session(self, user_name: str, user_language: str) -> tuple:
        session_id = self._generate_session_id()
        
        self.sessions[session_id] = {
            'session_id': session_id,
            'created_at': datetime.now().isoformat(),
            'users': {
                'user1': {
                    'name': user_name,
                    'language': user_language,
                    'socket_id': None
                },
                'user2': None
            },
            'messages': []
        }
        
        return session_id, 'user1'
    
    def join_session(self, session_id: str, user_name: str, user_language: str) -> Optional[dict]:
        if session_id not in self.sessions:
            return None
        
        session = self.sessions[session_id]
        
        if session['users']['user2'] is not None:
            return None
        
        session['users']['user2'] = {
            'name': user_name,
            'language': user_language,
            'socket_id': None
        }
        
        return {
            'user_role': 'user2',
            'other_user': session['users']['user1']
        }
    
    def get_session(self, session_id: str) -> Optional[dict]:
        return self.sessions.get(session_id)
    
    def update_socket_id(self, session_id: str, user_role: str, socket_id: str) -> bool:
        if session_id not in self.sessions:
            return False
        
        session = self.sessions[session_id]
        if session['users'].get(user_role):
            session['users'][user_role]['socket_id'] = socket_id
            return True
        
        return False
    
    def get_other_user_socket(self, session_id: str, user_role: str) -> Optional[str]:
        if session_id not in self.sessions:
            return None
        
        session = self.sessions[session_id]
        other_role = 'user2' if user_role == 'user1' else 'user1'
        other_user = session['users'].get(other_role)
        
        if other_user:
            return other_user.get('socket_id')
        
        return None
    
    def add_message(self, session_id: str, message_data: dict) -> bool:
        if session_id not in self.sessions:
            return False
        
        message = {
            'id': str(uuid.uuid4()),
            'timestamp': datetime.now().isoformat(),
            **message_data
        }
        
        self.sessions[session_id]['messages'].append(message)
        return True
    
    def get_messages(self, session_id: str) -> Optional[List[dict]]:
        if session_id not in self.sessions:
            return None
        
        return self.sessions[session_id]['messages']
    
    def session_exists(self, session_id: str) -> bool:
        return session_id in self.sessions
    
    def is_session_complete(self, session_id: str) -> bool:
        if session_id not in self.sessions:
            return False
        
        session = self.sessions[session_id]
        return session['users']['user2'] is not None
    
    def _generate_session_id(self) -> str:
        return ''.join([str(uuid.uuid4()).upper()[:3] for _ in range(2)])
    
    def cleanup_session(self, session_id: str) -> bool:
        if session_id in self.sessions:
            del self.sessions[session_id]
            return True
        return False
