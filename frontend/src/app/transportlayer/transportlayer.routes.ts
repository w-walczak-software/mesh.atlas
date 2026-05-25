import { Routes } from '@angular/router';
import { atlasUserGuard } from '@core/auth/auth.guard';

export const transportLayerRoutes: Routes = [
  {
    path: '',
    canActivate: [atlasUserGuard],
    loadComponent: () => import('./transport-layers/transport-layers').then(m => m.TransportLayers),
  },
  {
    path: 'new',
    canActivate: [atlasUserGuard],
    loadComponent: () => import('./transport-layer-form/transport-layer-form').then(m => m.TransportLayerForm),
  },
  {
    path: ':id/edit',
    canActivate: [atlasUserGuard],
    loadComponent: () => import('./transport-layer-form/transport-layer-form').then(m => m.TransportLayerForm),
  },
];
