import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { AdminRoleDto, AdminUserDto, Page, UserRolesUpdateRequest } from '../model/admin.model';

@Injectable({ providedIn: 'root' })
export class AdminUserService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.APIUrl}/api/v1/admin/users`;

  findAll(search?: string, page = 0, size = 20): Observable<Page<AdminUserDto>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (search?.trim()) {
      params = params.set('search', search.trim());
    }
    return this.http.get<Page<AdminUserDto>>(this.baseUrl, { params });
  }

  findById(id: string): Observable<AdminUserDto> {
    return this.http.get<AdminUserDto>(`${this.baseUrl}/${id}`);
  }

  getUserRoles(userId: string): Observable<AdminRoleDto[]> {
    return this.http.get<AdminRoleDto[]>(`${this.baseUrl}/${userId}/roles`);
  }

  setUserRoles(userId: string, request: UserRolesUpdateRequest): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${userId}/roles`, request);
  }
}
