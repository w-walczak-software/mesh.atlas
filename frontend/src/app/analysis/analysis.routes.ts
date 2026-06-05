import { Routes } from '@angular/router';
import { atlasUserGuard } from '../core/auth/auth.guard';

export const analysisRoutes: Routes = [
  {
    path: 'blast-radius',
    canActivate: [atlasUserGuard],
    loadComponent: () => import('./blast-radius/blast-radius').then(m => m.BlastRadius),
  },
  {
    path: 'deprecation-impact',
    canActivate: [atlasUserGuard],
    loadComponent: () => import('./deprecation-impact/deprecation-impact').then(m => m.DeprecationImpact),
  },
  {
    path: 'what-if',
    canActivate: [atlasUserGuard],
    loadComponent: () => import('./what-if/what-if').then(m => m.WhatIf),
  },
  {
    path: '',
    redirectTo: 'blast-radius',
    pathMatch: 'full',
  },
];
