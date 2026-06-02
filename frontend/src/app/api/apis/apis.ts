import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { TranslocoDirective, TranslocoService, provideTranslocoScope } from '@jsverse/transloco';
import { toSignal } from '@angular/core/rxjs-interop';
import { DataTable } from '@shared/data-table/data-table';
import { BadgeConfig, PageEvent, TableConfig } from '@shared/data-table/data-table.models';
import { DialogService } from '@shared/dialogs/dialog.service';
import { ToastService } from '@shared/toast/toast.service';
import { AuthService } from '@core/auth/auth.service';
import { ItSystemSelectComponent } from '@shared/it-system-select/it-system-select';
import { DictionaryEntryDto } from '../../dictionary/model/dictionary.model';
import { DictionaryEntryService } from '../../dictionary/service/dictionary-entry.service';
import { TransportLayerSummaryDto } from '../../transportlayer/model/transport-layer.model';
import { TransportLayerService } from '../../transportlayer/service/transport-layer.service';
import { DataDomainSummaryDto } from '../../datadomain/model/data-domain.model';
import { DataDomainService } from '../../datadomain/service/data-domain.service';
import { ApiService } from '../service/api.service';
import { ApiSearchParams, ApiSummaryDto } from '../model/api.model';
import { ApiFilterStateService } from '../service/api-filter-state.service';
import { ItSystemService } from '../../itsystem/service/itsystem.service';
import { ApiDocumentationDialog, ApiDocumentationDialogData } from '../api-documentation-dialog/api-documentation-dialog';
import { ApiVerifyDialog, ApiVerifyDialogData } from '../api-form/api-verify.dialog';

