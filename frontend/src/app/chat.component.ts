import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AudioService } from './audio.service';
import { TranslationService } from './translation.service';
import { SessionService } from './session.service';
import { WebsocketService } from './websocket.service';
import { Message, Session, RecordingState } from './models';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit, OnDestroy {
  session: Session | null = null;
  messages: Message[] = [];
  
  isRecording = false;
  isProcessing = false;
  errorMessage = '';
  
  private subscription = new Subscription();

  constructor(
    private audioService: AudioService,
    private translationService: TranslationService,
    private sessionService: SessionService,
    private websocketService: WebsocketService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.session = this.sessionService.getCurrentSession();
    
    if (!this.session) {
      this.router.navigate(['/']);
      return;
    }

    this.websocketService.connect('http://192.168.100.23:3000');
    
    this.subscription.add(
      this.websocketService.connected$.subscribe(connected => {
        if (connected && this.session) {
          this.websocketService.joinSession(this.session.sessionId, this.session.userRole);
        }
      })
    );

    this.subscription.add(
      this.websocketService.message$.subscribe(data => {
        this.onNewMessage(data);
      })
    );

    this.subscription.add(
      this.websocketService.userJoined$.subscribe(data => {
        this.onUserJoined(data);
      })
    );

    this.loadMessages();
  }

  loadMessages(): void {
    if (!this.session) return;

    this.sessionService.getMessages(this.session.sessionId).subscribe({
      next: (response) => {
        if (response.success && response.messages) {
          this.messages = response.messages.map((msg: any) => ({
            id: msg.id,
            isMine: msg.sender_role === this.session?.userRole,
            senderRole: msg.sender_role,
            originalText: msg.original_text,
            translatedText: msg.translated_text,
            audioUrl: msg.audio_url,
            timestamp: new Date(msg.timestamp),
            isPlaying: false
          }));
        }
      },
      error: (error) => {
        console.error('Error loading messages:', error);
      }
    });
  }

  async onRecordStart(): Promise<void> {
    try {
      this.errorMessage = '';
      this.isRecording = true;
      await this.audioService.startRecording();
    } catch (error: any) {
      this.errorMessage = error.message || 'Error al iniciar grabacion';
      console.error('Recording error:', error);
      this.isRecording = false;
    }
  }

  async onRecordStop(): Promise<void> {
    if (!this.session) return;

    try {
      const audioBlob = await this.audioService.stopRecording();
      this.isRecording = false;

      if (audioBlob.size === 0) {
        this.errorMessage = 'No se grabo audio. Manten presionado el boton al menos 2 segundos mientras hablas.';
        return;
      }

      if (audioBlob.size < 5000) {
        this.errorMessage = 'Audio demasiado corto. Habla por al menos 2 segundos.';
        return;
      }

      this.isProcessing = true;

      this.subscription.add(
        this.translationService.sendMessage(
          this.session.sessionId,
          this.session.userRole,
          audioBlob,
          this.session.myLanguage,
          this.session.otherUserLanguage
        ).subscribe({
          next: (response) => {
            if (response.success) {
              const message: Message = {
                isMine: true,
                senderRole: this.session!.userRole,
                originalText: response.transcription || '',
                translatedText: response.translation || '',
                timestamp: new Date(),
                isPlaying: false
              };
              
              this.messages.push(message);
              this.scrollToBottom();
            } else {
              this.errorMessage = response.error || 'Error en la traduccion';
            }
            this.isProcessing = false;
          },
          error: (error) => {
            this.errorMessage = 'Error al comunicarse con el servidor';
            console.error('Translation error:', error);
            this.isProcessing = false;
          }
        })
      );
    } catch (error) {
      this.errorMessage = 'Error al detener grabacion';
      console.error('Stop recording error:', error);
      this.isRecording = false;
      this.isProcessing = false;
    }
  }

  onNewMessage(data: any): void {
    const message: Message = {
      isMine: false,
      senderRole: data.sender_role,
      originalText: data.original_text,
      translatedText: data.translated_text,
      audioUrl: data.audio_url,
      timestamp: new Date(),
      isPlaying: false
    };
    
    this.messages.push(message);
    this.scrollToBottom();
  }

  onUserJoined(data: any): void {
    if (this.session) {
      this.session.otherUserName = data.user_name;
      this.session.otherUserLanguage = data.user_language;
      this.sessionService.setCurrentSession(this.session);
      console.log('Other user joined:', data);
    }
  }

  async playMessage(message: Message): Promise<void> {
    if (!message.audioUrl || message.isPlaying) return;

    try {
      message.isPlaying = true;
      await this.audioService.playAudio(message.audioUrl);
      message.isPlaying = false;
    } catch (error) {
      console.error('Error playing audio:', error);
      message.isPlaying = false;
      this.errorMessage = 'Error al reproducir audio';
    }
  }

  getButtonText(): string {
    if (!this.session?.otherUserLanguage) {
      return 'Esperando otro usuario...';
    } else if (this.isRecording) {
      return 'Suelta para enviar';
    } else if (this.isProcessing) {
      return 'Procesando...';
    } else {
      return 'Manten presionado y habla';
    }
  }

  isButtonDisabled(): boolean {
    return this.isProcessing || !this.session?.otherUserLanguage;
  }

  getOtherUserName(): string {
    return this.session?.otherUserName || 'Esperando...';
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const container = document.querySelector('.messages-container');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, 100);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    this.audioService.cleanup();
    this.websocketService.disconnect();
  }
}
