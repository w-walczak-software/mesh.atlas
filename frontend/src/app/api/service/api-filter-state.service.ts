import { Injectable, signal } from '@angular/core';
import { ApiGraphSearchCriteria } from '../model/api.model';

/** Snapshot of the APIs list search form */
export interface ApiListFormSnapshot {
  query:            string | null;
  tag:              string | null;
  statusId:         string | null;
  typeId:           string | null;
  producerSystemId: string | null;
  environmentId:    string | null;
  active:           boolean | null;
}

/** Full list state: form values + pagination */
export interface ApiListStateSnapshot {
  form:        ApiListFormSnapshot;
  pageIndex:   number;
  pageSize:    number;
  /**
   * Route to navigate to when the user presses "Back" in the graph.
   * Defaults to '/apis' when not set.
   */
  sourceRoute?: string;
  /**
   * Direct system ID filter injected from outside (e.g. IT Systems list).
   * Takes priority over / is merged with form.producerSystemId.
   */
  systemIds?:  string[];
}

/**
 * Singleton service that bridges the APIs list and the Integration Map.
 *
 * - Apis component writes here on every load → Map reads criteria.
 * - When user comes back from Map → Apis reads and restores form + pagination.
 * - IT Systems list writes here before navigating to Map (with sourceRoute + systemIds).
 */
@Injectable({ providedIn: 'root' })
export class ApiFilterStateService {

  private readonly _snapshot = signal<ApiListStateSnapshot | null>(null);

  /** Read-only snapshot; null when no state has been saved yet */
  readonly snapshot = this._snapshot.asReadonly();

  /** Persist current list state (called by Apis on every successful load) */
  save(state: ApiListStateSnapshot): void {
    this._snapshot.set(state);
  }

  /**
   * Called by IT Systems list before navigating to the graph.
   * Creates a minimal snapshot that filters the graph by the given system IDs
   * and records the return route as '/it-systems'.
   */
  saveFromItSystems(systemIds: string[]): void {
    this._snapshot.set({
      form: {
        query: null, tag: null, statusId: null, typeId: null,
        producerSystemId: null, environmentId: null, active: null,
      },
      pageIndex:   0,
      pageSize:    20,
      sourceRoute: '/it-systems',
      systemIds,
    });
  }

  /** Clear snapshot — called when the user resets the search form */
  clear(): void {
    this._snapshot.set(null);
  }

  /** Route the "Back" button in the graph should navigate to. */
  getSourceRoute(): string {
    return this._snapshot()?.sourceRoute ?? '/apis';
  }

  /**
   * True when at least one filter field is non-empty.
   * Used by ApiGraph to show the "Filtered view" chip.
   */
  hasActiveFilters(): boolean {
    const s = this._snapshot();
    if (!s) return false;
    const f = s.form;
    return !!(f.query || f.tag || f.statusId || f.typeId ||
              f.producerSystemId || f.environmentId || f.active !== null ||
              s.systemIds?.length);
  }

  /**
   * Maps list search fields to ApiGraphSearchCriteria.
   * Fields without a direct graph-endpoint equivalent are omitted.
   */
  toGraphCriteria(): ApiGraphSearchCriteria {
    const s = this._snapshot();
    if (!s) return {};
    const f = s.form;
    const out: ApiGraphSearchCriteria = {};
    if (f.query)  out.apiQuery  = f.query;
    if (f.tag)    out.apiTags   = [f.tag];
    if (f.statusId) out.statusIds = [f.statusId];
    if (f.typeId)   out.typeIds   = [f.typeId];

    // Merge direct systemIds + producerSystemId filter
    const systemIds: string[] = [...(s.systemIds ?? [])];
    if (f.producerSystemId) systemIds.push(f.producerSystemId);
    if (systemIds.length) out.systemIds = systemIds;

    return out;
  }
}
