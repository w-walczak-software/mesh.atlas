import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { RevisionEntryDto } from './history.model';
import { DataDomainAttachmentHistoryDto } from '../../datadomain/model/data-domain.model';
import { ApiAttachmentHistoryDto, ApiConsumerSystemHistoryDto, ApiEnvironmentHistoryDto, ApiOwnerHistoryDto } from '../../api/model/api.model';

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

  getDataDomainRevisions(id: string): Observable<RevisionEntryDto<unknown>[]> {
    return this.http.get<RevisionEntryDto<unknown>[]>(
      `${this.base}/api/v1/data-domains/${id}/revisions`,
    );
  }

  getDataDomainAttachmentHistory(id: string): Observable<DataDomainAttachmentHistoryDto[]> {
    return this.http.get<DataDomainAttachmentHistoryDto[]>(
      `${this.base}/api/v1/data-domains/${id}/attachment-history`,
    );
  }

  getTransportLayerRevisions(id: string): Observable<RevisionEntryDto<unknown>[]> {
    return this.http.get<RevisionEntryDto<unknown>[]>(
      `${this.base}/api/v1/transport-layers/${id}/revisions`,
    );
  }

  getApiRevisions(id: string): Observable<RevisionEntryDto<unknown>[]> {
    return this.http.get<RevisionEntryDto<unknown>[]>(
      `${this.base}/api/v1/apis/${id}/revisions`,
    );
  }

  getApiOwnerHistory(id: string): Observable<ApiOwnerHistoryDto[]> {
    return this.http.get<ApiOwnerHistoryDto[]>(
      `${this.base}/api/v1/apis/${id}/owner-history`,
    );
  }

  getApiAttachmentHistory(id: string): Observable<ApiAttachmentHistoryDto[]> {
    return this.http.get<ApiAttachmentHistoryDto[]>(
      `${this.base}/api/v1/apis/${id}/attachment-history`,
    );
  }

  getApiConsumerSystemHistory(id: string): Observable<ApiConsumerSystemHistoryDto[]> {
    return this.http.get<ApiConsumerSystemHistoryDto[]>(
      `${this.base}/api/v1/apis/${id}/consumer-system-history`,
    );
  }

  getApiEnvironmentHistory(id: string): Observable<ApiEnvironmentHistoryDto[]> {
    return this.http.get<ApiEnvironmentHistoryDto[]>(
      `${this.base}/api/v1/apis/${id}/environment-history`,
    );
  }

  getSystemParameterRevisions(id: string): Observable<RevisionEntryDto<unknown>[]> {
    return this.http.get<RevisionEntryDto<unknown>[]>(
      `${this.base}/api/v1/admin/system-parameters/${id}/revisions`,
    );
  }

  getEmailTemplateRevisions(id: string): Observable<RevisionEntryDto<unknown>[]> {
    return this.http.get<RevisionEntryDto<unknown>[]>(
      `${this.base}/api/v1/admin/email-templates/${id}/revisions`,
    );
  }
}
