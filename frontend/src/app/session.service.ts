import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Session, SessionCreateResponse, SessionJoinResponse } from './models';

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private apiUrl = 'http://192.168.100.23:3000/api';
  private currentSession: Session | null = null;

  constructor(private http: HttpClient) {}

  createSession(userName: string, userLanguage: string): Observable<SessionCreateResponse> {
    return this.http.post<SessionCreateResponse>(`${this.apiUrl}/session/create`, {
      user_name: userName,
      user_language: userLanguage
    });
  }

  joinSession(sessionId: string, userName: string, userLanguage: string): Observable<SessionJoinResponse> {
    return this.http.post<SessionJoinResponse>(`${this.apiUrl}/session/join`, {
      session_id: sessionId,
      user_name: userName,
      user_language: userLanguage
    });
  }

  getSessionInfo(sessionId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/session/${sessionId}/info`);
  }

  getMessages(sessionId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/session/${sessionId}/messages`);
  }

  setCurrentSession(session: Session): void {
    this.currentSession = session;
  }

  getCurrentSession(): Session | null {
    return this.currentSession;
  }

  clearSession(): void {
    this.currentSession = null;
  }
}
