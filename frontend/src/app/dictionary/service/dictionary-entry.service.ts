import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { DictionaryEntryCreateRequest, DictionaryEntryDto, DictionaryEntryUpdateRequest, Page } from '../model/dictionary.model';

@Injectable({ providedIn: 'root' })
export class DictionaryEntryService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.APIUrl}/api/v1`;

  findByTypeCode(typeCode: string, active = true): Observable<DictionaryEntryDto[]> {
    const params = new HttpParams().set('active', active);
    return this.http.get<DictionaryEntryDto[]>(
      `${this.apiUrl}/dictionary-types/${typeCode}/entries`,
      { params },
    );
  }

  findByTypeIdPaged(typeId: string, active?: boolean, page = 0, size = 20): Observable<Page<DictionaryEntryDto>> {
    let params = new HttpParams().set('page', page).set('size', size).set('sort', 'displayOrder');
    if (active !== undefined) {
      params = params.set('active', active);
    }
    return this.http.get<Page<DictionaryEntryDto>>(
      `${this.apiUrl}/dictionary-types/${typeId}/entries/page`,
      { params },
    );
  }

  create(typeId: string, request: DictionaryEntryCreateRequest): Observable<DictionaryEntryDto> {
    return this.http.post<DictionaryEntryDto>(
      `${this.apiUrl}/dictionary-types/${typeId}/entries`,
      request,
    );
  }

  update(id: string, request: DictionaryEntryUpdateRequest): Observable<DictionaryEntryDto> {
    return this.http.put<DictionaryEntryDto>(`${this.apiUrl}/dictionary-entries/${id}`, request);
  }

  deactivate(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/dictionary-entries/${id}`);
  }
}
