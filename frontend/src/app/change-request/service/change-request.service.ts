import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Page } from '../../api/model/api.model';
import {
  ChangeRequestDto,
  ChangeRequestReviewRequest,
  ChangeRequestSearchParams,
  ChangeRequestSubmitRequest,
  ChangeRequestSummaryDto,
  MarkImplementedRequest,
} from '../model/change-request.model';

@Injectable({ providedIn: 'root' })
export class ChangeRequestService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.APIUrl}/api/v1/change-requests`;

  submit(request: ChangeRequestSubmitRequest): Observable<ChangeRequestDto> {
    return this.http.post<ChangeRequestDto>(this.base, request);
  }

  findAll(params: ChangeRequestSearchParams): Observable<Page<ChangeRequestSummaryDto>> {
    let p = new HttpParams();
    if (params.apiId) p = p.set('apiId', params.apiId);
    if (params.status) p = p.set('status', params.status);
    if (params.changeTypeId) p = p.set('changeTypeId', params.changeTypeId);
    if (params.priorityId) p = p.set('priorityId', params.priorityId);
    if (params.requesterEmail) p = p.set('requesterEmail', params.requesterEmail);
    if (params.searchText) p = p.set('searchText', params.searchText);
    if (params.fromDate) p = p.set('fromDate', params.fromDate);
    if (params.toDate) p = p.set('toDate', params.toDate);
    if (params.page != null) p = p.set('page', params.page);
    if (params.size != null) p = p.set('size', params.size);
    if (params.sort) p = p.set('sort', params.sort);
    return this.http.get<Page<ChangeRequestSummaryDto>>(this.base, { params: p });
  }

  findMine(page = 0, size = 20): Observable<Page<ChangeRequestSummaryDto>> {
    const p = new HttpParams().set('page', page).set('size', size).set('sort', 'createdAt,desc');
    return this.http.get<Page<ChangeRequestSummaryDto>>(`${this.base}/my`, { params: p });
  }

  findById(id: string): Observable<ChangeRequestDto> {
    return this.http.get<ChangeRequestDto>(`${this.base}/${id}`);
  }

  findByApi(apiId: string, page = 0, size = 20): Observable<Page<ChangeRequestSummaryDto>> {
    const p = new HttpParams().set('page', page).set('size', size).set('sort', 'createdAt,desc');
    return this.http.get<Page<ChangeRequestSummaryDto>>(`${this.base}/by-api/${apiId}`, { params: p });
  }

  review(id: string, request: ChangeRequestReviewRequest): Observable<ChangeRequestDto> {
    return this.http.post<ChangeRequestDto>(`${this.base}/${id}/review`, request);
  }

  markImplemented(id: string, request: MarkImplementedRequest): Observable<ChangeRequestDto> {
    return this.http.post<ChangeRequestDto>(`${this.base}/${id}/implement`, request);
  }

  cancel(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
