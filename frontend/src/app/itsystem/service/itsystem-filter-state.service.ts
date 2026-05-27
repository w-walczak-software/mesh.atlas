import { Injectable, signal } from '@angular/core';

export interface ItSystemListFormSnapshot {
  query:                 string | null;
  ownerQuery:            string | null;
  tag:                   string | null;
  statusId:              string | null;
  lifecycleStageId:      string | null;
  businessCriticalityId: string | null;
  systemTypeId:          string | null;
  active:                boolean | null;
}

export interface ItSystemListStateSnapshot {
  form:        ItSystemListFormSnapshot;
  pageIndex:   number;
  pageSize:    number;
  selectedIds: string[];   // IDs of checked rows
}

/**
 * Singleton service that persists IT Systems list state across navigation to
 * the Integration Map and back.
 *
 * - ItSystems component writes here on every successful load.
 * - When the user returns from the graph → ItSystems reads and restores state.
 */
@Injectable({ providedIn: 'root' })
export class ItSystemFilterStateService {

  private readonly _snapshot = signal<ItSystemListStateSnapshot | null>(null);

  readonly snapshot = this._snapshot.asReadonly();

  save(state: ItSystemListStateSnapshot): void {
    this._snapshot.set(state);
  }

  clear(): void {
    this._snapshot.set(null);
  }
}
