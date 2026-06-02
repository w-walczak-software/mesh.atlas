import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { Page, SystemParameterDto, SystemParameterUpdateRequest } from '../model/admin.model';

@Injectable({ providedIn: 'root' })
export class SystemParameterService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.APIUrl}/api/v1/admin/system-parameters`;

  findAll(page = 0, size = 50): Observable<Page<SystemParameterDto>> {
    const params = new HttpParams().set('page', page).set('size', size).set('sort', 'category,asc');
    return this.http.get<Page<SystemParameterDto>>(this.baseUrl, { params });
  }

  findByKey(key: string): Observable<SystemParameterDto> {
    return this.http.get<SystemParameterDto>(`${this.baseUrl}/by-key/${key}`);
  }

  update(id: string, request: SystemParameterUpdateRequest): Observable<SystemParameterDto> {
    return this.http.put<SystemParameterDto>(`${this.baseUrl}/${id}`, request);
  }
}
