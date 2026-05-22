import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const atlasAdminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.hasRole('atlas_admin') || router.createUrlTree(['/dashboard']);
};

export const atlasUserGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.hasAnyRole(['atlas_admin', 'atlas_user']) || router.createUrlTree(['/dashboard']);
};
