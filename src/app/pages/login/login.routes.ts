import { Routes } from '@angular/router';
import { guestGuard } from '../../guards/auth.guard';
import { LoginPage } from './login.page';

export const routes: Routes = [
  { path: '', component: LoginPage, canActivate: [guestGuard] },
];
