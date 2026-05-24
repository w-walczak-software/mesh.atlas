import { Routes } from '@angular/router';
import { atlasUserGuard } from '@core/auth/auth.guard';

export const dataDomainRoutes: Routes = [
  {
    path: '',
    canActivate: [atlasUserGuard],
    loadComponent: () => import('./data-domains/data-domains').then(m => m.DataDomains),
  },
  {
    path: 'new',
    canActivate: [atlasUserGuard],
    loadComponent: () => import('./data-domain-form/data-domain-form').then(m => m.DataDomainForm),
  },
  {
    path: ':id/edit',
    canActivate: [atlasUserGuard],
    loadComponent: () => import('./data-domain-form/data-domain-form').then(m => m.DataDomainForm),
  },
];
