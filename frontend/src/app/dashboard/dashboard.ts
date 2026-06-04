import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslocoDirective, TranslocoService, provideTranslocoScope } from '@jsverse/transloco';
import { DataTable } from '@shared/data-table/data-table';
import { AtlasPageTitle } from '@shared/page-title/page-title';
import { TableConfig } from '@shared/data-table/data-table.models';
import { ApiService } from '../api/service/api.service';
import { ApiSummaryDto } from '../api/model/api.model';
import { ItSystemService } from '../itsystem/service/itsystem.service';

interface KpiCard {
  labelKey: string;
  value: string;
  deltaKey: string;
  deltaParams: Record<string, unknown>;
  positive: boolean;
  icon: string;
  color: 'primary' | 'secondary' | 'tertiary' | 'error' | 'surface';
}

interface CoverageItem {
  labelKey: string;
  pct: number;
  warn: boolean;
}

@Component({
  selector: 'app-dashboard',
  imports: [
    AtlasPageTitle,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    DataTable,
    TranslocoDirective,
  ],
  providers: [provideTranslocoScope('dashboard')],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard {
  private readonly t  = inject(TranslocoService);
  private readonly router = inject(Router);
  private readonly apiService = inject(ApiService);
  private readonly itSystemService = inject(ItSystemService);

  protected readonly lang = toSignal(this.t.langChanges$, { initialValue: this.t.getActiveLang() });

  private readonly apiStats     = toSignal(this.apiService.getStats(),         { initialValue: null });
  private readonly itStats      = toSignal(this.itSystemService.getStats(),     { initialValue: null });
  private readonly recentPage   = toSignal(
    this.apiService.findAll({ page: 0, size: 10, sort: 'createdAt,desc' }),
    { initialValue: null },
  );

  protected readonly loading = computed(() => this.apiStats() === null || this.itStats() === null);
  protected readonly deprecatedCount = computed(() => this.apiStats()?.deprecated ?? 0);

  // ── KPI cards ──────────────────────────────────────────────────────────────

  protected readonly kpis = computed<KpiCard[]>(() => {
    const api = this.apiStats();
    const it  = this.itStats();
    const pct = api && api.total > 0 ? Math.round((api.active / api.total) * 100) : 0;

    return [
      {
        labelKey:   'dashboard.kpi.registeredApis',
        value:      api ? api.total.toString() : '—',
        deltaKey:   api?.addedLastMonth ? 'dashboard.kpi.deltaAdded' : 'dashboard.kpi.deltaNoNew',
        deltaParams: { n: api?.addedLastMonth ?? 0 },
        positive:   (api?.addedLastMonth ?? 0) > 0,
        icon:       'api',
        color:      'primary',
      },
      {
        labelKey:   'dashboard.kpi.activeApis',
        value:      api ? api.active.toString() : '—',
        deltaKey:   'dashboard.kpi.deltaActivePct',
        deltaParams: { pct },
        positive:   pct >= 80,
        icon:       'check_circle',
        color:      'secondary',
      },
      {
        labelKey:   'dashboard.kpi.itSystems',
        value:      it ? it.total.toString() : '—',
        deltaKey:   it?.addedLastMonth ? 'dashboard.kpi.deltaAdded' : 'dashboard.kpi.deltaNoNew',
        deltaParams: { n: it?.addedLastMonth ?? 0 },
        positive:   (it?.addedLastMonth ?? 0) > 0,
        icon:       'dns',
        color:      'surface',
      },
      {
        labelKey:   'dashboard.kpi.inactiveApis',
        value:      api ? api.inactive.toString() : '—',
        deltaKey:   'dashboard.kpi.deltaOfTotal',
        deltaParams: { total: api?.total ?? 0 },
        positive:   false,
        icon:       'warning',
        color:      'error',
      },
    ];
  });

  // ── Coverage ───────────────────────────────────────────────────────────────

  protected readonly coverage = computed<CoverageItem[]>(() => {
    const api = this.apiStats();
    const total = api?.total ?? 0;
    const pct = (n: number) => total > 0 ? Math.round((n / total) * 100) : 0;
    return [
      { labelKey: 'dashboard.coverage.documented',    pct: pct(api?.withDocumentation ?? 0), warn: pct(api?.withDocumentation ?? 0) < 70 },
      { labelKey: 'dashboard.coverage.versioned',      pct: pct(api?.withVersion       ?? 0), warn: pct(api?.withVersion       ?? 0) < 70 },
      { labelKey: 'dashboard.coverage.withSla',        pct: pct(api?.withSla           ?? 0), warn: pct(api?.withSla           ?? 0) < 50 },
      { labelKey: 'dashboard.coverage.withDataDomain', pct: pct(api?.withDataDomain    ?? 0), warn: pct(api?.withDataDomain    ?? 0) < 70 },
    ];
  });

  // ── Recent APIs table ──────────────────────────────────────────────────────

  protected readonly recentApis = computed<ApiSummaryDto[]>(() =>
    this.recentPage()?.content ?? [],
  );

  protected readonly recentTableConfig = computed<TableConfig<ApiSummaryDto>>(() => {
    this.lang(); // rebuild on language change
    const tr = (key: string) => this.t.translate<string>(key);

    return {
      tableId:         'dashboard-recent-apis',
      showFilter:      false,
      showCheckboxes:  false,
      pagination: { mode: 'frontend', pageSize: 10 },
      columns: [
        {
          key:      'name',
          label:    tr('dashboard.table.name'),
          sortable: true,
          cellRender: (row) => ({ text: row.name }),
        },
        {
          key:      'status',
          label:    tr('dashboard.table.status'),
          sortable: false,
          cellRender: (row) => ({
            badge: row.status
              ? { label: row.status.name, color: this.statusColor(row.status.code) }
              : undefined,
          }),
        },
        {
          key:      'type',
          label:    tr('dashboard.table.type'),
          sortable: false,
          cellRender: (row) => ({ text: row.type?.name ?? '—' }),
        },
        {
          key:      'producerSystem',
          label:    tr('dashboard.table.producer'),
          sortable: false,
          cellRender: (row) => ({ text: row.producerSystem?.name ?? '—' }),
        },
        {
          key:      'transportLayer',
          label:    tr('dashboard.table.transport'),
          sortable: false,
          cellRender: (row) => ({ text: row.transportLayer?.name ?? '—' }),
        },
      ],
      rowDblClick: (row) => this.router.navigate(['/apis'], { state: { selectId: row.id } }),
    };
  });

  private statusColor(code: string): string {
    const c = code?.toUpperCase();
    if (c?.includes('ACTIVE'))     return 'success';
    if (c?.includes('DEPRECATED')) return 'error';
    if (c?.includes('DRAFT'))      return 'neutral';
    return 'neutral';
  }

  protected goToApis(): void {
    this.router.navigate(['/apis']);
  }

  protected goToDeprecatedApis(): void {
    this.router.navigate(['/apis'], { queryParams: { presetStatus: 'DEPRECATED' } });
  }
}
