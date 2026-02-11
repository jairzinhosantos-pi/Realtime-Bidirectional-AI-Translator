import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { RecordingState } from './models';

@Injectable({
  providedIn: 'root'
})
export class AudioService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private isRecording = false;
  
  private stateSubject = new BehaviorSubject<RecordingState>(RecordingState.IDLE);
  public state$ = this.stateSubject.asObservable();

  async initMicrophone(): Promise<boolean> {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('getUserMedia is not supported in this browser');
        throw new Error('Tu navegador no soporta grabacion de audio');
      }

      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });
      return true;
    } catch (error: any) {
      console.error('Error accessing microphone:', error);
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        throw new Error('Permiso de microfono denegado. Por favor permite el acceso al microfono.');
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        throw new Error('No se encontro ningun microfono. Por favor conecta un microfono.');
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        throw new Error('El microfono esta siendo usado por otra aplicacion.');
      } else {
        throw new Error('Error al acceder al microfono: ' + error.message);
      }
    }
  }

  async startRecording(): Promise<void> {
    if (this.isRecording) {
      console.warn('Already recording');
      return;
    }

    console.log('Starting new recording session');
    
    this.audioChunks = [];
    this.mediaRecorder = null;
    this.isRecording = false;
    
    if (!this.stream) {
      await this.initMicrophone();
    }
    
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
      ? 'audio/webm;codecs=opus'
      : MediaRecorder.isTypeSupported('audio/webm')
      ? 'audio/webm'
      : '';
    
    if (!mimeType) {
      throw new Error('No supported audio format found');
    }

    console.log('Creating NEW MediaRecorder with mimeType:', mimeType);
    console.log('audioChunks cleared, length:', this.audioChunks.length);
    
    this.mediaRecorder = new MediaRecorder(this.stream!, {
      mimeType: mimeType,
      audioBitsPerSecond: 128000
    });

    this.mediaRecorder.ondataavailable = (event) => {
      console.log('Data available:', event.data.size, 'bytes');
      if (event.data && event.data.size > 0) {
        this.audioChunks.push(event.data);
        console.log('Chunk added, total chunks now:', this.audioChunks.length);
      }
    };

    this.mediaRecorder.onstart = () => {
      console.log('Recording started - MediaRecorder active');
      this.isRecording = true;
    };

    this.mediaRecorder.onstop = () => {
      console.log('Recording stopped event fired');
      this.isRecording = false;
    };

    this.mediaRecorder.onerror = (event: Event) => {
      console.error('MediaRecorder error:', event);
      this.isRecording = false;
      this.audioChunks = [];
    };

    this.mediaRecorder.start(1000);
    this.stateSubject.next(RecordingState.RECORDING);
  }

  stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        console.warn('No MediaRecorder instance');
        resolve(new Blob());
        return;
      }

      if (this.mediaRecorder.state === 'inactive') {
        console.warn('MediaRecorder already inactive');
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        this.audioChunks = [];
        resolve(audioBlob);
        return;
      }

      const stopHandler = () => {
        console.log('Stop handler called, chunks count:', this.audioChunks.length);
        console.log('Chunk sizes:', this.audioChunks.map(c => c.size));
        
        const totalSize = this.audioChunks.reduce((sum, chunk) => sum + chunk.size, 0);
        console.log('Total audio data:', totalSize, 'bytes');
        
        if (this.audioChunks.length === 0) {
          console.error('No audio chunks recorded!');
          this.stateSubject.next(RecordingState.IDLE);
          this.audioChunks = [];
          this.mediaRecorder = null;
          resolve(new Blob());
          return;
        }
        
        const audioBlob = new Blob(this.audioChunks, { 
          type: this.mediaRecorder?.mimeType || 'audio/webm'
        });
        
        console.log('Created blob:', audioBlob.size, 'bytes, type:', audioBlob.type);
        
        this.audioChunks = [];
        this.mediaRecorder = null;
        this.isRecording = false;
        
        this.stateSubject.next(RecordingState.IDLE);
        resolve(audioBlob);
      };

      this.mediaRecorder.onstop = stopHandler;

      this.mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error on stop:', event);
        this.audioChunks = [];
        this.mediaRecorder = null;
        this.isRecording = false;
        this.stateSubject.next(RecordingState.IDLE);
        reject(new Error('Error recording audio'));
      };

      try {
        console.log('Stopping MediaRecorder, current state:', this.mediaRecorder.state);
        this.mediaRecorder.stop();
      } catch (error) {
        console.error('Error stopping MediaRecorder:', error);
        this.audioChunks = [];
        this.mediaRecorder = null;
        this.isRecording = false;
        this.stateSubject.next(RecordingState.IDLE);
        reject(error);
      }
    });
  }

  playAudio(audioUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log('Playing audio from URL:', audioUrl);
      
      const audio = new Audio(audioUrl);
      
      audio.onloadstart = () => {
        console.log('Audio loading started');
      };

      audio.oncanplay = () => {
        console.log('Audio can play');
      };

      audio.onended = () => {
        console.log('Audio playback ended');
        this.stateSubject.next(RecordingState.IDLE);
        resolve();
      };

      audio.onerror = (error) => {
        console.error('Audio playback error:', error);
        if (error && typeof error === 'object' && 'target' in error) {
          const audioElement = (error as Event).target as HTMLAudioElement;
          console.error('Audio error code:', audioElement?.error?.code);
          console.error('Audio error message:', audioElement?.error?.message);
        }
        this.stateSubject.next(RecordingState.IDLE);
        reject(error);
      };

      this.stateSubject.next(RecordingState.PLAYING);
      
      audio.play()
        .then(() => {
          console.log('Audio playback started successfully');
        })
        .catch((error) => {
          console.error('Error starting audio playback:', error);
          this.stateSubject.next(RecordingState.IDLE);
          reject(error);
        });
    });
  }

  setState(state: RecordingState): void {
    this.stateSubject.next(state);
  }

  getState(): RecordingState {
    return this.stateSubject.value;
  }

  cleanup(): void {
    console.log('Cleaning up audio service');
    
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop();
      } catch (e) {
        console.error('Error stopping recorder during cleanup:', e);
      }
    }
    this.mediaRecorder = null;
    this.isRecording = false;
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => {
        track.stop();
        console.log('Stopped track:', track.kind);
      });
      this.stream = null;
    }
    
    this.audioChunks = [];
    this.stateSubject.next(RecordingState.IDLE);
  }
}
