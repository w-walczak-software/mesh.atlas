import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import {
  PipelineDictionaryMappingDto,
  PipelineDictionaryMappingInitResult,
  PipelineDictionaryMappingRequest,
  PipelineDictionaryMappingUpdateValueRequest,
} from '../model/integration.model';

@Injectable({ providedIn: 'root' })
export class IntegrationDictionaryMappingService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = (pipelineId: string) =>
    `${environment.APIUrl}/api/v1/integration/pipelines/${pipelineId}/mappings`;

  findAll(pipelineId: string): Observable<PipelineDictionaryMappingDto[]> {
    return this.http.get<PipelineDictionaryMappingDto[]>(this.baseUrl(pipelineId));
  }

  create(pipelineId: string, request: PipelineDictionaryMappingRequest): Observable<PipelineDictionaryMappingDto> {
    return this.http.post<PipelineDictionaryMappingDto>(this.baseUrl(pipelineId), request);
  }

  initialize(pipelineId: string): Observable<PipelineDictionaryMappingInitResult> {
    return this.http.post<PipelineDictionaryMappingInitResult>(`${this.baseUrl(pipelineId)}/initialize`, {});
  }

  update(pipelineId: string, id: string, request: PipelineDictionaryMappingRequest): Observable<PipelineDictionaryMappingDto> {
    return this.http.put<PipelineDictionaryMappingDto>(`${this.baseUrl(pipelineId)}/${id}`, request);
  }

  updateValue(pipelineId: string, id: string, request: PipelineDictionaryMappingUpdateValueRequest): Observable<PipelineDictionaryMappingDto> {
    return this.http.patch<PipelineDictionaryMappingDto>(`${this.baseUrl(pipelineId)}/${id}/value`, request);
  }

  delete(pipelineId: string, id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl(pipelineId)}/${id}`);
  }
}
