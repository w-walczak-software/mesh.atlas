import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { RevisionEntryDto } from './history.model';

@Injectable({ providedIn: 'root' })
export class HistoryService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.APIUrl;

  getItSystemRevisions(id: string): Observable<RevisionEntryDto<unknown>[]> {
    return this.http.get<RevisionEntryDto<unknown>[]>(
      `${this.base}/api/v1/it-systems/${id}/revisions`,
    );
  }

  getItSystemOwnerRevisions(systemId: string, ownerId: string): Observable<RevisionEntryDto<unknown>[]> {
    return this.http.get<RevisionEntryDto<unknown>[]>(
      `${this.base}/api/v1/it-systems/${systemId}/owners/${ownerId}/revisions`,
    );
  }

  getDictionaryEntryRevisions(id: string): Observable<RevisionEntryDto<unknown>[]> {
    return this.http.get<RevisionEntryDto<unknown>[]>(
      `${this.base}/api/v1/dictionary-entries/${id}/revisions`,
    );
  }

  getDictionaryTypeRevisions(id: string): Observable<RevisionEntryDto<unknown>[]> {
    return this.http.get<RevisionEntryDto<unknown>[]>(
      `${this.base}/api/v1/dictionary-types/${id}/revisions`,
    );
  }
}
