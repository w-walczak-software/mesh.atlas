import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { UserProfileDto } from './profile.model';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.APIUrl}/api/v1/profile`;

  getMyProfile(): Observable<UserProfileDto> {
    return this.http.get<UserProfileDto>(this.baseUrl);
  }
}
