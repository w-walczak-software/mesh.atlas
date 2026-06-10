import { HttpEvent, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { map } from 'rxjs';

/**
 * Normalizes Spring Data VIA_DTO page responses to the flat structure expected
 * by the frontend Page<T> interface.
 *
 * VIA_DTO wraps pagination metadata in a nested "page" object:
 *   { content: [...], page: { totalElements, totalPages, number, size } }
 *
 * This interceptor flattens it back to:
 *   { content: [...], totalElements, totalPages, number, size }
 */
export const pageNormalizerInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(map((event: HttpEvent<unknown>) => {
    if (!(event instanceof HttpResponse)) return event;
    const body = event.body;
    if (isPagedModel(body)) {
      return event.clone({
        body: { content: body.content, ...body.page },
      });
    }
    return event;
  }));

interface SpringPagedModel {
  content: unknown[];
  page: { totalElements: number; totalPages: number; number: number; size: number };
}

function isPagedModel(body: unknown): body is SpringPagedModel {
  return (
    body !== null &&
    typeof body === 'object' &&
    Array.isArray((body as Record<string, unknown>)['content']) &&
    typeof (body as Record<string, unknown>)['page'] === 'object' &&
    (body as Record<string, unknown>)['page'] !== null &&
    'totalElements' in ((body as Record<string, unknown>)['page'] as object)
  );
}
