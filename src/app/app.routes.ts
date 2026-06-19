import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'mediter',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadChildren: () => import('./pages/login/login.routes').then((m) => m.routes),
  },
  {
    path: 'mediter',
    canActivate: [authGuard],
    loadChildren: () => import('./pages/timer/timer.routes').then((m) => m.routes),
  },
  {
    path: 'parcours',
    canActivate: [authGuard],
    loadChildren: () => import('./pages/parcours/parcours.routes').then((m) => m.routes),
  },
  {
    path: 'settings',
    canActivate: [authGuard],
    loadChildren: () => import('./pages/settings/settings.routes').then((m) => m.routes),
  },
  {
    path: 'timer',
    redirectTo: 'mediter',
    pathMatch: 'full',
  },
  {
    path: 'history',
    redirectTo: 'parcours',
    pathMatch: 'full',
  },
  {
    path: 'stats',
    redirectTo: 'parcours',
    pathMatch: 'full',
  },
];
