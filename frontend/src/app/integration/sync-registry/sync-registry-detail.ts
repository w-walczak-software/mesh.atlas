import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { TranslocoDirective, TranslocoService, provideTranslocoScope } from '@jsverse/transloco';
import { toSignal } from '@angular/core/rxjs-interop';
import { AtlasCardHeader } from '@shared/card-header/card-header';
import { AppToolbar } from '@shared/toolbar/toolbar';
import { DataTable } from '@shared/data-table/data-table';
import { BadgeConfig, PageEvent, TableConfig } from '@shared/data-table/data-table.models';
import { ToastService } from '@shared/toast/toast.service';
import { DialogService } from '@shared/dialogs/dialog.service';
import { SyncRegistryService } from '../service/sync-registry.service';
import { IntegrationStagingService } from '../service/integration-staging.service';
import { StagingItSystemDto, SyncRegistryDto, SyncRegistryItemDto, TargetEntityType } from '../model/integration.model';

@Component({
  selector: 'app-sync-registry-detail',
  imports: [
    AtlasCardHeader,
    AppToolbar,
    DataTable,
    DatePipe,
    TranslocoDirective,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    MatTableModule,
  ],
  providers: [provideTranslocoScope('integration')],
  templateUrl: './sync-registry-detail.html',
  styleUrl: './sync-registry-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SyncRegistryDetail implements OnInit {
  private readonly service = inject(SyncRegistryService);
  private readonly stagingService = inject(IntegrationStagingService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly dialogs = inject(DialogService);
  private readonly t = inject(TranslocoService);

  protected readonly lang = toSignal(this.t.langChanges$, { initialValue: this.t.getActiveLang() });
  protected readonly registry = signal<SyncRegistryDto | null>(null);
  protected readonly items = signal<SyncRegistryItemDto[]>([]);
  protected readonly loadingItems = signal(false);
  private readonly totalItems = signal(0);
  private readonly pageIndex = signal(0);
  private readonly pageSize = signal(50);

  protected readonly stagingData = signal<StagingItSystemDto[]>([]);
  protected readonly loadingStaging = signal(false);
  protected readonly selectedStagingItems = signal<StagingItSystemDto[]>([]);
  protected readonly promoting = signal(false);
  protected readonly abandoning = signal(false);

  protected readonly isInReview = computed(() => this.registry()?.status === 'PENDING_REVIEW');
  protected readonly hasAcceptedItems = computed(() =>
    this.stagingData().some(i => i.stagingStatus === 'ACCEPTED'));

  protected readonly stagingTableConfig = computed<TableConfig<StagingItSystemDto>>(() => {
    const _lang = this.lang();
    const selectedIds = this.selectedStagingItems().map(i => i.id);
    const inReview = this.isInReview();
    return {
      tableId: 'sync-staging-review',
      showCheckboxes: inReview,
      rowId: (row) => row.id,
      columns: [
        { key: 'externalId', label: this.t.translate('integration.staging.externalId'), width: '160px' },
        { key: 'code', label: this.t.translate('integration.staging.code'), width: '130px' },
        { key: 'name', label: this.t.translate('integration.staging.name') },
        {
          key: 'stagingStatus',
          label: this.t.translate('integration.staging.stagingStatus'),
          width: '120px',
          badges: {
            'PENDING': { label: this.t.translate('integration.stagingStatus.pending'), color: 'warning' },
            'ACCEPTED': { label: this.t.translate('integration.stagingStatus.accepted'), color: 'success' },
            'REJECTED': { label: this.t.translate('integration.stagingStatus.rejected'), color: 'neutral' },
            'SYNCED': { label: this.t.translate('integration.stagingStatus.synced'), color: 'success' },
            'ERROR': { label: this.t.translate('integration.stagingStatus.error'), color: 'error' },
            'SKIPPED': { label: this.t.translate('integration.stagingStatus.skipped'), color: 'neutral' },
          } as Record<string, BadgeConfig>,
        },
        { key: 'errorMessage', label: this.t.translate('integration.staging.errorMessage'), width: '220px' },
        { key: 'processedAt', label: this.t.translate('integration.staging.processedAt'), width: '160px' },
      ],
      toolbar: inReview ? [
        {
          label: this.t.translate('integration.action.accept'),
          icon: 'check_circle',
          disabled: selectedIds.length === 0,
          action: () => this.acceptSelected(),
        },
        {
          label: this.t.translate('integration.action.reject'),
          icon: 'cancel',
          disabled: selectedIds.length === 0,
          action: () => this.rejectSelected(),
        },
        {
          label: this.t.translate('integration.action.promoteData'),
          icon: 'upload',
          disabled: !this.hasAcceptedItems() || this.promoting(),
          action: () => this.promoteAccepted(),
        },
      ] : [],
    };
  });

  protected readonly itemsTableConfig = computed<TableConfig<SyncRegistryItemDto>>(() => ({
    tableId: 'sync-registry-items',
    columns: [
      { key: 'entityType', label: this.t.translate('integration.registryItem.entityType'), width: '110px' },
      { key: 'externalId', label: this.t.translate('integration.registryItem.externalId'), width: '140px' },
      { key: 'targetCode', label: this.t.translate('integration.registryItem.targetCode'), width: '130px' },
      { key: 'targetName', label: this.t.translate('integration.registryItem.targetName') },
      {
        key: 'action',
        label: this.t.translate('integration.registryItem.action'),
        width: '90px',
        badges: {
          'CREATE': { label: this.t.translate('integration.syncAction.create'), color: 'primary' },
          'UPDATE': { label: this.t.translate('integration.syncAction.update'), color: 'secondary' },
          'SKIP': { label: this.t.translate('integration.syncAction.skip'), color: 'neutral' },
        } as Record<string, BadgeConfig>,
      },
      {
        key: 'status',
        label: this.t.translate('integration.registryItem.status'),
        width: '100px',
        badges: {
          'SYNCED': { label: this.t.translate('integration.stagingStatus.synced'), color: 'success' },
          'ERROR': { label: this.t.translate('integration.stagingStatus.error'), color: 'error' },
          'SKIPPED': { label: this.t.translate('integration.stagingStatus.skipped'), color: 'neutral' },
          'PENDING': { label: this.t.translate('integration.stagingStatus.pending'), color: 'warning' },
        } as Record<string, BadgeConfig>,
      },
      { key: 'errorMessage', label: this.t.translate('integration.registryItem.errorMessage'), width: '200px' },
    ],
    pagination: {
      mode: 'backend',
      totalItems: this.totalItems(),
      pageSize: this.pageSize(),
      pageSizeOptions: [20, 50, 100],
    },
  }));

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.service.findById(id).subscribe({
      next: (r) => {
        this.registry.set(r);
        if (r.status === 'PENDING_REVIEW') {
          this.loadStaging(r.pipelineId, r.pipelineTargetEntity);
        }
      },
    });
    this.loadItems(id);
  }

  private loadStaging(pipelineId: string, targetEntity: TargetEntityType): void {
    this.loadingStaging.set(true);
    const obs$ = targetEntity === 'IT_SYSTEM'
      ? this.stagingService.findItSystems(pipelineId)
      : targetEntity === 'API'
        ? this.stagingService.findApis(pipelineId)
        : this.stagingService.findDataDomains(pipelineId);

    obs$.subscribe({
      next: (data) => {
        this.stagingData.set(data as StagingItSystemDto[]);
        this.loadingStaging.set(false);
      },
      error: () => this.loadingStaging.set(false),
    });
  }

  protected onStagingRowsSelect(items: StagingItSystemDto[]): void {
    this.selectedStagingItems.set(items);
  }

  protected acceptSelected(): void {
    const reg = this.registry();
    const ids = this.selectedStagingItems().map(i => i.id);
    if (!reg || !ids.length) return;
    this.stagingService.accept(reg.pipelineId, ids).subscribe({
      next: () => {
        this.toast.success(this.t.translate('integration.toast.acceptSuccess'));
        this.selectedStagingItems.set([]);
        this.loadStaging(reg.pipelineId, reg.pipelineTargetEntity);
      },
      error: () => this.toast.error(this.t.translate('integration.toast.stagingActionFailed')),
    });
  }

  protected rejectSelected(): void {
    const reg = this.registry();
    const ids = this.selectedStagingItems().map(i => i.id);
    if (!reg || !ids.length) return;
    this.stagingService.reject(reg.pipelineId, ids).subscribe({
      next: () => {
        this.toast.success(this.t.translate('integration.toast.rejectSuccess'));
        this.selectedStagingItems.set([]);
        this.loadStaging(reg.pipelineId, reg.pipelineTargetEntity);
      },
      error: () => this.toast.error(this.t.translate('integration.toast.stagingActionFailed')),
    });
  }

  protected promoteAccepted(): void {
    const reg = this.registry();
    if (!reg) return;
    this.dialogs.question(
      this.t.translate('integration.action.promoteData'),
      this.t.translate('integration.confirm.promoteData'),
      () => {
        this.promoting.set(true);
        this.stagingService.promote(reg.pipelineId).subscribe({
          next: (result) => {
            this.promoting.set(false);
            this.toast.success(
              this.t.translate('integration.toast.promoteSuccess', { promoted: result.promoted })
            );
            const id = this.route.snapshot.paramMap.get('id')!;
            this.service.findById(id).subscribe({ next: (r) => this.registry.set(r) });
            this.loadItems(id);
          },
          error: () => {
            this.promoting.set(false);
            this.toast.error(this.t.translate('integration.toast.promoteFailed'));
          },
        });
      },
    );
  }

  protected abandonSync(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.dialogs.question(
      this.t.translate('integration.action.abandon'),
      this.t.translate('integration.confirm.abandon'),
      () => {
        this.abandoning.set(true);
        this.service.abandon(id).subscribe({
          next: () => {
            this.abandoning.set(false);
            this.toast.success(this.t.translate('integration.toast.abandonSuccess'));
            this.service.findById(id).subscribe({ next: (r) => this.registry.set(r) });
          },
          error: () => {
            this.abandoning.set(false);
            this.toast.error(this.t.translate('integration.toast.abandonFailed'));
          },
        });
      },
    );
  }

  protected onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    const id = this.route.snapshot.paramMap.get('id')!;
    this.loadItems(id);
  }

  private loadItems(registryId: string): void {
    this.loadingItems.set(true);
    this.service.findItems(registryId, this.pageIndex(), this.pageSize()).subscribe({
      next: (page) => {
        this.items.set(page.content);
        this.totalItems.set(page.totalElements);
        this.loadingItems.set(false);
      },
      error: () => this.loadingItems.set(false),
    });
  }

  protected goBack(): void {
    this.router.navigate(['/integracje/sync-registry']);
  }

  protected goToPipeline(): void {
    const r = this.registry();
    if (r) this.router.navigate(['/integracje', r.pipelineId]);
  }
}
