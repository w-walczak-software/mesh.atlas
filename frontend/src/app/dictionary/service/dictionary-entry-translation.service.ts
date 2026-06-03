import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { DictionaryEntryTranslationDto, DictionaryEntryTranslationRequest } from '../model/dictionary.model';

@Injectable({ providedIn: 'root' })
export class DictionaryEntryTranslationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.APIUrl}/api/v1/dictionary-entries`;

  findByEntryId(entryId: string): Observable<DictionaryEntryTranslationDto[]> {
    return this.http.get<DictionaryEntryTranslationDto[]>(`${this.baseUrl}/${entryId}/translations`);
  }

  save(entryId: string, langCode: string, request: DictionaryEntryTranslationRequest): Observable<DictionaryEntryTranslationDto> {
    return this.http.put<DictionaryEntryTranslationDto>(`${this.baseUrl}/${entryId}/translations/${langCode}`, request);
  }

  delete(entryId: string, langCode: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${entryId}/translations/${langCode}`);
  }
}
