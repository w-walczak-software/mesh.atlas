import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import {
  Page,
  SyncRegistryDto,
  SyncRegistryItemDto,
  SyncRegistrySummaryDto,
} from '../model/integration.model';


@Injectable({ providedIn: 'root' })
export class SyncRegistryService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.APIUrl}/api/v1/integration/sync-registry`;

  findAll(
    pipelineId: string | null,
    page = 0,
    size = 20,
    filters: { status?: string | null; pipelineCode?: string | null } = {},
  ): Observable<Page<SyncRegistrySummaryDto>> {
    let params = new HttpParams().set('page', page).set('size', size).set('sort', 'executedAt,desc');
    if (pipelineId) params = params.set('pipelineId', pipelineId);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.pipelineCode?.trim()) params = params.set('pipelineCode', filters.pipelineCode.trim());
    return this.http.get<Page<SyncRegistrySummaryDto>>(this.baseUrl, { params });
  }

  findById(id: string): Observable<SyncRegistryDto> {
    return this.http.get<SyncRegistryDto>(`${this.baseUrl}/${id}`);
  }

  findItems(syncRegistryId: string, page = 0, size = 50): Observable<Page<SyncRegistryItemDto>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<Page<SyncRegistryItemDto>>(`${this.baseUrl}/${syncRegistryId}/items`, { params });
  }

  abandon(id: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${id}/abandon`, null);
  }
}
