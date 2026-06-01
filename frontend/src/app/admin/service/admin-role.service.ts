import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { AdminRoleDto } from '../model/admin.model';

@Injectable({ providedIn: 'root' })
export class AdminRoleService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.APIUrl}/api/v1/admin/roles`;

  findAll(): Observable<AdminRoleDto[]> {
    return this.http.get<AdminRoleDto[]>(this.baseUrl);
  }
}
