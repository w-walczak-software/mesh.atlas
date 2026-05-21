import { inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { DictionaryTypeDto, DictionaryTypeUpdateRequest, Page } from '../model/dictionary.model';

@Injectable({ providedIn: 'root' })
export class DictionaryTypeService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.APIUrl}/api/v1/dictionary-types`;

  readonly lastSelectedId = signal<string | null>(null);

  findAll(active?: boolean, page = 0, size = 20): Observable<Page<DictionaryTypeDto>> {
    let params = new HttpParams().set('page', page).set('size', size).set('sort', 'code');
    if (active !== undefined) {
      params = params.set('active', active);
    }
    return this.http.get<Page<DictionaryTypeDto>>(this.baseUrl, { params });
  }

  findById(id: string): Observable<DictionaryTypeDto> {
    return this.http.get<DictionaryTypeDto>(`${this.baseUrl}/${id}`);
  }

  update(id: string, request: DictionaryTypeUpdateRequest): Observable<DictionaryTypeDto> {
    return this.http.put<DictionaryTypeDto>(`${this.baseUrl}/${id}`, request);
  }

  deactivate(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
