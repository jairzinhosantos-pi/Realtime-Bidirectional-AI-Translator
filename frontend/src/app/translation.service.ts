import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TranslationResponse } from './models';

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private apiUrl = 'http://192.168.100.23:3000/api';
  constructor(private http: HttpClient) {}

  translate(audioBlob: Blob, sourceLang: string, targetLang: string): Observable<TranslationResponse> {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    formData.append('sourceLang', sourceLang);
    formData.append('targetLang', targetLang);

    return this.http.post<TranslationResponse>(`${this.apiUrl}/translate`, formData);
  }

  sendMessage(
    sessionId: string,
    userRole: string,
    audioBlob: Blob,
    sourceLang: string,
    targetLang: string
  ): Observable<TranslationResponse> {
    const formData = new FormData();
    formData.append('session_id', sessionId);
    formData.append('user_role', userRole);
    formData.append('audio', audioBlob, 'recording.webm');
    formData.append('source_lang', sourceLang);
    formData.append('target_lang', targetLang);

    return this.http.post<TranslationResponse>(`${this.apiUrl}/message/send`, formData);
  }
}
