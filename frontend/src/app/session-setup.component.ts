import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SessionService } from './session.service';
import { Language, Session } from './models';

@Component({
  selector: 'app-session-setup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="setup-container">
      <header class="header">
        <h1 class="title">AI Translator</h1>
        <p class="subtitle">Configuracion de Sesion</p>
      </header>

      <div class="error-message" *ngIf="errorMessage">
        {{ errorMessage }}
      </div>

      <div class="setup-section">
        <div class="option-card">
          <h2>Crear Nueva Sesion</h2>
          <div class="form-group">
            <label>Tu nombre:</label>
            <input 
              type="text" 
              [(ngModel)]="createName" 
              placeholder="Ingresa tu nombre"
              class="input-field">
          </div>
          <div class="form-group">
            <label>Tu idioma:</label>
            <select [(ngModel)]="createLanguage" class="select-field">
              <option *ngFor="let lang of languages" [value]="lang.code">
                {{ lang.name }}
              </option>
            </select>
          </div>
          <button 
            class="btn btn-primary" 
            (click)="onCreateSession()"
            [disabled]="isCreating || !createName">
            {{ isCreating ? 'Creando...' : 'Crear Sesion' }}
          </button>
        </div>

        <div class="divider">
          <span>O</span>
        </div>

        <div class="option-card">
          <h2>Unirse a Sesion Existente</h2>
          <div class="form-group">
            <label>Codigo de sesion:</label>
            <input 
              type="text" 
              [(ngModel)]="joinSessionId" 
              placeholder="ABC123"
              class="input-field session-code">
          </div>
          <div class="form-group">
            <label>Tu nombre:</label>
            <input 
              type="text" 
              [(ngModel)]="joinName" 
              placeholder="Ingresa tu nombre"
              class="input-field">
          </div>
          <div class="form-group">
            <label>Tu idioma:</label>
            <select [(ngModel)]="joinLanguage" class="select-field">
              <option *ngFor="let lang of languages" [value]="lang.code">
                {{ lang.name }}
              </option>
            </select>
          </div>
          <button 
            class="btn btn-secondary" 
            (click)="onJoinSession()"
            [disabled]="isJoining || !joinName || !joinSessionId">
            {{ isJoining ? 'Uniendose...' : 'Unirse' }}
          </button>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .setup-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .header {
      text-align: center;
      margin-bottom: 40px;
      color: white;
    }

    .title {
      font-size: 48px;
      font-weight: 700;
      margin: 0;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
    }

    .subtitle {
      font-size: 20px;
      margin: 10px 0 0 0;
      opacity: 0.9;
    }

    .error-message {
      background: #ff4444;
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      margin-bottom: 20px;
      max-width: 600px;
      text-align: center;
    }

    .setup-section {
      display: flex;
      gap: 40px;
      align-items: flex-start;
      flex-wrap: wrap;
      justify-content: center;
      max-width: 1200px;
    }

    .option-card {
      background: white;
      border-radius: 16px;
      padding: 30px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
      min-width: 320px;
      max-width: 400px;
    }

    .option-card h2 {
      margin: 0 0 25px 0;
      color: #333;
      font-size: 24px;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-group label {
      display: block;
      margin-bottom: 8px;
      color: #555;
      font-weight: 500;
    }

    .input-field,
    .select-field {
      width: 100%;
      padding: 12px;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 16px;
      transition: border-color 0.3s;
      box-sizing: border-box;
    }

    .input-field:focus,
    .select-field:focus {
      outline: none;
      border-color: #667eea;
    }

    .session-code {
      text-transform: uppercase;
      font-weight: 600;
      letter-spacing: 2px;
    }

    .btn {
      width: 100%;
      padding: 14px;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
      margin-top: 10px;
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
    }

    .btn-secondary {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      color: white;
    }

    .btn-secondary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(245, 87, 108, 0.4);
    }

    .divider {
      display: flex;
      align-items: center;
      color: white;
      font-size: 20px;
      font-weight: 600;
      margin: 0 20px;
    }

    .divider span {
      background: rgba(255,255,255,0.2);
      padding: 10px 20px;
      border-radius: 50%;
    }

    .session-code-display {
      background: white;
      border-radius: 16px;
      padding: 30px;
      margin-top: 30px;
      text-align: center;
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
      max-width: 500px;
    }

    .session-code-display h3 {
      color: #333;
      margin: 0 0 15px 0;
    }

    .session-code-display p {
      color: #666;
      margin: 10px 0;
    }

    .code-box {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      font-size: 36px;
      font-weight: 700;
      letter-spacing: 4px;
      padding: 20px;
      border-radius: 12px;
      margin: 20px 0;
      user-select: all;
    }

    .waiting-text {
      color: #667eea;
      font-style: italic;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    @media (max-width: 768px) {
      .setup-section {
        flex-direction: column;
        gap: 20px;
      }

      .divider {
        transform: rotate(90deg);
      }

      .option-card {
        min-width: 280px;
      }
    }
  `]
})
export class SessionSetupComponent {
  languages: Language[] = [
    { code: 'es', name: 'Español' },
    { code: 'en', name: 'English' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'it', name: 'Italiano' },
    { code: 'pt', name: 'Português' },
    { code: 'zh', name: '中文' },
    { code: 'ja', name: '日本語' }
  ];

  createName = '';
  createLanguage = 'es';
  joinSessionId = '';
  joinName = '';
  joinLanguage = 'en';
  
  isCreating = false;
  isJoining = false;
  errorMessage = '';

  constructor(
    private sessionService: SessionService,
    private router: Router
  ) {}

  onCreateSession(): void {
    if (!this.createName.trim()) {
      this.errorMessage = 'Por favor ingresa tu nombre';
      return;
    }

    this.isCreating = true;
    this.errorMessage = '';

    this.sessionService.createSession(this.createName, this.createLanguage).subscribe({
      next: (response) => {
        if (response.success) {
          const session: Session = {
            sessionId: response.session_id,
            userRole: response.user_role as 'user1' | 'user2',
            myName: this.createName,
            myLanguage: this.createLanguage,
            otherUserName: '',
            otherUserLanguage: ''
          };
          
          this.sessionService.setCurrentSession(session);
          this.router.navigate(['/chat']);
        } else {
          this.errorMessage = response.error || 'Error al crear la sesion';
          this.isCreating = false;
        }
      },
      error: (error) => {
        this.errorMessage = 'Error al conectar con el servidor';
        console.error('Error creating session:', error);
        this.isCreating = false;
      }
    });
  }

  onJoinSession(): void {
    if (!this.joinName.trim()) {
      this.errorMessage = 'Por favor ingresa tu nombre';
      return;
    }

    if (!this.joinSessionId.trim()) {
      this.errorMessage = 'Por favor ingresa el codigo de sesion';
      return;
    }

    this.isJoining = true;
    this.errorMessage = '';

    this.sessionService.joinSession(
      this.joinSessionId.toUpperCase(),
      this.joinName,
      this.joinLanguage
    ).subscribe({
      next: (response) => {
        if (response.success) {
          const session: Session = {
            sessionId: this.joinSessionId.toUpperCase(),
            userRole: response.user_role as 'user1' | 'user2',
            myName: this.joinName,
            myLanguage: this.joinLanguage,
            otherUserName: response.other_user.name,
            otherUserLanguage: response.other_user.language
          };
          
          this.sessionService.setCurrentSession(session);
          this.router.navigate(['/chat']);
        } else {
          this.errorMessage = response.error || 'Error al unirse a la sesion';
          this.isJoining = false;
        }
      },
      error: (error) => {
        this.errorMessage = 'Error al conectar con el servidor o sesion no encontrada';
        console.error('Error joining session:', error);
        this.isJoining = false;
      }
    });
  }
}
