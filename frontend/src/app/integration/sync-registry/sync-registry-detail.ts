import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
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
import { SyncRegistryService } from '../service/sync-registry.service';
import { SyncRegistryDto, SyncRegistryItemDto } from '../model/integration.model';

@Component({
  selector: 'app-sync-registry-detail',
  imports: [
    AtlasCardHeader,
    AppToolbar,
    DataTable,
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
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly t = inject(TranslocoService);

  protected readonly lang = toSignal(this.t.langChanges$, { initialValue: this.t.getActiveLang() });
  protected readonly registry = signal<SyncRegistryDto | null>(null);
  protected readonly items = signal<SyncRegistryItemDto[]>([]);
  protected readonly loadingItems = signal(false);
  private readonly totalItems = signal(0);
  private readonly pageIndex = signal(0);
  private readonly pageSize = signal(50);

  protected readonly itemsTableConfig = computed<TableConfig<SyncRegistryItemDto>>(() => ({
    tableId: 'sync-registry-items',
    columns: [
      {
        key: 'entityType',
        label: this.t.translate('integration.registryItem.entityType'),
        width: '130px',
      },
      { key: 'externalId', label: this.t.translate('integration.registryItem.externalId'), width: '160px' },
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
      { key: 'errorMessage', label: this.t.translate('integration.registryItem.errorMessage') },
      { key: 'createdAt', label: this.t.translate('integration.registryItem.createdAt'), width: '160px' },
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
    this.service.findById(id).subscribe({ next: (r) => this.registry.set(r) });
    this.loadItems(id);
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
