import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TranslocoDirective, TranslocoService, provideTranslocoScope } from '@jsverse/transloco';
import { toSignal } from '@angular/core/rxjs-interop';
import { DataTable } from '@shared/data-table/data-table';
import { AtlasPageTitle } from '@shared/page-title/page-title';
import { BadgeConfig, PageEvent, TableConfig } from '@shared/data-table/data-table.models';
import { SyncRegistryService } from '../service/sync-registry.service';
import { SyncRegistrySummaryDto, SyncStatus } from '../model/integration.model';

@Component({
  selector: 'app-sync-registry-list',
  imports: [
    AtlasPageTitle,
    DataTable,
    ReactiveFormsModule,
    MatButtonModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    TranslocoDirective,
  ],
  providers: [provideTranslocoScope('integration'), DatePipe],
  templateUrl: './sync-registry-list.html',
  styleUrl: './sync-registry-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SyncRegistryList {
  private readonly service = inject(SyncRegistryService);
  private readonly router = inject(Router);
  private readonly t = inject(TranslocoService);
  private readonly datePipe = inject(DatePipe);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly lang = toSignal(this.t.langChanges$, { initialValue: this.t.getActiveLang() });
  protected readonly data = signal<SyncRegistrySummaryDto[]>([]);
  protected readonly loading = signal(false);
  private readonly totalItems = signal(0);
  private readonly pageIndex = signal(0);
  private readonly pageSize = signal(20);

  protected readonly syncStatuses: SyncStatus[] = ['PENDING', 'RUNNING', 'PENDING_REVIEW', 'COMPLETED', 'FAILED', 'PARTIAL', 'ABANDONED'];
  protected filtersExpanded = signal(true);

  protected readonly filterForm = this.fb.group({
    pipelineCode: [''],
    status: [null as SyncStatus | null],
  });

  protected readonly tableConfig = computed<TableConfig<SyncRegistrySummaryDto>>(() => {
    const _lang = this.lang();
    return {
      tableId: 'sync-registry-list',
      columns: [
        {
          key: 'executedAt',
          label: this.t.translate('integration.registry.executedAt'),
          width: '170px',
          cellRender: (row) => ({ text: this.datePipe.transform(row.executedAt, 'yyyy-MM-dd HH:mm:ss') ?? row.executedAt }),
        },
        { key: 'pipelineCode', label: this.t.translate('integration.registry.pipelineCode'), width: '160px' },
        { key: 'pipelineName', label: this.t.translate('integration.registry.pipelineName') },
        { key: 'executedBy', label: this.t.translate('integration.registry.executedBy'), width: '140px' },
        {
          key: 'status',
          label: this.t.translate('integration.registry.status'),
          width: '120px',
          badges: {
            'COMPLETED': { label: this.t.translate('integration.syncStatus.completed'), color: 'success' },
            'PARTIAL': { label: this.t.translate('integration.syncStatus.partial'), color: 'warning' },
            'FAILED': { label: this.t.translate('integration.syncStatus.failed'), color: 'error' },
            'RUNNING': { label: this.t.translate('integration.syncStatus.running'), color: 'primary' },
            'PENDING': { label: this.t.translate('integration.syncStatus.pending'), color: 'neutral' },
            'PENDING_REVIEW': { label: this.t.translate('integration.syncStatus.pending_review'), color: 'secondary' },
            'ABANDONED': { label: this.t.translate('integration.syncStatus.abandoned'), color: 'neutral' },
          } as Record<string, BadgeConfig>,
        },
        { key: 'totalCount', label: this.t.translate('integration.registry.totalCount'), width: '80px' },
        { key: 'successCount', label: this.t.translate('integration.registry.successCount'), width: '80px' },
        { key: 'failedCount', label: this.t.translate('integration.registry.failedCount'), width: '80px' },
      ],
      pagination: {
        mode: 'backend',
        totalItems: this.totalItems(),
        pageSize: this.pageSize(),
        pageSizeOptions: [10, 20, 50],
      },
      rowDblClick: (row) => this.router.navigate(['/integracje/sync-registry', row.id]),
    };
  });

  constructor() {
    this.load();

    this.filterForm.get('pipelineCode')!.valueChanges
      .pipe(debounceTime(350), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.resetAndLoad());

    this.filterForm.get('status')!.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.resetAndLoad());
  }

  protected onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.load();
  }

  protected resetFilters(): void {
    this.filterForm.reset({ pipelineCode: '', status: null });
  }

  private resetAndLoad(): void {
    this.pageIndex.set(0);
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    const { pipelineCode, status } = this.filterForm.getRawValue();
    this.service.findAll(null, this.pageIndex(), this.pageSize(), { status, pipelineCode }).subscribe({
      next: (page) => {
        this.data.set(page.content);
        this.totalItems.set(page.totalElements);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
