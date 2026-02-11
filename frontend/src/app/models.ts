export interface Language {
  code: string;
  name: string;
}

export interface TranslationRequest {
  audioBlob: Blob;
  sourceLang: string;
  targetLang: string;
}

export interface TranslationResponse {
  success: boolean;
  audioUrl?: string;
  transcription?: string;
  translation?: string;
  error?: string;
}

export enum RecordingState {
  IDLE = 'idle',
  RECORDING = 'recording',
  PROCESSING = 'processing',
  PLAYING = 'playing'
}

export interface Session {
  sessionId: string;
  userRole: 'user1' | 'user2';
  myName: string;
  myLanguage: string;
  otherUserName: string;
  otherUserLanguage: string;
}

export interface Message {
  id?: string;
  isMine: boolean;
  senderRole: string;
  originalText: string;
  translatedText: string;
  audioUrl?: string;
  timestamp: Date;
  isPlaying?: boolean;
}

export interface SessionCreateResponse {
  success: boolean;
  session_id: string;
  user_role: string;
  error?: string;
}

export interface SessionJoinResponse {
  success: boolean;
  user_role: string;
  other_user: {
    name: string;
    language: string;
  };
  error?: string;
}
