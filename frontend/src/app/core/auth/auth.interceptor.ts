import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { EMPTY, from, switchMap } from 'rxjs';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith('/atlas')) {
    return next(req);
  }

  const auth = inject(AuthService);

  return from(auth.ensureFreshToken()).pipe(
    switchMap(token => {
      if (!token) return EMPTY;
      return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
    }),
  );
};
