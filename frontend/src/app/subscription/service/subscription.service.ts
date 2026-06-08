import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import {
  ApiSubscriptionAdminRequest,
  ApiSubscriptionDto,
  ApiSubscriptionSelfRequest,
  ApiSubscriptionStatsDto,
  ApiSubscriptionSummaryDto,
} from '../model/subscription.model';
import { Page } from '../../api/model/api.model';

@Injectable({ providedIn: 'root' })
export class SubscriptionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.APIUrl}/api/v1/subscriptions`;
  private readonly adminUrl = `${environment.APIUrl}/api/v1/admin/subscriptions`;

  // ── Self-subscription ──────────────────────────────────────────────────────

  subscribe(request: ApiSubscriptionSelfRequest): Observable<ApiSubscriptionDto> {
    return this.http.post<ApiSubscriptionDto>(this.baseUrl, request);
  }

  unsubscribe(subscriptionId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${subscriptionId}`);
  }

  getMySubscriptions(page = 0, size = 20): Observable<Page<ApiSubscriptionSummaryDto>> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sort', 'subscribedAt,desc');
    return this.http.get<Page<ApiSubscriptionSummaryDto>>(`${this.baseUrl}/my`, { params });
  }

  getStats(): Observable<ApiSubscriptionStatsDto> {
    return this.http.get<ApiSubscriptionStatsDto>(`${this.baseUrl}/stats`);
  }

  // ── Per-API subscriber view ────────────────────────────────────────────────

  getSubscribersForApi(apiId: string, page = 0, size = 20): Observable<Page<ApiSubscriptionSummaryDto>> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sort', 'subscribedAt,desc');
    return this.http.get<Page<ApiSubscriptionSummaryDto>>(
      `${environment.APIUrl}/api/v1/apis/${apiId}/subscriptions`,
      { params }
    );
  }

  // ── Admin CRUD ─────────────────────────────────────────────────────────────

  adminGetAll(page = 0, size = 20): Observable<Page<ApiSubscriptionDto>> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sort', 'subscribedAt,desc');
    return this.http.get<Page<ApiSubscriptionDto>>(this.adminUrl, { params });
  }

  adminCreate(request: ApiSubscriptionAdminRequest): Observable<ApiSubscriptionDto> {
    return this.http.post<ApiSubscriptionDto>(this.adminUrl, request);
  }

  adminUpdate(id: string, request: ApiSubscriptionAdminRequest): Observable<ApiSubscriptionDto> {
    return this.http.put<ApiSubscriptionDto>(`${this.adminUrl}/${id}`, request);
  }

  adminDelete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.adminUrl}/${id}`);
  }
}
