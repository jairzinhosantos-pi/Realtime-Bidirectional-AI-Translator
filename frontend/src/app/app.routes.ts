import { Routes } from '@angular/router';
import { SessionSetupComponent } from './session-setup.component';
import { ChatComponent } from './chat.component';

export const routes: Routes = [
  { path: '', component: SessionSetupComponent },
  { path: 'chat', component: ChatComponent },
  { path: '**', redirectTo: '' }
];
