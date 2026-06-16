import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import {
  IntegrationPipelineCreateRequest,
  IntegrationPipelineDto,
  IntegrationPipelineSummaryDto,
  IntegrationPipelineUpdateRequest,
  Page,
  SyncTriggerDto,
} from '../model/integration.model';

@Injectable({ providedIn: 'root' })
export class IntegrationPipelineService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.APIUrl}/api/v1/integration/pipelines`;

  findAll(
    page = 0,
    size = 20,
    filters: {
      active?: boolean | null;
      code?: string | null;
      name?: string | null;
      status?: string | null;
      targetEntity?: string | null;
    } = {},
  ): Observable<Page<IntegrationPipelineSummaryDto>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (filters.active != null) params = params.set('active', String(filters.active));
    if (filters.code?.trim()) params = params.set('code', filters.code.trim());
    if (filters.name?.trim()) params = params.set('name', filters.name.trim());
    if (filters.status) params = params.set('status', filters.status);
    if (filters.targetEntity) params = params.set('targetEntity', filters.targetEntity);
    return this.http.get<Page<IntegrationPipelineSummaryDto>>(this.baseUrl, { params });
  }

  findById(id: string): Observable<IntegrationPipelineDto> {
    return this.http.get<IntegrationPipelineDto>(`${this.baseUrl}/${id}`);
  }

  create(request: IntegrationPipelineCreateRequest): Observable<IntegrationPipelineDto> {
    return this.http.post<IntegrationPipelineDto>(this.baseUrl, request);
  }

  update(id: string, request: IntegrationPipelineUpdateRequest): Observable<IntegrationPipelineDto> {
    return this.http.put<IntegrationPipelineDto>(`${this.baseUrl}/${id}`, request);
  }

  deactivate(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  uploadDsl(id: string, xmlContent: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${id}/dsl`, xmlContent, {
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  getDslUrl(id: string): string {
    return `${this.baseUrl}/${id}/dsl`;
  }

  triggerSync(id: string): Observable<SyncTriggerDto> {
    return this.http.post<SyncTriggerDto>(`${this.baseUrl}/${id}/sync`, {});
  }
}
