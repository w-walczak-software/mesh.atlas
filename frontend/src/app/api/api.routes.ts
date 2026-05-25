import { Routes } from '@angular/router';
import { atlasUserGuard } from '@core/auth/auth.guard';

export const apiRoutes: Routes = [
  {
    path: '',
    canActivate: [atlasUserGuard],
    loadComponent: () => import('./apis/apis').then(m => m.Apis),
  },
  {
    path: 'new',
    canActivate: [atlasUserGuard],
    loadComponent: () => import('./api-form/api-form').then(m => m.ApiForm),
  },
  {
    path: ':id/edit',
    canActivate: [atlasUserGuard],
    loadComponent: () => import('./api-form/api-form').then(m => m.ApiForm),
  },
];
