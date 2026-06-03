import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./pages/home/home.routes').then((m) => m.routes),
  },
  {
    path: 'timer',
    loadChildren: () =>
      import('./pages/timer/timer.routes').then((m) => m.routes),
  },
  {
    path: 'history',
    loadChildren: () =>
      import('./pages/history/history.routes').then((m) => m.routes),
  },
  {
    path: 'stats',
    loadChildren: () =>
      import('./pages/stats/stats.routes').then((m) => m.routes),
  },
  {
    path: 'settings',
    loadChildren: () =>
      import('./pages/settings/settings.routes').then((m) => m.routes),
  },
  {
    path: 'about',
    loadChildren: () =>
      import('./pages/about/about.routes').then((m) => m.routes),
  },
];
