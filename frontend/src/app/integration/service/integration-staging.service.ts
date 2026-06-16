import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import {
  StagingApiDto,
  StagingBulkActionRequest,
  StagingDataDomainDto,
  StagingItSystemDto,
  StagingPromoteResultDto,
} from '../model/integration.model';

@Injectable({ providedIn: 'root' })
export class IntegrationStagingService {
  private readonly http = inject(HttpClient);

  private stagingUrl(pipelineId: string): string {
    return `${environment.APIUrl}/api/v1/integration/pipelines/${pipelineId}/staging`;
  }

  findItSystems(pipelineId: string): Observable<StagingItSystemDto[]> {
    return this.http.get<StagingItSystemDto[]>(`${this.stagingUrl(pipelineId)}/it-systems`);
  }

  findApis(pipelineId: string): Observable<StagingApiDto[]> {
    return this.http.get<StagingApiDto[]>(`${this.stagingUrl(pipelineId)}/apis`);
  }

  findDataDomains(pipelineId: string): Observable<StagingDataDomainDto[]> {
    return this.http.get<StagingDataDomainDto[]>(`${this.stagingUrl(pipelineId)}/data-domains`);
  }

  accept(pipelineId: string, ids: string[]): Observable<void> {
    const body: StagingBulkActionRequest = { ids };
    return this.http.patch<void>(`${this.stagingUrl(pipelineId)}/accept`, body);
  }

  reject(pipelineId: string, ids: string[]): Observable<void> {
    const body: StagingBulkActionRequest = { ids };
    return this.http.patch<void>(`${this.stagingUrl(pipelineId)}/reject`, body);
  }

  promote(pipelineId: string): Observable<StagingPromoteResultDto> {
    return this.http.post<StagingPromoteResultDto>(`${this.stagingUrl(pipelineId)}/promote`, null);
  }
}
