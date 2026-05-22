import { Routes } from '@angular/router';
import { atlasUserGuard } from '@core/auth/auth.guard';

export const itsystemRoutes: Routes = [
  {
    path: '',
    canActivate: [atlasUserGuard],
    loadComponent: () => import('./it-systems/it-systems').then(m => m.ItSystems),
  },
  {
    path: 'new',
    canActivate: [atlasUserGuard],
    loadComponent: () => import('./it-system-form/it-system-form').then(m => m.ItSystemForm),
  },
  {
    path: ':id/edit',
    canActivate: [atlasUserGuard],
    loadComponent: () => import('./it-system-form/it-system-form').then(m => m.ItSystemForm),
  },
];
