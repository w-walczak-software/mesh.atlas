import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import {
  TransportLayerCreateRequest,
  TransportLayerDto,
  TransportLayerSearchParams,
  TransportLayerSummaryDto,
  TransportLayerUpdateRequest,
} from '../model/transport-layer.model';

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

@Injectable({ providedIn: 'root' })
export class TransportLayerService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.APIUrl}/api/v1/transport-layers`;

  findAll(params: TransportLayerSearchParams): Observable<Page<TransportLayerSummaryDto>> {
    let p = new HttpParams();
    if (params.query)  p = p.set('query',  params.query);
    if (params.active !== undefined) p = p.set('active', String(params.active));
    if (params.page  !== undefined) p = p.set('page',   String(params.page));
    if (params.size  !== undefined) p = p.set('size',   String(params.size));
    if (params.sort)   p = p.set('sort',   params.sort);
    return this.http.get<Page<TransportLayerSummaryDto>>(this.base, { params: p });
  }

  findById(id: string): Observable<TransportLayerDto> {
    return this.http.get<TransportLayerDto>(`${this.base}/${id}`);
  }

  create(request: TransportLayerCreateRequest): Observable<TransportLayerDto> {
    return this.http.post<TransportLayerDto>(this.base, request);
  }

  update(id: string, request: TransportLayerUpdateRequest): Observable<TransportLayerDto> {
    return this.http.put<TransportLayerDto>(`${this.base}/${id}`, request);
  }

  deactivate(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
