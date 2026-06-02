import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { EmailConfigDto, EmailConfigSaveRequest, EmailLogDto, Page } from '../model/admin.model';

@Injectable({ providedIn: 'root' })
export class EmailConfigService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.APIUrl}/api/v1/admin/email-config`;

  get(): Observable<EmailConfigDto> {
    return this.http.get<EmailConfigDto>(this.baseUrl);
  }

  save(request: EmailConfigSaveRequest): Observable<EmailConfigDto> {
    return this.http.put<EmailConfigDto>(this.baseUrl, request);
  }

  sendTest(recipient: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/test`, { recipient });
  }

  getLog(page = 0, size = 20): Observable<Page<EmailLogDto>> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sort', 'sentAt,desc');
    return this.http.get<Page<EmailLogDto>>(`${this.baseUrl}/log`, { params });
  }
}
