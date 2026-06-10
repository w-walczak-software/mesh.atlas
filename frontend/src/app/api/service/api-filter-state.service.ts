import { Injectable, signal } from '@angular/core';
import { ApiGraphSearchCriteria } from '../model/api.model';

/** Snapshot of the APIs list search form */
export interface ApiListFormSnapshot {
  query:               string | null;
  tag:                 string | null;
  statusId:            string | null;
  typeId:              string | null;
  active:              boolean | null;
  description:         string | null;
  producerSystemIds:   string[];
  consumerSystemIds:   string[];
  transportLayerId:    string | null;
  integrationPatternId: string | null;
  dataDomainIds:       string[];
  environmentId:       string | null;
  attachmentContent:   string | null;
  ownerName:           string | null;
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
  /**
   * Specific API IDs selected via checkboxes in the API Registry.
   * When present, the graph shows only these APIs (ignores other filters).
   */
  apiIds?:     string[];
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
        query: null, tag: null, statusId: null, typeId: null, active: null,
        description: null, producerSystemIds: [], consumerSystemIds: [], transportLayerId: null,
        integrationPatternId: null, dataDomainIds: [], environmentId: null,
        attachmentContent: null, ownerName: null,
      },
      pageIndex:   0,
      pageSize:    20,
      sourceRoute: '/it-systems',
      systemIds,
    });
  }

  /**
   * Called by Data Domains list before navigating to the graph.
   * Filters the graph to show only APIs that have at least one of the given data domain IDs assigned.
   */
  saveFromDataDomains(dataDomainIds: string[]): void {
    this._snapshot.set({
      form: {
        query: null, tag: null, statusId: null, typeId: null, active: null,
        description: null, producerSystemIds: [], consumerSystemIds: [], transportLayerId: null,
        integrationPatternId: null, dataDomainIds, environmentId: null,
        attachmentContent: null, ownerName: null,
      },
      pageIndex:   0,
      pageSize:    20,
      sourceRoute: '/data-domains',
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
    return !!(f.query || f.tag || f.ownerName || f.statusId || f.typeId || f.active !== null ||
              f.description || f.attachmentContent || f.transportLayerId || f.integrationPatternId ||
              f.producerSystemIds?.length || f.consumerSystemIds?.length ||
              f.dataDomainIds?.length || f.environmentId || s.systemIds?.length);
  }

  /**
   * Maps list search fields to ApiGraphSearchCriteria.
   * When specific apiIds are stored (checked rows from API Registry),
   * they take priority — other filters are ignored by the graph.
   */
  toGraphCriteria(): ApiGraphSearchCriteria {
    const s = this._snapshot();
    if (!s) return {};

    // Specific API selection wins — graph shows only those APIs
    if (s.apiIds?.length) {
      return { apiIds: s.apiIds };
    }

    const f = s.form;
    const out: ApiGraphSearchCriteria = {};

    // Text / basic filters
    if (f.query)    out.apiQuery  = f.query;
    if (f.tag)      out.apiTags   = [f.tag];
    if (f.statusId) out.statusIds = [f.statusId];
    if (f.typeId)   out.typeIds   = [f.typeId];

    // Single-value filters collapsed to single-element arrays
    if (f.transportLayerId)    out.transportLayerIds    = [f.transportLayerId];
    if (f.integrationPatternId) out.integrationPatternIds = [f.integrationPatternId];
    if (f.environmentId)        out.environmentIds        = [f.environmentId];

    // Multi-value filters (direct pass-through)
    if (f.producerSystemIds?.length)  out.producerSystemIds = f.producerSystemIds;
    if (f.consumerSystemIds?.length)  out.consumerSystemIds = f.consumerSystemIds;
    if (f.dataDomainIds?.length)      out.dataDomainIds     = f.dataDomainIds;

    // IT Systems navigation: OR-logic system filter (producer OR consumer)
    if (s.systemIds?.length) out.systemIds = s.systemIds;

    return out;
  }
}
