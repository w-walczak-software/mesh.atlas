import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { EMPTY, catchError, from, switchMap, throwError } from 'rxjs';
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
    catchError(err => {
      if (err instanceof HttpErrorResponse && err.status === 401) {
        auth.login();
        return EMPTY;
      }
      return throwError(() => err);
    }),
  );
};
