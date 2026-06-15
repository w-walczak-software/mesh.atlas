import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import {
  IntegrationDatasourceCreateRequest,
  IntegrationDatasourceDto,
  IntegrationDatasourceSummaryDto,
  IntegrationDatasourceUpdateRequest,
  Page,
  TestConnectionResult,
} from '../model/integration.model';

@Injectable({ providedIn: 'root' })
export class IntegrationDatasourceService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.APIUrl}/api/v1/integration/datasources`;

  findAll(page = 0, size = 20): Observable<Page<IntegrationDatasourceSummaryDto>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<Page<IntegrationDatasourceSummaryDto>>(this.baseUrl, { params });
  }

  findById(id: string): Observable<IntegrationDatasourceDto> {
    return this.http.get<IntegrationDatasourceDto>(`${this.baseUrl}/${id}`);
  }

  create(request: IntegrationDatasourceCreateRequest): Observable<IntegrationDatasourceDto> {
    return this.http.post<IntegrationDatasourceDto>(this.baseUrl, request);
  }

  update(id: string, request: IntegrationDatasourceUpdateRequest): Observable<IntegrationDatasourceDto> {
    return this.http.put<IntegrationDatasourceDto>(`${this.baseUrl}/${id}`, request);
  }

  deactivate(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  testConnection(id: string): Observable<TestConnectionResult> {
    return this.http.post<TestConnectionResult>(`${this.baseUrl}/${id}/test`, {});
  }
}
