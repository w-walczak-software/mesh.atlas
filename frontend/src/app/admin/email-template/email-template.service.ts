import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { Page } from '../model/admin.model';
import {
  EmailTemplateDto,
  EmailTemplateSummaryDto,
  EmailTemplateUpdateRequest,
} from '../model/admin.model';

@Injectable({ providedIn: 'root' })
export class EmailTemplateService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.APIUrl}/api/v1/admin/email-templates`;

  findAll(page: number, size: number): Observable<Page<EmailTemplateSummaryDto>> {
    return this.http.get<Page<EmailTemplateSummaryDto>>(this.base, {
      params: { page, size, sort: 'code,asc' },
    });
  }

  findById(id: string): Observable<EmailTemplateDto> {
    return this.http.get<EmailTemplateDto>(`${this.base}/${id}`);
  }

  update(id: string, request: EmailTemplateUpdateRequest): Observable<EmailTemplateDto> {
    return this.http.put<EmailTemplateDto>(`${this.base}/${id}`, request);
  }

  deactivate(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
