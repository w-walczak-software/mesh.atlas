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
  {
    path: 'settings',
    canActivate: [atlasAdminGuard],
    loadComponent: () => import('./settings/system-parameters').then(m => m.SystemParameters),
  },
  {
    path: 'email-settings',
    canActivate: [atlasAdminGuard],
    loadComponent: () => import('./settings/email-settings').then(m => m.EmailSettings),
  },
  {
    path: 'email-templates',
    canActivate: [atlasAdminGuard],
    loadComponent: () => import('./email-template/email-templates').then(m => m.EmailTemplates),
  },
  {
    path: 'subscriptions',
    canActivate: [atlasAdminGuard],
    loadComponent: () => import('./subscriptions/admin-subscriptions').then(m => m.AdminSubscriptions),
  },
];
