import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private socket: Socket | null = null;
  private messageSubject = new Subject<any>();
  private connectedSubject = new Subject<boolean>();
  private userJoinedSubject = new Subject<any>();

  public message$ = this.messageSubject.asObservable();
  public connected$ = this.connectedSubject.asObservable();
  public userJoined$ = this.userJoinedSubject.asObservable();

  connect(serverUrl: string): void {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.connectedSubject.next(true);
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      this.connectedSubject.next(false);
    });

    this.socket.on('new_message', (data: any) => {
      console.log('New message received:', data);
      this.messageSubject.next(data);
    });

    this.socket.on('user_joined', (data: any) => {
      console.log('User joined session:', data);
      this.userJoinedSubject.next(data);
    });

    this.socket.on('error', (error: any) => {
      console.error('WebSocket error:', error);
    });
  }

  joinSession(sessionId: string, userRole: string): void {
    if (this.socket?.connected) {
      this.socket.emit('join_session', {
        session_id: sessionId,
        user_role: userRole
      });
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}
