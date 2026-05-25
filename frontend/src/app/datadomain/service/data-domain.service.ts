import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import {
  DataDomainAttachmentDto,
  DataDomainCreateRequest,
  DataDomainDto,
  DataDomainSearchParams,
  DataDomainSummaryDto,
  DataDomainUpdateRequest,
  Page,
} from '../model/data-domain.model';

@Injectable({ providedIn: 'root' })
export class DataDomainService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.APIUrl}/api/v1/data-domains`;

  findAll(params: DataDomainSearchParams): Observable<Page<DataDomainSummaryDto>> {
    let httpParams = new HttpParams()
      .set('page', params.page ?? 0)
      .set('size', params.size ?? 20)
      .set('sort', params.sort ?? 'name');
    if (params.query) httpParams = httpParams.set('query', params.query);
    if (params.tag) httpParams = httpParams.set('tag', params.tag);
    if (params.active !== undefined) httpParams = httpParams.set('active', params.active);
    if (params.groupId) httpParams = httpParams.set('groupId', params.groupId);
    return this.http.get<Page<DataDomainSummaryDto>>(this.baseUrl, { params: httpParams });
  }

  findById(id: string): Observable<DataDomainDto> {
    return this.http.get<DataDomainDto>(`${this.baseUrl}/${id}`);
  }

  create(request: DataDomainCreateRequest): Observable<DataDomainDto> {
    return this.http.post<DataDomainDto>(this.baseUrl, request);
  }

  update(id: string, request: DataDomainUpdateRequest): Observable<DataDomainDto> {
    return this.http.put<DataDomainDto>(`${this.baseUrl}/${id}`, request);
  }

  deactivate(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  findAttachments(domainId: string): Observable<DataDomainAttachmentDto[]> {
    return this.http.get<DataDomainAttachmentDto[]>(`${this.baseUrl}/${domainId}/attachments`);
  }

  uploadAttachment(domainId: string, file: File, description?: string | null): Observable<DataDomainAttachmentDto> {
    const formData = new FormData();
    formData.append('file', file);
    if (description) formData.append('description', description);
    return this.http.post<DataDomainAttachmentDto>(`${this.baseUrl}/${domainId}/attachments`, formData);
  }

  downloadAttachment(domainId: string, attachmentId: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${domainId}/attachments/${attachmentId}`, { responseType: 'blob' });
  }

  updateAttachmentDescription(domainId: string, attachmentId: string, description: string | null): Observable<DataDomainAttachmentDto> {
    return this.http.patch<DataDomainAttachmentDto>(
      `${this.baseUrl}/${domainId}/attachments/${attachmentId}`,
      { description },
    );
  }

  deleteAttachment(domainId: string, attachmentId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${domainId}/attachments/${attachmentId}`);
  }
}
