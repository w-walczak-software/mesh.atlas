import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import {
  ApiAttachmentDto,
  ApiConsumerSystemHistoryDto,
  ApiCreateRequest,
  ApiDto,
  ApiGraphResultDto,
  ApiGraphSearchCriteria,
  ApiOwnerCreateRequest,
  ApiOwnerDto,
  ApiOwnerUpdateRequest,
  ApiSearchParams,
  ApiStatsDto,
  ApiSummaryDto,
  ApiUpdateRequest,
  Page,
} from '../model/api.model';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.APIUrl}/api/v1/apis`;

  findAll(params: ApiSearchParams): Observable<Page<ApiSummaryDto>> {
    let p = new HttpParams()
      .set('page', params.page ?? 0)
      .set('size', params.size ?? 20)
      .set('sort', params.sort ?? 'name');
    if (params.query) p = p.set('query', params.query);
    if (params.statusId) p = p.set('statusId', params.statusId);
    if (params.typeId) p = p.set('typeId', params.typeId);
    if (params.transportLayerId) p = p.set('transportLayerId', params.transportLayerId);
    if (params.producerSystemIds?.length) params.producerSystemIds.forEach(id => { p = p.append('producerSystemIds', id); });
    if (params.consumerSystemIds?.length) params.consumerSystemIds.forEach(id => { p = p.append('consumerSystemIds', id); });
    if (params.tag) p = p.set('tag', params.tag);
    if (params.environmentId) p = p.set('environmentId', params.environmentId);
    if (params.active !== undefined) p = p.set('active', String(params.active));
    if (params.description) p = p.set('description', params.description);
    if (params.integrationPatternId) p = p.set('integrationPatternId', params.integrationPatternId);
    if (params.dataDomainIds?.length) params.dataDomainIds.forEach(id => { p = p.append('dataDomainIds', id); });
    return this.http.get<Page<ApiSummaryDto>>(this.baseUrl, { params: p });
  }

  findById(id: string): Observable<ApiDto> {
    return this.http.get<ApiDto>(`${this.baseUrl}/${id}`);
  }

  create(request: ApiCreateRequest): Observable<ApiDto> {
    return this.http.post<ApiDto>(this.baseUrl, request);
  }

  update(id: string, request: ApiUpdateRequest): Observable<ApiDto> {
    return this.http.put<ApiDto>(`${this.baseUrl}/${id}`, request);
  }

  deactivate(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  findOwners(apiId: string): Observable<ApiOwnerDto[]> {
    return this.http.get<ApiOwnerDto[]>(`${this.baseUrl}/${apiId}/owners`);
  }

  createOwner(apiId: string, request: ApiOwnerCreateRequest): Observable<ApiOwnerDto> {
    return this.http.post<ApiOwnerDto>(`${this.baseUrl}/${apiId}/owners`, request);
  }

  updateOwner(apiId: string, ownerId: string, request: ApiOwnerUpdateRequest): Observable<ApiOwnerDto> {
    return this.http.put<ApiOwnerDto>(`${this.baseUrl}/${apiId}/owners/${ownerId}`, request);
  }

  deleteOwner(apiId: string, ownerId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${apiId}/owners/${ownerId}`);
  }

  findAttachments(apiId: string): Observable<ApiAttachmentDto[]> {
    return this.http.get<ApiAttachmentDto[]>(`${this.baseUrl}/${apiId}/attachments`);
  }

  uploadAttachment(
    apiId: string,
    file: File,
    description?: string | null,
    contractTypeId?: string | null,
    attachmentVersion?: string | null,
    attachmentStatusId?: string | null,
  ): Observable<ApiAttachmentDto> {
    const formData = new FormData();
    formData.append('file', file);
    if (description)         formData.append('description',       description);
    if (contractTypeId)      formData.append('contractTypeId',    contractTypeId);
    if (attachmentVersion)   formData.append('attachmentVersion', attachmentVersion);
    if (attachmentStatusId)  formData.append('attachmentStatusId', attachmentStatusId);
    return this.http.post<ApiAttachmentDto>(`${this.baseUrl}/${apiId}/attachments`, formData);
  }

  downloadAttachment(apiId: string, attachmentId: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${apiId}/attachments/${attachmentId}/download`, { responseType: 'blob' });
  }

  updateAttachment(
    apiId: string,
    attachmentId: string,
    description: string | null,
    contractTypeId: string | null,
    attachmentVersion: string | null,
    attachmentStatusId: string | null,
  ): Observable<ApiAttachmentDto> {
    return this.http.put<ApiAttachmentDto>(
      `${this.baseUrl}/${apiId}/attachments/${attachmentId}`,
      { description, contractTypeId, attachmentVersion, attachmentStatusId },
    );
  }

  deleteAttachment(apiId: string, attachmentId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${apiId}/attachments/${attachmentId}`);
  }

  getConsumerSystemHistory(apiId: string): Observable<ApiConsumerSystemHistoryDto[]> {
    return this.http.get<ApiConsumerSystemHistoryDto[]>(`${this.baseUrl}/${apiId}/consumer-system-history`);
  }

  findGraph(criteria: ApiGraphSearchCriteria = {}): Observable<ApiGraphResultDto> {
    return this.http.post<ApiGraphResultDto>(`${this.baseUrl}/graph/search`, criteria);
  }

  getStats(): Observable<ApiStatsDto> {
    return this.http.get<ApiStatsDto>(`${this.baseUrl}/stats`);
  }
}
