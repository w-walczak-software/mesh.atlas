import { ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, inject } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { TranslocoDirective, TranslocoService, provideTranslocoScope } from '@jsverse/transloco';
import { DialogService } from '../shared/dialogs/dialog.service';
import { ToastService } from '../shared/toast/toast.service';
import { DataTable } from '../shared/data-table/data-table';
import { TableConfig } from '../shared/data-table/data-table.models';

interface KpiCard {
  labelKey: string;
  value: string;
  delta: string;
  positive: boolean;
  icon: string;
  color: 'primary' | 'secondary' | 'tertiary' | 'error';
}

interface RecentApi {
  name: string;
  version: string;
  environment: string;
  status: 'active' | 'deprecated' | 'draft';
  calls: string;
}

@Component({
  selector: 'app-dashboard',
  imports: [MatCardModule, MatIconModule, MatButtonModule, MatChipsModule, DataTable, TranslocoDirective],
  providers: [provideTranslocoScope('dashboard')],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard {
  private readonly dialog = inject(DialogService);
  private readonly toast = inject(ToastService);
  private readonly t = inject(TranslocoService);
  private readonly cdr = inject(ChangeDetectorRef);
  protected readonly lang = toSignal(this.t.langChanges$, { initialValue: this.t.getActiveLang() });

  constructor() {
    this.t.langChanges$.pipe(takeUntilDestroyed()).subscribe(() => this.cdr.markForCheck());
  }

  protected readonly kpis: KpiCard[] = [
    { labelKey: 'dashboard.kpi.registeredApis',    value: '142',   delta: '+8 this month',       positive: true,  icon: 'api',     color: 'primary' },
    { labelKey: 'dashboard.kpi.activeEnvironments', value: '12',    delta: '+1 this week',        positive: true,  icon: 'cloud',   color: 'secondary' },
    { labelKey: 'dashboard.kpi.apiConsumers',       value: '1 847', delta: '+124 this month',     positive: true,  icon: 'group',   color: 'tertiary' },
    { labelKey: 'dashboard.kpi.deprecatedApis',     value: '23',    delta: '−5 since last month', positive: false, icon: 'warning', color: 'error' },
  ];

  protected readonly recentApis: RecentApi[] = [
    { name: 'Payments Gateway',  version: 'v3.1.0',      environment: 'Production',  status: 'active',     calls: '1.2M / day' },
    { name: 'User Identity',     version: 'v2.0.4',      environment: 'Production',  status: 'active',     calls: '856K / day' },
    { name: 'Inventory Service', version: 'v1.5.2',      environment: 'Staging',     status: 'active',     calls: '42K / day' },
    { name: 'Notifications API', version: 'v4.0.0-beta', environment: 'Development', status: 'draft',      calls: '—' },
    { name: 'Legacy Orders',     version: 'v1.0.0',      environment: 'Production',  status: 'deprecated', calls: '12K / day' },
    { name: 'Analytics Hub',     version: 'v2.3.1',      environment: 'Production',  status: 'active',     calls: '320K / day' },
    { name: 'Billing Service',   version: 'v1.8.0',      environment: 'Production',  status: 'active',     calls: '95K / day' },
    { name: 'Search API',        version: 'v3.0.2',      environment: 'Staging',     status: 'active',     calls: '210K / day' },
    { name: 'Config Manager',    version: 'v1.2.0',      environment: 'Development', status: 'draft',      calls: '—' },
    { name: 'Report Exporter',   version: 'v1.0.3',      environment: 'Production',  status: 'deprecated', calls: '8K / day' },
    { name: 'Media CDN',         version: 'v4.1.0',      environment: 'Production',  status: 'active',     calls: '2.1M / day' },
    { name: 'Event Bus',         version: 'v2.0.0',      environment: 'Staging',     status: 'active',     calls: '560K / day' },
  ];

  protected readonly apiTableConfig = computed<TableConfig<RecentApi>>(() => {
    this.lang(); // reactive: rebuild when language changes
    const tr = (key: string, params?: Record<string, unknown>) => this.t.translate<string>(key, params);

    return {
      tableId: 'recent-apis',
      showFilter: true,
      showCheckboxes: false,
      pagination: {
        mode: 'frontend',
        pageSize: 5,
        pageSizeOptions: [5, 10, 25],
      },
      columns: [
        { key: 'name',    label: tr('dashboard.table.apiName'),    sortable: true },
        { key: 'version', label: tr('dashboard.table.version'),    sortable: true },
        {
          key: 'environment',
          label: tr('dashboard.table.environment'),
          sortable: true,
          icons: {
            Production:  { name: 'cloud',    color: 'success',   label: 'Production' },
            Staging:     { name: 'science',  color: 'warn',      label: 'Staging' },
            Development: { name: 'computer', color: 'secondary', label: 'Development' },
          },
        },
        {
          key: 'status',
          label: tr('dashboard.table.status'),
          sortable: true,
          badges: {
            active:     { color: 'success', label: 'Active' },
            deprecated: { color: 'error',   label: 'Deprecated' },
            draft:      { color: 'neutral', label: 'Draft' },
          },
        },
        { key: 'calls', label: tr('dashboard.table.traffic'), sortable: false },
      ],
      rowClick: (row) => this.toast.info(tr('dashboard.actions.rowSelected'), `${row.name} (${row.version})`),
      rowDblClick: (row) => this.dialog.info(
        tr('dashboard.actions.apiDetails'),
        tr('dashboard.actions.apiDetailsBody', { name: row.name, version: row.version, environment: row.environment, status: row.status, calls: row.calls }),
      ),
      rowStyle: (row): Record<string, string> => {
        if (row.status === 'deprecated') return { opacity: '0.65' };
        if (row.status === 'draft') return { fontStyle: 'italic' };
        return {};
      },
      actions: [
        {
          label: tr('dashboard.actions.view'),
          icon: 'open_in_new',
          action: (row) => this.dialog.info(row.name, `${row.version} · ${row.environment}\nStatus: ${row.status}\nTraffic: ${row.calls}`),
        },
        {
          label: tr('dashboard.actions.edit'),
          icon: 'edit',
          color: 'primary',
          disabled: (row) => row.status === 'deprecated',
          action: (row) => this.toast.info(tr('dashboard.actions.edit'), tr('dashboard.actions.editOpening', { name: row.name })),
        },
        {
          label: tr('dashboard.actions.deprecate'),
          icon: 'warning',
          color: 'warn',
          visible: (row) => row.status === 'active',
          action: (row) => this.dialog.question(
            tr('dashboard.actions.deprecateTitle'),
            tr('dashboard.actions.deprecateConfirm', { name: row.name }),
            () => this.toast.warn(tr('dashboard.actions.deprecatedTitle'), tr('dashboard.actions.deprecatedMsg', { name: row.name })),
          ),
        },
        {
          label: tr('dashboard.actions.delete'),
          icon: 'delete',
          color: 'error',
          visible: (row) => row.status !== 'active',
          action: (row) => this.dialog.question(
            tr('dashboard.actions.deleteTitle'),
            tr('dashboard.actions.deleteConfirm', { name: row.name }),
            () => this.toast.success(tr('dashboard.actions.deletedTitle'), tr('dashboard.actions.deletedMsg', { name: row.name })),
          ),
        },
      ],
    };
  });

  protected showInfo(): void {
    this.dialog.info(
      this.t.translate('dashboard.dialogTest.demo.info.title'),
      this.t.translate('dashboard.dialogTest.demo.info.body'),
    );
  }

  protected showError(): void {
    this.dialog.error(
      this.t.translate('dashboard.dialogTest.demo.error.title'),
      this.t.translate('dashboard.dialogTest.demo.error.body'),
    );
  }

  protected showToastMessage(): void {
    this.toast.message(
      this.t.translate('dashboard.toastTest.demo.message.title'),
      this.t.translate('dashboard.toastTest.demo.message.body'),
    );
  }

  protected showToastSuccess(): void {
    this.toast.success(
      this.t.translate('dashboard.toastTest.demo.success.title'),
      this.t.translate('dashboard.toastTest.demo.success.body'),
    );
  }

  protected showToastInfo(): void {
    this.toast.info(
      this.t.translate('dashboard.toastTest.demo.info.title'),
      this.t.translate('dashboard.toastTest.demo.info.body'),
    );
  }

  protected showToastWarn(): void {
    this.toast.warn(
      this.t.translate('dashboard.toastTest.demo.warn.title'),
      this.t.translate('dashboard.toastTest.demo.warn.body'),
    );
  }

  protected showToastError(): void {
    this.toast.error(
      this.t.translate('dashboard.toastTest.demo.error.title'),
      this.t.translate('dashboard.toastTest.demo.error.body'),
    );
  }

  protected showQuestion(): void {
    this.dialog.question(
      this.t.translate('dashboard.dialogTest.demo.question.title'),
      this.t.translate('dashboard.dialogTest.demo.question.body'),
      () => this.dialog.info(
        this.t.translate('dashboard.dialogTest.demo.question.deletedTitle'),
        this.t.translate('dashboard.dialogTest.demo.question.deletedBody'),
      ),
    );
  }
}
