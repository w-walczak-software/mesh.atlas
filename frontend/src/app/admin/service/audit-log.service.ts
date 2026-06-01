import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { AuditLogEntryDto, AuditLogSearchParams, Page } from '../model/admin.model';

@Injectable({ providedIn: 'root' })
export class AuditLogService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.APIUrl}/api/v1/admin/audit-log`;

  search(params: AuditLogSearchParams): Observable<Page<AuditLogEntryDto>> {
    let httpParams = new HttpParams()
      .set('page', params.page ?? 0)
      .set('size', params.size ?? 25)
      .set('sort', params.sort ?? 'eventTime,desc');

    if (params.actorUsername?.trim()) {
      httpParams = httpParams.set('actorUsername', params.actorUsername.trim());
    }
    if (params.category) {
      httpParams = httpParams.set('category', params.category);
    }
    if (params.action) {
      httpParams = httpParams.set('action', params.action);
    }
    if (params.resourceType) {
      httpParams = httpParams.set('resourceType', params.resourceType);
    }
    if (params.outcome) {
      httpParams = httpParams.set('outcome', params.outcome);
    }
    if (params.startDate) {
      httpParams = httpParams.set('startDate', params.startDate);
    }
    if (params.endDate) {
      httpParams = httpParams.set('endDate', params.endDate);
    }

    return this.http.get<Page<AuditLogEntryDto>>(this.baseUrl, { params: httpParams });
  }
}
