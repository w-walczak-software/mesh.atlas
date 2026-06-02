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
        loadChildren: () =>
          import('./api/api.routes').then(m => m.apiRoutes),
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
        path: 'it-systems',
        loadChildren: () =>
          import('./itsystem/itsystem.routes').then(m => m.itsystemRoutes),
      },
      {
        path: 'transport-layers',
        loadChildren: () =>
          import('./transportlayer/transportlayer.routes').then(m => m.transportLayerRoutes),
      },
      {
        path: 'data-domains',
        loadChildren: () =>
          import('./datadomain/data-domain.routes').then(m => m.dataDomainRoutes),
      },
      {
        path: 'dictionaries',
        loadChildren: () =>
          import('./dictionary/dictionary.routes').then(m => m.dictionaryRoutes),
      },
      {
        path: 'admin',
        loadChildren: () => import('./admin/admin.routes').then(m => m.adminRoutes),
      },
      {
        path: 'settings',
        loadComponent: () => import('./settings/settings').then(m => m.Settings),
      },
      {
        path: 'profile',
        loadComponent: () => import('./profile/profile').then(m => m.Profile),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
