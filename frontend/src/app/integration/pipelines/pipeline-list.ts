import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslocoDirective, TranslocoService, provideTranslocoScope } from '@jsverse/transloco';
import { toSignal } from '@angular/core/rxjs-interop';
import { DataTable } from '@shared/data-table/data-table';
import { AtlasPageTitle } from '@shared/page-title/page-title';
import { BadgeConfig, PageEvent, TableConfig } from '@shared/data-table/data-table.models';
import { DialogService } from '@shared/dialogs/dialog.service';
import { ToastService } from '@shared/toast/toast.service';
import { IntegrationPipelineService } from '../service/integration-pipeline.service';
import { IntegrationPipelineSummaryDto, PipelineStatus, TargetEntityType } from '../model/integration.model';

@Component({
  selector: 'app-pipeline-list',
  imports: [
    AtlasPageTitle,
    DataTable,
    TranslocoDirective,
    ReactiveFormsModule,
    MatButtonModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatTooltipModule,
  ],
  providers: [provideTranslocoScope('integration'), DatePipe],
  templateUrl: './pipeline-list.html',
  styleUrl: './pipeline-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PipelineList {
  private readonly service = inject(IntegrationPipelineService);
  private readonly router = inject(Router);
  private readonly dialogs = inject(DialogService);
  private readonly datePipe = inject(DatePipe);
  private readonly toast = inject(ToastService);
  private readonly t = inject(TranslocoService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly lang = toSignal(this.t.langChanges$, { initialValue: this.t.getActiveLang() });
  protected readonly data = signal<IntegrationPipelineSummaryDto[]>([]);
  protected readonly loading = signal(false);
  protected readonly selected = signal<IntegrationPipelineSummaryDto | null>(null);
  private readonly totalItems = signal(0);
  private readonly pageIndex = signal(0);
  private readonly pageSize = signal(20);

  protected readonly pipelineStatuses: PipelineStatus[] = ['DRAFT', 'ACTIVE', 'PAUSED'];
  protected readonly targetEntityTypes: TargetEntityType[] = ['IT_SYSTEM', 'API', 'DATA_DOMAIN'];
  protected filtersExpanded = signal(true);

  protected readonly filterForm = this.fb.group({
    code: [''],
    name: [''],
    targetEntity: [null as TargetEntityType | null],
    status: [null as PipelineStatus | null],
    active: [true],
  });

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
        {
          key: 'scheduleEnabled',
          label: this.t.translate('integration.schedule.label'),
          width: '110px',
          badges: {
            'true': { label: this.t.translate('integration.badge.yes'), color: 'success' },
            'false': { label: this.t.translate('integration.badge.no'), color: 'neutral' },
          } as Record<string, BadgeConfig>,
        },
        {
          key: 'nextExecutionAt',
          label: this.t.translate('integration.schedule.nextExecution'),
          width: '175px',
          cellRender: (row) => row.nextExecutionAt
            ? { text: this.datePipe.transform(row.nextExecutionAt, 'yyyy-MM-dd HH:mm') ?? row.nextExecutionAt }
            : { text: '—' },
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

    // debounce text fields; selects/checkbox trigger immediately via valueChanges
    const code$ = this.filterForm.get('code')!.valueChanges.pipe(debounceTime(350), distinctUntilChanged());
    const name$ = this.filterForm.get('name')!.valueChanges.pipe(debounceTime(350), distinctUntilChanged());

    code$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.resetAndLoad());
    name$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.resetAndLoad());

    this.filterForm.get('targetEntity')!.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.resetAndLoad());

    this.filterForm.get('status')!.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.resetAndLoad());

    this.filterForm.get('active')!.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.resetAndLoad());
  }

  protected onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.load();
  }

  protected resetFilters(): void {
    this.filterForm.reset({ code: '', name: '', targetEntity: null, status: null, active: true });
  }

  private resetAndLoad(): void {
    this.pageIndex.set(0);
    this.selected.set(null);
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    const { code, name, targetEntity, status, active } = this.filterForm.getRawValue();
    this.service.findAll(this.pageIndex(), this.pageSize(), {
      active: active ?? true,
      code,
      name,
      status,
      targetEntity,
    }).subscribe({
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
