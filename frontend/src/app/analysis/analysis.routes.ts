import { Routes } from '@angular/router';
import { atlasUserGuard } from '../core/auth/auth.guard';

export const analysisRoutes: Routes = [
  {
    path: 'blast-radius',
    canActivate: [atlasUserGuard],
    loadComponent: () => import('./blast-radius/blast-radius').then(m => m.BlastRadius),
  },
  {
    path: '',
    redirectTo: 'blast-radius',
    pathMatch: 'full',
  },
];