@Component({
  selector: 'app-apis',
  imports: [
    DataTable,
    TranslocoDirective,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatExpansionModule,
    MatButtonToggleModule,
    ItSystemSelectComponent,
  ],
  providers: [provideTranslocoScope('api')],
  templateUrl: './apis.html',
  styleUrl: './apis.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Apis implements OnInit {
  private readonly service = inject(ApiService);
  private readonly itSystemService = inject(ItSystemService);
  private readonly entryService = inject(DictionaryEntryService);
  private readonly transportLayerService = inject(TransportLayerService);
  private readonly dataDomainService = inject(DataDomainService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly dialogs = inject(DialogService);
  private readonly toast = inject(ToastService);
  private readonly auth = inject(AuthService);
  private readonly t = inject(TranslocoService);
  private readonly fb = inject(FormBuilder);
  private readonly filterState = inject(ApiFilterStateService);
  private readonly dialog = inject(MatDialog);

  protected readonly pendingVerificationOnly = signal(false);

  protected readonly lang = toSignal(this.t.langChanges$, { initialValue: this.t.getActiveLang() });
  private readonly _hasProducerSystems = signal(false);
  protected readonly canCreate = computed(() =>
    this.auth.hasAnyRole(['atlas_admin', 'atlas_system']) || this._hasProducerSystems()
  );

  protected readonly activeTab = signal<'basic' | 'advanced'>('basic');

  protected readonly data = signal<ApiSummaryDto[]>([]);
  protected readonly loading = signal(false);
  protected readonly selectedRow = signal<ApiSummaryDto | null>(null);
  protected readonly checkedRows = signal<ApiSummaryDto[]>([]);
  private readonly totalItems = signal(0);
  protected readonly pageIndex = signal(0);
  private readonly pageSize = signal(20);
  private pendingSelectId: string | null = null;
  private readonly MAX_SCAN_PAGES = 50;

  protected readonly statuses = signal<DictionaryEntryDto[]>([]);
  protected readonly types = signal<DictionaryEntryDto[]>([]);
  protected readonly environments = signal<DictionaryEntryDto[]>([]);
  protected readonly integrationPatterns = signal<DictionaryEntryDto[]>([]);
  protected readonly transportLayers = signal<TransportLayerSummaryDto[]>([]);
  protected readonly dataDomains = signal<DataDomainSummaryDto[]>([]);

  protected readonly searchForm = this.fb.group({
    query:               [''],
    tag:                 [''],
    statusId:            [null as string | null],
    typeId:              [null as string | null],
    active:              [null as boolean | null],
    description:         [''],
    producerSystemIds:   [[] as string[]],
    consumerSystemIds:   [[] as string[]],
    transportLayerId:    [null as string | null],
    integrationPatternId:[null as string | null],
    dataDomainIds:       [[] as string[]],
    environmentId:       [null as string | null],
  });

  private readonly formValue = toSignal(this.searchForm.valueChanges, { initialValue: this.searchForm.value });

  protected readonly hasAdvancedFilters = computed(() => {
    const v = this.formValue();
    return !!(v.description || v.transportLayerId || v.integrationPatternId ||
              (v.dataDomainIds as string[] | null)?.length ||
              (v.producerSystemIds as string[] | null)?.length ||
              (v.consumerSystemIds as string[] | null)?.length || v.environmentId);
  });

  protected exitVerificationQueue(): void {
    this.pendingVerificationOnly.set(false);
    this.router.navigate(['/apis']);
    this.pageIndex.set(0);
    this.load();
  }

  protected openVerifyDialog(row: ApiSummaryDto, action: 'approve' | 'reject'): void {
    this.dialog.open(ApiVerifyDialog, {
      width: '480px',
      maxWidth: '95vw',
      disableClose: true,
      data: { apiId: row.id, action } satisfies ApiVerifyDialogData,
    }).afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        const key = action === 'approve' ? 'api.governance.toastApproved' : 'api.governance.toastRejected';
        this.toast.success(this.t.translate(key));
        this.load();
      }
    });
  }

  protected openDocumentation(row: ApiSummaryDto): void {
    this.dialog.open(ApiDocumentationDialog, {
      data: { apiId: row.id, apiCode: row.code, apiName: row.name } satisfies ApiDocumentationDialogData,
      width: '680px',
      maxWidth: '95vw',
    });
  }

  protected goToGraph(): void {
    const checked = this.checkedRows();
    const current = this.filterState.snapshot();
    if (current) {
      this.filterState.save({ ...current, apiIds: checked.length ? checked.map(r => r.id) : undefined });
    }
    this.router.navigate(['/apis/graph']);
  }

  protected onRowsSelect(rows: ApiSummaryDto[]): void {
    this.checkedRows.set(rows);
  }

  protected readonly tableConfig = computed<TableConfig<ApiSummaryDto>>(() => {
    const selected  = this.selectedRow();
    const checked   = this.checkedRows();
    const graphTip  = checked.length
      ? this.t.translate('api.toolbar.graphSelected', { count: checked.length })
      : undefined;

    return {
      tableId:        'apis',
      showCheckboxes: true,
      rowId:          (row) => row.id,
      columns: [
        { key: 'code', label: this.t.translate('api.field.code'), width: '140px', sortable: true },
        { key: 'name', label: this.t.translate('api.field.name'), sortable: true },
        {
          key: 'apiVersion',
          label: this.t.translate('api.field.apiVersion'),
          width: '100px',
          cellRender: (row) => ({ text: row.apiVersion ?? '–' }),
        },
        {
          key: 'type',
          label: this.t.translate('api.field.type'),
          width: '130px',
          cellRender: (row) => ({ text: row.type?.name ?? '–' }),
        },
        {
          key: 'status',
          label: this.t.translate('api.field.status'),
          width: '130px',
          cellRender: (row) => ({ text: row.status?.name }),
        },
        {
          key: 'producerSystem',
          label: this.t.translate('api.field.producerSystem'),
          width: '160px',
          cellRender: (row) => ({ text: row.producerSystem?.name ?? '–' }),
        },
        {
          key: 'consumerSystems',
          label: this.t.translate('api.field.consumerSystems'),
          width: '180px',
          cellRender: (row) => {
            const consumers = row.consumerSystems ?? [];
            if (consumers.length === 0) return { text: '–' };
            if (consumers.length === 1) return { text: consumers[0].name };
            return { text: `${consumers[0].name} (+${consumers.length - 1})` };
          },
        },
        {
          key: 'active',
          label: this.t.translate('api.field.active'),
          width: '100px',
          sortable: true,
          badges: {
            'true': { label: this.t.translate('api.badge.active'), color: 'success' },
            'false': { label: this.t.translate('api.badge.inactive'), color: 'error' },
          } as Record<string, BadgeConfig>,
        },
        {
          key: 'governanceStatus',
          label: this.t.translate('api.governance.statusLabel'),
          width: '170px',
          badges: {
            'VERIFIED':              { label: this.t.translate('api.governance.status.VERIFIED'),              color: 'success' },
            'PENDING_VERIFICATION':  { label: this.t.translate('api.governance.status.PENDING_VERIFICATION'),  color: 'warning' },
            'PENDING_REVIEW':        { label: this.t.translate('api.governance.status.PENDING_REVIEW'),        color: 'warning' },
            'REQUIRES_MODIFICATION': { label: this.t.translate('api.governance.status.REQUIRES_MODIFICATION'), color: 'error' },
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
          label:   this.t.translate('api.action.graph'),
          icon:    'hub',
          tooltip: graphTip,
          action:  () => this.goToGraph(),
        },
        {
          label:    this.t.translate('api.action.docs'),
          icon:     'description',
          disabled: !selected,
          tooltip:  !selected ? this.t.translate('api.toolbar.selectToViewDocs') : undefined,
          action:   () => { if (selected) this.openDocumentation(selected); },
        },
        ...(this.canCreate() ? [{
        label: this.t.translate('api.action.new'),
        icon: 'add',
        action: () => this.router.navigate(['/apis/new']),
      }] : []),
      {
        label: this.t.translate('api.action.edit'),
        icon: 'edit',
        disabled: !selected || !selected.canEdit,
        tooltip: !selected
          ? this.t.translate('api.toolbar.selectToEdit')
          : !selected.canEdit
            ? this.t.translate('api.toolbar.noPermissionToEdit')
            : undefined,
        action: () => { if (selected) this.router.navigate(['/apis', selected.id, 'edit']); },
      },
      {
        label: this.t.translate('api.action.deactivate'),
        icon: 'block',
        disabled: !selected || !selected.canEdit || !selected.active,
        tooltip: !selected
          ? this.t.translate('api.toolbar.selectToDeactivate')
          : !selected.canEdit
            ? this.t.translate('api.toolbar.noPermissionToEdit')
            : !selected.active
              ? this.t.translate('api.toolbar.alreadyInactive')
              : undefined,
        action: () => { if (selected) this.confirmDeactivate(selected); },
      },
      ],
      rowDblClick: (row) => this.router.navigate(['/apis', row.id, 'edit']),
      actions: [
        {
          label: this.t.translate('api.action.edit'),
          icon: 'edit',
          visible: (row) => row.canEdit,
          action: (row) => this.router.navigate(['/apis', row.id, 'edit']),
        },
        {
          label: this.t.translate('api.governance.approve'),
          icon: 'check_circle',
          visible: (row) => row.governanceStatus === 'PENDING_VERIFICATION' || row.governanceStatus === 'PENDING_REVIEW',
          action: (row) => this.openVerifyDialog(row, 'approve'),
        },
        {
          label: this.t.translate('api.governance.reject'),
          icon: 'cancel',
          color: 'error',
          visible: (row) => row.governanceStatus === 'PENDING_VERIFICATION' || row.governanceStatus === 'PENDING_REVIEW',
          action: (row) => this.openVerifyDialog(row, 'reject'),
        },
        {
          label: this.t.translate('api.action.deactivate'),
          icon: 'block',
          color: 'error',
          visible: (row) => row.canEdit,
          disabled: (row) => !row.active,
          action: (row) => this.confirmDeactivate(row),
        },
      ],
    };
  });

  ngOnInit(): void {
    this.loadDictionaries();
    if (!this.auth.hasAnyRole(['atlas_admin', 'atlas_system'])) {
      this.itSystemService.getMyProducerSystems().subscribe(systems =>
        this._hasProducerSystems.set(systems.length > 0)
      );
    }

    const saved = this.filterState.snapshot();

    const pendingOnly = this.route.snapshot.queryParamMap.get('pendingVerificationOnly') === 'true';
    if (pendingOnly) {
      this.pendingVerificationOnly.set(true);
      if (saved) this.pageSize.set(saved.pageSize);
      this.pageIndex.set(0);
      this.load();
      return;
    }

    const selectId = (history.state as { selectId?: string })?.selectId;
    if (selectId) {
      this.pendingSelectId = selectId;
      if (saved) this.pageSize.set(saved.pageSize);
      this.pageIndex.set(0);
      this.load();
      return;
    }

    // Restore state when returning from the Integration Map
    if (saved) {
      this.searchForm.patchValue({
        query:               saved.form.query ?? '',
        tag:                 saved.form.tag ?? '',
        statusId:            saved.form.statusId,
        typeId:              saved.form.typeId,
        active:              saved.form.active,
        description:         saved.form.description ?? '',
        producerSystemIds:   saved.form.producerSystemIds ?? [],
        consumerSystemIds:   saved.form.consumerSystemIds ?? [],
        transportLayerId:    saved.form.transportLayerId,
        integrationPatternId: saved.form.integrationPatternId,
        dataDomainIds:       saved.form.dataDomainIds ?? [],
        environmentId:       saved.form.environmentId,
      });
      this.pageIndex.set(saved.pageIndex);
      this.pageSize.set(saved.pageSize);
    }

    this.load();
  }

  protected onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.load();
  }

  protected onSearch(): void {
    this.pageIndex.set(0);
    this.load();
  }

  protected onReset(): void {
    this.searchForm.reset();
    this.filterState.clear();
    this.pageIndex.set(0);
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.selectedRow.set(null);
    this.checkedRows.set([]);
    const v = this.searchForm.getRawValue();

    // Persist current state so the Integration Map can read it
    this.filterState.save({
      form: {
        query:               v.query || null,
        tag:                 v.tag || null,
        statusId:            v.statusId,
        typeId:              v.typeId,
        active:              v.active,
        description:         v.description || null,
        producerSystemIds:   v.producerSystemIds ?? [],
        consumerSystemIds:   v.consumerSystemIds ?? [],
        transportLayerId:    v.transportLayerId,
        integrationPatternId: v.integrationPatternId,
        dataDomainIds:       v.dataDomainIds ?? [],
        environmentId:       v.environmentId,
      },
      pageIndex: this.pageIndex(),
      pageSize:  this.pageSize(),
    });

    const params: ApiSearchParams = {
      page: this.pageIndex(),
      size: this.pageSize(),
      query: v.query || undefined,
      tag: v.tag || undefined,
      statusId: v.statusId || undefined,
      typeId: v.typeId || undefined,
      active: v.active ?? undefined,
      description: v.description || undefined,
      producerSystemIds: v.producerSystemIds?.length ? v.producerSystemIds : undefined,
      consumerSystemIds: v.consumerSystemIds?.length ? v.consumerSystemIds : undefined,
      transportLayerId: v.transportLayerId || undefined,
      integrationPatternId: v.integrationPatternId || undefined,
      dataDomainIds: v.dataDomainIds?.length ? v.dataDomainIds : undefined,
      environmentId: v.environmentId || undefined,
      pendingVerificationOnly: this.pendingVerificationOnly() || undefined,
    };
    this.service.findAll(params).subscribe({
      next: (page) => {
        this.data.set(page.content);
        this.totalItems.set(page.totalElements);
        this.loading.set(false);
        if (this.pendingSelectId) {
          this.resolvePendingSelect(page.totalPages);
        }
      },
      error: () => {
        this.loading.set(false);
        this.pendingSelectId = null;
      },
    });
  }

  private resolvePendingSelect(totalPages: number): void {
    const id = this.pendingSelectId;
    if (!id) return;
    const found = this.data().find(r => r.id === id);
    if (found) {
      this.selectedRow.set(found);
      this.pendingSelectId = null;
      return;
    }
    if (this.pageIndex() < totalPages - 1 && this.pageIndex() < this.MAX_SCAN_PAGES - 1) {
      this.pageIndex.set(this.pageIndex() + 1);
      this.load();
    } else {
      this.pendingSelectId = null;
    }
  }

  private loadDictionaries(): void {
    this.entryService.findByTypeCode('API_STATUS').subscribe(e => this.statuses.set(e));
    this.entryService.findByTypeCode('API_TYPE').subscribe(e => this.types.set(e));
    this.entryService.findByTypeCode('API_ENVIRONMENT').subscribe(e => this.environments.set(e));
    this.entryService.findByTypeCode('INTEGRATION_PATTERN').subscribe(e => this.integrationPatterns.set(e));
    this.transportLayerService.findAll({ active: true, size: 200, sort: 'name' }).subscribe(p => this.transportLayers.set(p.content));
    this.dataDomainService.findAll({ active: true, size: 500, sort: 'name' }).subscribe(p => this.dataDomains.set(p.content));
  }

  private confirmDeactivate(row: ApiSummaryDto): void {
    this.dialogs.question(
      this.t.translate('api.action.deactivate'),
      this.t.translate('api.confirm.deactivate'),
      () => {
        this.service.deactivate(row.id).subscribe({
          next: () => {
            this.toast.success(this.t.translate('api.toast.deactivated'));
            this.load();
          },
        });
      },
    );
  }
}
