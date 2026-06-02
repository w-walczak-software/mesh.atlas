import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import {
  ItSystemCreateRequest,
  ItSystemDto,
  ItSystemOwnerCreateRequest,
  ItSystemOwnerDto,
  ItSystemOwnerUpdateRequest,
  ItSystemSearchParams,
  ItSystemStatsDto,
  ItSystemSummaryDto,
  ItSystemUpdateRequest,
  Page,
} from '../model/itsystem.model';

@Injectable({ providedIn: 'root' })
export class ItSystemService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.APIUrl}/api/v1/it-systems`;

  findAll(params: ItSystemSearchParams): Observable<Page<ItSystemSummaryDto>> {
    let httpParams = new HttpParams()
      .set('page', params.page ?? 0)
      .set('size', params.size ?? 20)
      .set('sort', params.sort ?? 'name');
    if (params.query) httpParams = httpParams.set('query', params.query);
    if (params.statusId) httpParams = httpParams.set('statusId', params.statusId);
    if (params.lifecycleStageId) httpParams = httpParams.set('lifecycleStageId', params.lifecycleStageId);
    if (params.businessCriticalityId) httpParams = httpParams.set('businessCriticalityId', params.businessCriticalityId);
    if (params.systemTypeId) httpParams = httpParams.set('systemTypeId', params.systemTypeId);
    if (params.active !== undefined) httpParams = httpParams.set('active', params.active);
    if (params.ownerQuery) httpParams = httpParams.set('ownerQuery', params.ownerQuery);
    if (params.tag) httpParams = httpParams.set('tag', params.tag);
    return this.http.get<Page<ItSystemSummaryDto>>(this.baseUrl, { params: httpParams });
  }

  findById(id: string): Observable<ItSystemDto> {
    return this.http.get<ItSystemDto>(`${this.baseUrl}/${id}`);
  }

  create(request: ItSystemCreateRequest): Observable<ItSystemDto> {
    return this.http.post<ItSystemDto>(this.baseUrl, request);
  }

  update(id: string, request: ItSystemUpdateRequest): Observable<ItSystemDto> {
    return this.http.put<ItSystemDto>(`${this.baseUrl}/${id}`, request);
  }

  deactivate(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  findOwners(systemId: string): Observable<ItSystemOwnerDto[]> {
    return this.http.get<ItSystemOwnerDto[]>(`${this.baseUrl}/${systemId}/owners`);
  }

  createOwner(systemId: string, request: ItSystemOwnerCreateRequest): Observable<ItSystemOwnerDto> {
    return this.http.post<ItSystemOwnerDto>(`${this.baseUrl}/${systemId}/owners`, request);
  }

  updateOwner(systemId: string, ownerId: string, request: ItSystemOwnerUpdateRequest): Observable<ItSystemOwnerDto> {
    return this.http.put<ItSystemOwnerDto>(`${this.baseUrl}/${systemId}/owners/${ownerId}`, request);
  }

  deleteOwner(systemId: string, ownerId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${systemId}/owners/${ownerId}`);
  }

  getMyProducerSystems(): Observable<ItSystemSummaryDto[]> {
    return this.http.get<ItSystemSummaryDto[]>(`${this.baseUrl}/me/producer-systems`);
  }

  getStats(): Observable<ItSystemStatsDto> {
    return this.http.get<ItSystemStatsDto>(`${this.baseUrl}/stats`);
  }
}
