import { Injectable, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import type { NavItem, NavigationConfig } from './navigation.model';

@Injectable({ providedIn: 'root' })
export class NavigationService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  private readonly allItems = toSignal(
    this.http.get<NavigationConfig>('/navigation.json').pipe(
      map(c => c.items),
      catchError(() => of([] as NavItem[]))
    ),
    { initialValue: [] as NavItem[] }
  );

  readonly items = computed(() =>
    this.filterByRoles(this.allItems(), this.auth.roles())
  );

  private filterByRoles(items: NavItem[], roles: string[]): NavItem[] {
    return items
      .filter(item => item.roles.some(r => roles.includes(r)))
      .map(item => ({
        ...item,
        children: item.children
          ? this.filterByRoles(item.children, roles)
          : undefined,
      }));
  }
}
