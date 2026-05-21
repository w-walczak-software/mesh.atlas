import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { MatDialog } from '@angular/material/dialog';
import { catchError, finalize, throwError } from 'rxjs';
import { DialogService } from '@shared/dialogs/dialog.service';
import { LoadingService } from '@shared/loading/loading.service';

const ERROR_TITLE = 'errors.default';

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith('/atlas')) {
    return next(req);
  }

  const loading = inject(LoadingService);
  const dialogs = inject(DialogService);
  const transloco = inject(TranslocoService);
  const matDialog = inject(MatDialog);

  loading.increment();

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status >= 400) {
        if (matDialog.openDialogs.length === 0) {
          dialogs.error(transloco.translate<string>(ERROR_TITLE), resolveMessage(error, transloco));
        }
      }
      return throwError(() => error);
    }),
    finalize(() => loading.decrement()),
  );
};

interface ApiErrorBody {
  message?: string;
  code?: string;
  context?: string;
}

function resolveMessage(error: HttpErrorResponse, t: TranslocoService): string {
  const body = error.error;

  if (!body || typeof body !== 'object') {
    return t.translate<string>('errors.default');
  }

  const { message, code, context } = body as ApiErrorBody;

  if (code && context) {
    const translated = t.translate<string>(code);
    if (translated !== context) {
      return translated;
    }
  }

  return message ?? t.translate<string>('errors.default');
}
