import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoDirective, TranslocoService, provideTranslocoScope } from '@jsverse/transloco';
import { toSignal } from '@angular/core/rxjs-interop';
import { DataTable } from '@shared/data-table/data-table';
import { AtlasPageTitle } from '@shared/page-title/page-title';
import { BadgeConfig, PageEvent, TableConfig } from '@shared/data-table/data-table.models';
import { DialogService } from '@shared/dialogs/dialog.service';
import { ToastService } from '@shared/toast/toast.service';
import { IntegrationDatasourceService } from '../service/integration-datasource.service';
import { IntegrationDatasourceSummaryDto } from '../model/integration.model';

@Component({
  selector: 'app-datasource-list',
  imports: [AtlasPageTitle, DataTable, TranslocoDirective, MatButtonModule, MatIconModule],
  providers: [provideTranslocoScope('integration')],
  templateUrl: './datasource-list.html',
  styleUrl: './datasource-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatasourceList {
  private readonly service = inject(IntegrationDatasourceService);
  private readonly router = inject(Router);
  private readonly dialogs = inject(DialogService);
  private readonly toast = inject(ToastService);
  private readonly t = inject(TranslocoService);

  protected readonly lang = toSignal(this.t.langChanges$, { initialValue: this.t.getActiveLang() });
  protected readonly data = signal<IntegrationDatasourceSummaryDto[]>([]);
  protected readonly loading = signal(false);
  protected readonly selected = signal<IntegrationDatasourceSummaryDto | null>(null);
  private readonly totalItems = signal(0);
  private readonly pageIndex = signal(0);
  private readonly pageSize = signal(20);

  protected readonly tableConfig = computed<TableConfig<IntegrationDatasourceSummaryDto>>(() => {
    const _lang = this.lang();
    const sel = this.selected();
    return {
      tableId: 'datasource-list',
      columns: [
        { key: 'code', label: this.t.translate('integration.datasource.code'), width: '160px' },
        { key: 'name', label: this.t.translate('integration.datasource.name') },
        { key: 'type', label: this.t.translate('integration.datasource.type'), width: '120px' },
        { key: 'host', label: this.t.translate('integration.datasource.host') },
        { key: 'port', label: this.t.translate('integration.datasource.port'), width: '80px' },
        { key: 'databaseName', label: this.t.translate('integration.datasource.databaseName') },
        {
          key: 'active',
          label: this.t.translate('integration.common.active'),
          width: '100px',
          badges: {
            'true': { label: this.t.translate('integration.badge.active'), color: 'success' },
            'false': { label: this.t.translate('integration.badge.inactive'), color: 'error' },
          } as Record<string, BadgeConfig>,
        },
      ],
      pagination: {
        mode: 'backend',
        totalItems: this.totalItems(),
        pageSize: this.pageSize(),
        pageSizeOptions: [10, 20, 50],
      },
      toolbar: [
        {
          label: this.t.translate('integration.action.create'),
          icon: 'add',
          action: () => this.router.navigate(['/integracje/datasources/new']),
        },
        {
          label: this.t.translate('integration.action.edit'),
          icon: 'edit',
          disabled: !sel,
          action: () => sel && this.router.navigate(['/integracje/datasources', sel.id]),
        },
        {
          label: this.t.translate('integration.action.testConnection'),
          icon: 'wifi_tethering',
          disabled: !sel,
          action: () => sel && this.testConnection(sel),
        },
        {
          label: this.t.translate('integration.action.deactivate'),
          icon: 'block',
          color: 'error',
          disabled: !sel || !sel.active,
          action: () => sel && this.confirmDeactivate(sel),
        },
      ],
      rowDblClick: (row) => this.router.navigate(['/integracje/datasources', row.id]),
    };
  });

  constructor() {
    this.load();
  }

  protected onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.service.findAll(this.pageIndex(), this.pageSize()).subscribe({
      next: (page) => {
        this.data.set(page.content);
        this.totalItems.set(page.totalElements);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private testConnection(row: IntegrationDatasourceSummaryDto): void {
    this.service.testConnection(row.id).subscribe({
      next: (result) => {
        if (result.success) {
          this.toast.success(this.t.translate('integration.toast.connectionOk'));
        } else {
          this.toast.error(`${this.t.translate('integration.toast.connectionFailed')}: ${result.message}`);
        }
      },
      error: () => this.toast.error(this.t.translate('integration.toast.connectionFailed')),
    });
  }

  private confirmDeactivate(row: IntegrationDatasourceSummaryDto): void {
    this.dialogs.question(
      this.t.translate('integration.action.deactivate'),
      this.t.translate('integration.confirm.deactivateDatasource'),
      () => {
        this.service.deactivate(row.id).subscribe({
          next: () => {
            this.toast.success(this.t.translate('integration.toast.datasourceDeactivated'));
            this.load();
          },
        });
      },
    );
  }
}
