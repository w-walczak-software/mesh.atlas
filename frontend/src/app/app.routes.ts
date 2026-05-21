import { Routes } from '@angular/router';
import { Shell } from './shell/shell';

export const routes: Routes = [
  {
    path: '',
    component: Shell,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./dashboard/dashboard').then(m => m.Dashboard),
      },
      {
        path: 'apis',
        loadComponent: () => import('./placeholder/placeholder').then(m => m.Placeholder),
        data: { title: 'API Registry' },
      },
      {
        path: 'environments',
        loadComponent: () => import('./placeholder/placeholder').then(m => m.Placeholder),
        data: { title: 'Environments' },
      },
      {
        path: 'subscriptions',
        loadComponent: () => import('./placeholder/placeholder').then(m => m.Placeholder),
        data: { title: 'Subscriptions' },
      },
      {
        path: 'analytics',
        loadComponent: () => import('./placeholder/placeholder').then(m => m.Placeholder),
        data: { title: 'Analytics' },
      },
      {
        path: 'dictionaries',
        loadChildren: () =>
          import('./dictionary/dictionary.routes').then(m => m.dictionaryRoutes),
      },
      {
        path: 'admin',
        loadComponent: () => import('./placeholder/placeholder').then(m => m.Placeholder),
        data: { title: 'Administration' },
      },
      {
        path: 'settings',
        loadComponent: () => import('./settings/settings').then(m => m.Settings),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
