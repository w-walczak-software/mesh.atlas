import { Routes } from '@angular/router';
import { atlasUserGuard } from '@core/auth/auth.guard';

export const apiRoutes: Routes = [
  {
    path: '',
    canActivate: [atlasUserGuard],
    loadComponent: () => import('./apis/apis').then(m => m.Apis),
  },
  {
    path: 'graph',
    canActivate: [atlasUserGuard],
    loadComponent: () => import('./api-graph/api-graph').then(m => m.ApiGraph),
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
