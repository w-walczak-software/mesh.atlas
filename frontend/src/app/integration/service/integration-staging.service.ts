import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { StagingApiDto, StagingDataDomainDto, StagingItSystemDto } from '../model/integration.model';

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
}
