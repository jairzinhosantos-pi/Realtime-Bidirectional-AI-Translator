import os
from datetime import datetime
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from flask_socketio import SocketIO, emit, join_room
from werkzeug.utils import secure_filename
from dotenv import load_dotenv
from config.config import Config
from orchestrator import Orchestrator
from session_manager import SessionManager
import logging
logging.basicConfig(level=logging.DEBUG)

load_dotenv()

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

config = Config('config/config.json')
orchestrator = Orchestrator(config)
session_manager = SessionManager()

api_config = config.get_api_config()


@app.route('/api/session/create', methods=['POST'])
def create_session():
    try:
        data = request.get_json()
        user_name = data.get('user_name')
        user_language = data.get('user_language')
        
        if not user_name or not user_language:
            return jsonify({
                'success': False,
                'error': 'User name and language are required'
            }), 400
        
        session_id, user_role = session_manager.create_session(user_name, user_language)
        
        return jsonify({
            'success': True,
            'session_id': session_id,
            'user_role': user_role
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/session/join', methods=['POST'])
def join_session():
    try:
        data = request.get_json()
        session_id = data.get('session_id')
        user_name = data.get('user_name')
        user_language = data.get('user_language')
        
        if not session_id or not user_name or not user_language:
            return jsonify({
                'success': False,
                'error': 'Session ID, user name and language are required'
            }), 400
        
        if not session_manager.session_exists(session_id):
            return jsonify({
                'success': False,
                'error': 'Session not found'
            }), 404
        
        result = session_manager.join_session(session_id, user_name, user_language)
        
        if not result:
            return jsonify({
                'success': False,
                'error': 'Session is full or invalid'
            }), 400
        
        other_user_socket = session_manager.get_other_user_socket(session_id, result['user_role'])
        if other_user_socket:
            socketio.emit('user_joined', {
                'user_name': user_name,
                'user_language': user_language
            }, room=other_user_socket)
        
        return jsonify({
            'success': True,
            'user_role': result['user_role'],
            'other_user': result['other_user']
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/session/<session_id>/info', methods=['GET'])
def get_session_info(session_id):
    try:
        session = session_manager.get_session(session_id)
        
        if not session:
            return jsonify({
                'success': False,
                'error': 'Session not found'
            }), 404
        
        return jsonify({
            'success': True,
            'session': {
                'session_id': session['session_id'],
                'users': session['users'],
                'created_at': session['created_at']
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/session/<session_id>/messages', methods=['GET'])
def get_messages(session_id):
    try:
        messages = session_manager.get_messages(session_id)
        
        if messages is None:
            return jsonify({
                'success': False,
                'error': 'Session not found'
            }), 404
        
        return jsonify({
            'success': True,
            'messages': messages
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/message/send', methods=['POST'])
def send_message():
    try:
        if 'audio' not in request.files:
            return jsonify({
                'success': False,
                'error': 'No audio file provided'
            }), 400
        
        audio_file = request.files['audio']
        session_id = request.form.get('session_id')
        user_role = request.form.get('user_role')
        source_lang = request.form.get('source_lang')
        target_lang = request.form.get('target_lang')
        
        if not all([session_id, user_role, source_lang, target_lang]):
            return jsonify({
                'success': False,
                'error': 'Missing required fields'
            }), 400
        
        if not session_manager.session_exists(session_id):
            return jsonify({
                'success': False,
                'error': 'Session not found'
            }), 404
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S_%f')
        filename = secure_filename(f'input_{timestamp}.webm')
        
        audio_input_dir = config.get('paths.audio_input')
        audio_path = os.path.join(audio_input_dir, filename)
        audio_file.save(audio_path)
        
        result = orchestrator.process_translation(
            audio_path,
            source_lang,
            target_lang
        )
        
        if result['success']:
            audio_output_path = result['audio_output']
            audio_filename = os.path.basename(audio_output_path)
            
            host = request.host
            audio_url = f'http://{host}/api/audio/{audio_filename}'
            
            message_data = {
                'sender_role': user_role,
                'original_text': result['transcription'],
                'translated_text': result['translation'],
                'audio_url': audio_url,
                'source_lang': source_lang,
                'target_lang': target_lang
            }
            
            session_manager.add_message(session_id, message_data)
            
            other_socket_id = session_manager.get_other_user_socket(session_id, user_role)
            if other_socket_id:
                socketio.emit('new_message', message_data, room=other_socket_id)
            
            return jsonify({
                'success': True,
                'transcription': result['transcription'],
                'translation': result['translation']
            })
        else:
            return jsonify({
                'success': False,
                'error': result['error']
            }), 500
    
    except Exception as e:
        print(f"ERROR COMPLETO: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/translate', methods=['POST'])
def translate():
    try:
        if 'audio' not in request.files:
            return jsonify({
                'success': False,
                'error': 'No audio file provided'
            }), 400
        
        audio_file = request.files['audio']
        source_lang = request.form.get('sourceLang')
        target_lang = request.form.get('targetLang')
        
        if not source_lang or not target_lang:
            return jsonify({
                'success': False,
                'error': 'Source and target languages are required'
            }), 400
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S_%f')
        filename = secure_filename(f'input_{timestamp}.webm')
        
        audio_input_dir = config.get('paths.audio_input')
        audio_path = os.path.join(audio_input_dir, filename)
        audio_file.save(audio_path)
        
        result = orchestrator.process_translation(
            audio_path,
            source_lang,
            target_lang
        )
        
        if result['success']:
            audio_output_path = result['audio_output']
            audio_filename = os.path.basename(audio_output_path)
            
            audio_url = f'http://192.168.100.23:3000/api/audio/{audio_filename}'
            
            return jsonify({
                'success': True,
                'audioUrl': audio_url,
                'transcription': result['transcription'],
                'translation': result['translation']
            })
        else:
            return jsonify({
                'success': False,
                'error': result['error']
            }), 500
    
    except Exception as e:
        print(f"ERROR COMPLETO: {str(e)}")  # Agregar esta línea
        import traceback
        traceback.print_exc()  # Agregar esta línea
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/audio/<filename>', methods=['GET'])
def get_audio(filename):
    try:
        print(f'Request for audio file: {filename}')
        audio_output_dir = config.get('paths.audio_output')
        audio_path = os.path.join(audio_output_dir, filename)
        
        print(f'Looking for audio at: {audio_path}')
        print(f'File exists: {os.path.exists(audio_path)}')
        
        if not os.path.exists(audio_path):
            print(f'Audio file not found: {audio_path}')
            return jsonify({
                'success': False,
                'error': 'Audio file not found'
            }), 404
        
        print(f'Serving audio file: {audio_path}')
        response = send_file(
            audio_path,
            mimetype='audio/mpeg',
            as_attachment=False
        )
        response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        response.headers['Pragma'] = 'no-cache'
        response.headers['Expires'] = '0'
        return response
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/history', methods=['GET'])
def get_history():
    try:
        limit = request.args.get('limit', 10, type=int)
        history = orchestrator.get_translation_history(limit)
        
        return jsonify({
            'success': True,
            'history': history
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'success': True,
        'status': 'healthy',
        'timestamp': datetime.now().isoformat()
    })


@socketio.on('connect')
def handle_connect():
    print(f'Client connected: {request.sid}')


@socketio.on('disconnect')
def handle_disconnect():
    print(f'Client disconnected: {request.sid}')


@socketio.on('join_session')
def handle_join_session(data):
    try:
        session_id = data.get('session_id')
        user_role = data.get('user_role')
        
        if session_id and user_role:
            join_room(session_id)
            session_manager.update_socket_id(session_id, user_role, request.sid)
            print(f'User {user_role} joined session {session_id} with socket {request.sid}')
            
            emit('session_joined', {
                'success': True,
                'session_id': session_id
            })
    except Exception as e:
        print(f'Error joining session: {str(e)}')
        emit('error', {'message': str(e)})


if __name__ == '__main__':
    host = api_config.get('host', '0.0.0.0')
    port = api_config.get('port', 3000)
    debug = api_config.get('debug', True)
    
    print(f"Starting server on {host}:{port}")
    socketio.run(app, host=host, port=port, debug=debug)
