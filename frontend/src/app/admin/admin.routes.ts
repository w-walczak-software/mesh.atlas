import { Routes } from '@angular/router';
import { atlasAdminGuard } from '@core/auth/auth.guard';

export const adminRoutes: Routes = [
  {
    path: '',
    redirectTo: 'users',
    pathMatch: 'full',
  },
  {
    path: 'users',
    canActivate: [atlasAdminGuard],
    loadComponent: () => import('./users/admin-users').then(m => m.AdminUsers),
  },
  {
    path: 'roles',
    canActivate: [atlasAdminGuard],
    loadComponent: () => import('./roles/admin-roles').then(m => m.AdminRoles),
  },
  {
    path: 'audit-log',
    canActivate: [atlasAdminGuard],
    loadComponent: () => import('./audit-log/audit-log').then(m => m.AuditLog),
  },
];
