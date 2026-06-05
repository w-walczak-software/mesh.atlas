import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { BlastRadiusRequest, BlastRadiusResultDto, DeprecationImpactResultDto } from '../model/analysis.model';

@Injectable({ providedIn: 'root' })
export class AnalysisService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.APIUrl}/api/v1/analysis`;

  analyzeBlastRadius(request: BlastRadiusRequest): Observable<BlastRadiusResultDto> {
    return this.http.post<BlastRadiusResultDto>(`${this.baseUrl}/blast-radius`, request);
  }

  getDeprecationImpact(): Observable<DeprecationImpactResultDto> {
    return this.http.get<DeprecationImpactResultDto>(`${this.baseUrl}/deprecation-impact`);
  }
}
