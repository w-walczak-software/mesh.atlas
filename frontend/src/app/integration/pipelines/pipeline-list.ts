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
import { IntegrationPipelineService } from '../service/integration-pipeline.service';
import { IntegrationPipelineSummaryDto } from '../model/integration.model';

@Component({
  selector: 'app-pipeline-list',
  imports: [AtlasPageTitle, DataTable, TranslocoDirective, MatButtonModule, MatIconModule],
  providers: [provideTranslocoScope('integration')],
  templateUrl: './pipeline-list.html',
  styleUrl: './pipeline-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PipelineList {
  private readonly service = inject(IntegrationPipelineService);
  private readonly router = inject(Router);
  private readonly dialogs = inject(DialogService);
  private readonly toast = inject(ToastService);
  private readonly t = inject(TranslocoService);

  protected readonly lang = toSignal(this.t.langChanges$, { initialValue: this.t.getActiveLang() });
  protected readonly data = signal<IntegrationPipelineSummaryDto[]>([]);
  protected readonly loading = signal(false);
  protected readonly selected = signal<IntegrationPipelineSummaryDto | null>(null);
  private readonly totalItems = signal(0);
  private readonly pageIndex = signal(0);
  private readonly pageSize = signal(20);

  protected readonly tableConfig = computed<TableConfig<IntegrationPipelineSummaryDto>>(() => {
    const _lang = this.lang();
    const sel = this.selected();
    return {
      tableId: 'pipeline-list',
      columns: [
        { key: 'code', label: this.t.translate('integration.pipeline.code'), width: '160px' },
        { key: 'name', label: this.t.translate('integration.pipeline.name') },
        {
          key: 'targetEntity',
          label: this.t.translate('integration.pipeline.targetEntity'),
          width: '140px',
          badges: {
            'IT_SYSTEM': { label: this.t.translate('integration.targetEntity.itSystem'), color: 'primary' },
            'API': { label: this.t.translate('integration.targetEntity.api'), color: 'secondary' },
            'DATA_DOMAIN': { label: this.t.translate('integration.targetEntity.dataDomain'), color: 'neutral' },
          } as Record<string, BadgeConfig>,
        },
        {
          key: 'status',
          label: this.t.translate('integration.pipeline.status'),
          width: '110px',
          badges: {
            'ACTIVE': { label: this.t.translate('integration.pipelineStatus.active'), color: 'success' },
            'DRAFT': { label: this.t.translate('integration.pipelineStatus.draft'), color: 'neutral' },
            'PAUSED': { label: this.t.translate('integration.pipelineStatus.paused'), color: 'warning' },
          } as Record<string, BadgeConfig>,
        },
        {
          key: 'hasDsl',
          label: this.t.translate('integration.pipeline.hasDsl'),
          width: '100px',
          badges: {
            'true': { label: this.t.translate('integration.badge.yes'), color: 'success' },
            'false': { label: this.t.translate('integration.badge.no'), color: 'error' },
          } as Record<string, BadgeConfig>,
        },
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
          action: () => this.router.navigate(['/integracje/new']),
        },
        {
          label: this.t.translate('integration.action.edit'),
          icon: 'edit',
          disabled: !sel,
          action: () => sel && this.router.navigate(['/integracje', sel.id]),
        },
        {
          label: this.t.translate('integration.action.sync'),
          icon: 'sync',
          disabled: !sel || sel.status !== 'ACTIVE',
          tooltip: sel && sel.status !== 'ACTIVE' ? this.t.translate('integration.tooltip.pipelineNotActive') : undefined,
          action: () => sel && this.confirmSync(sel),
        },
        {
          label: this.t.translate('integration.action.deactivate'),
          icon: 'block',
          color: 'error',
          disabled: !sel || !sel.active,
          action: () => sel && this.confirmDeactivate(sel),
        },
      ],
      rowDblClick: (row) => this.router.navigate(['/integracje', row.id]),
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

  private confirmSync(row: IntegrationPipelineSummaryDto): void {
    this.dialogs.question(
      this.t.translate('integration.action.sync'),
      this.t.translate('integration.confirm.sync'),
      () => {
        this.service.triggerSync(row.id).subscribe({
          next: (result) => {
            this.toast.success(
              `${this.t.translate('integration.toast.syncStarted')} — ID: ${result.syncRegistryId}`
            );
          },
          error: () => this.toast.error(this.t.translate('integration.toast.syncFailed')),
        });
      },
    );
  }

  private confirmDeactivate(row: IntegrationPipelineSummaryDto): void {
    this.dialogs.question(
      this.t.translate('integration.action.deactivate'),
      this.t.translate('integration.confirm.deactivatePipeline'),
      () => {
        this.service.deactivate(row.id).subscribe({
          next: () => {
            this.toast.success(this.t.translate('integration.toast.pipelineDeactivated'));
            this.load();
          },
        });
      },
    );
  }
}
