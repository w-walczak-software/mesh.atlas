import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { TranslocoDirective, TranslocoService, provideTranslocoScope } from '@jsverse/transloco';
import { toSignal } from '@angular/core/rxjs-interop';
import { DataTable } from '@shared/data-table/data-table';
import { PageEvent, TableConfig } from '@shared/data-table/data-table.models';
import { DialogService } from '@shared/dialogs/dialog.service';
import { ToastService } from '@shared/toast/toast.service';
import { AuthService } from '@core/auth/auth.service';
import { DictionaryEntryDto } from '../../dictionary/model/dictionary.model';
import { DictionaryEntryService } from '../../dictionary/service/dictionary-entry.service';
import { ItSystemService } from '../service/itsystem.service';
import { ItSystemSearchParams, ItSystemSummaryDto } from '../model/itsystem.model';
import { ItSystemFilterStateService } from '../service/itsystem-filter-state.service';
import { ApiFilterStateService } from '../../api/service/api-filter-state.service';

@Component({
  selector: 'app-it-systems',
  imports: [
    DataTable,
    TranslocoDirective,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatExpansionModule,
  ],
  providers: [provideTranslocoScope('itsystem')],
  templateUrl: './it-systems.html',
  styleUrl: './it-systems.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItSystems implements OnInit {
  private readonly service       = inject(ItSystemService);
  private readonly entryService  = inject(DictionaryEntryService);
  private readonly router        = inject(Router);
  private readonly dialogs       = inject(DialogService);
  private readonly toast         = inject(ToastService);
  private readonly auth          = inject(AuthService);
  private readonly t             = inject(TranslocoService);
  private readonly fb            = inject(FormBuilder);
  private readonly listState     = inject(ItSystemFilterStateService);
  private readonly apiFilterState = inject(ApiFilterStateService);

  protected readonly lang = toSignal(this.t.langChanges$, { initialValue: this.t.getActiveLang() });
  protected readonly canCreate = computed(() =>
    this.auth.hasAnyRole(['atlas_admin', 'atlas_system'])
  );

  protected readonly data          = signal<ItSystemSummaryDto[]>([]);
  protected readonly loading       = signal(false);
  protected readonly selectedRow   = signal<ItSystemSummaryDto | null>(null);
  /** Rows currently checked via the checkbox column. */
  protected readonly checkedRows   = signal<ItSystemSummaryDto[]>([]);
  /** IDs to restore after navigation — passed to DataTable for one-shot sync. */
  protected readonly restoredIds   = signal<string[]>([]);

  /**
   * Unified effective selection:
   * - Exactly 1 checkbox checked  → that row (behaves as if single-clicked)
   * - Otherwise                   → single-click selection
   * Used for Edit, Deactivate, and as the DataTable [selectedItem] highlight.
   */
  protected readonly effectiveSelected = computed<ItSystemSummaryDto | null>(() => {
    const checked = this.checkedRows();
    if (checked.length === 1) return checked[0];
    return this.selectedRow();
  });

  private readonly totalItems = signal(0);
  private readonly pageIndex  = signal(0);
  private readonly pageSize   = signal(20);
  private pendingSelectId: string | null = null;
  private readonly MAX_SCAN_PAGES = 50;

  protected readonly statuses              = signal<DictionaryEntryDto[]>([]);
  protected readonly lifecycleStages       = signal<DictionaryEntryDto[]>([]);
  protected readonly businessCriticalities = signal<DictionaryEntryDto[]>([]);
  protected readonly systemTypes           = signal<DictionaryEntryDto[]>([]);

  protected readonly searchForm = this.fb.group({
    query:                 [''],
    ownerQuery:            [''],
    tag:                   [''],
    statusId:              [null as string | null],
    lifecycleStageId:      [null as string | null],
    businessCriticalityId: [null as string | null],
    systemTypeId:          [null as string | null],
    active:                [null as boolean | null],
  });

  protected readonly tableConfig = computed<TableConfig<ItSystemSummaryDto>>(() => {
    const effective    = this.effectiveSelected();
    const checked      = this.checkedRows();
    const multiChecked = checked.length > 1;
    // Graph is available when the table has any data; checked rows narrow the view, empty = show all
    const graphEnabled = this.data().length > 0;

    return {
      tableId:        'it-systems',
      showCheckboxes: true,
      rowId:          (row) => row.id,
      columns: [
        {
          key:        'icon',
          label:      '',
          width:      '48px',
          cellRender: (row) => row.icon ? { icon: { name: row.icon } } : { text: '' },
        },
        { key: 'code',  label: this.t.translate('itsystem.field.code'), width: '140px', sortable: true },
        { key: 'name',  label: this.t.translate('itsystem.field.name'), sortable: true },
        {
          key:        'status',
          label:      this.t.translate('itsystem.field.status'),
          width:      '160px',
          cellRender: (row) => ({ text: row.status?.name }),
        },
        {
          key:        'lifecycleStage',
          label:      this.t.translate('itsystem.field.lifecycleStage'),
          width:      '160px',
          cellRender: (row) => ({ text: row.lifecycleStage?.name }),
        },
        {
          key:        'businessCriticality',
          label:      this.t.translate('itsystem.field.businessCriticality'),
          width:      '170px',
          cellRender: (row) => ({ text: row.businessCriticality?.name }),
        },
        {
          key:        'systemType',
          label:      this.t.translate('itsystem.field.systemType'),
          width:      '150px',
          cellRender: (row) => ({ text: row.systemType?.name }),
        },
        {
          key:      'active',
          label:    this.t.translate('itsystem.field.active'),
          width:    '100px',
          sortable: true,
          badges: {
            'true':  { label: this.t.translate('itsystem.badge.active'),   color: 'success' },
            'false': { label: this.t.translate('itsystem.badge.inactive'), color: 'error'   },
          },
        },
      ],
      pagination: {
        mode:            'backend',
        totalItems:      this.totalItems(),
        pageSize:        this.pageSize(),
        pageSizeOptions: [10, 20, 50],
      },
      toolbar: [
        ...(this.canCreate() ? [{
          label:  this.t.translate('itsystem.action.new'),
          icon:   'add',
          action: () => this.router.navigate(['/it-systems/new']),
        }] : []),
        {
          label:    this.t.translate('itsystem.action.edit'),
          icon:     'edit',
          disabled: !effective || multiChecked || !effective.canEdit,
          tooltip:  multiChecked
            ? this.t.translate('itsystem.toolbar.multipleChecked')
            : !effective
              ? this.t.translate('itsystem.toolbar.selectToEdit')
              : !effective.canEdit
                ? this.t.translate('itsystem.toolbar.noPermissionToEdit')
                : undefined,
          action: () => { if (effective && !multiChecked) this.router.navigate(['/it-systems', effective.id, 'edit']); },
        },
        {
          label:    this.t.translate('itsystem.action.deactivate'),
          icon:     'block',
          disabled: !effective || multiChecked || !effective.canEdit || !effective.active,
          tooltip:  multiChecked
            ? this.t.translate('itsystem.toolbar.multipleChecked')
            : !effective
              ? this.t.translate('itsystem.toolbar.selectToDeactivate')
              : !effective.canEdit
                ? this.t.translate('itsystem.toolbar.noPermissionToEdit')
                : !effective.active
                  ? this.t.translate('itsystem.toolbar.alreadyInactive')
                  : undefined,
          action: () => { if (effective && !multiChecked) this.confirmDeactivate(effective); },
        },
        {
          label:    this.t.translate('itsystem.action.graph'),
          icon:     'hub',
          disabled: !graphEnabled,
          tooltip:  !graphEnabled ? this.t.translate('itsystem.toolbar.selectForGraph') : undefined,
          action:   () => this.openGraph(),
        },
      ],
      rowDblClick: (row) => this.router.navigate(['/it-systems', row.id, 'edit']),
      actions: [
        {
          label:   this.t.translate('itsystem.action.edit'),
          icon:    'edit',
          visible: (row) => row.canEdit,
          action:  (row) => this.router.navigate(['/it-systems', row.id, 'edit']),
        },
        {
          label:    this.t.translate('itsystem.action.deactivate'),
          icon:     'block',
          color:    'error',
          visible:  (row) => row.canEdit,
          disabled: (row) => !row.active,
          action:   (row) => this.confirmDeactivate(row),
        },
      ],
    };
  });

  ngOnInit(): void {
    this.loadDictionaries();
    this.restoreOrLoad();
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
    this.listState.clear();
    this.pageIndex.set(0);
    this.load();
  }

  protected onRowsSelect(rows: ItSystemSummaryDto[]): void {
    this.checkedRows.set(rows);
    // Also save updated checked IDs to the state snapshot so the restore
    // is always up-to-date in case the user navigates without clicking "Graph".
    this.saveState();
  }

  private openGraph(): void {
    if (!this.data().length) return;
    // Checked rows narrow the graph to those systems; no checkboxes = show all
    const ids = this.checkedRows().map(s => s.id);
    this.saveState();
    this.apiFilterState.saveFromItSystems(ids);
    this.router.navigate(['/apis/graph']);
  }

  private restoreOrLoad(): void {
    const snap = this.listState.snapshot();
    const selectId = (history.state as { selectId?: string })?.selectId;

    if (selectId) {
      this.pendingSelectId = selectId;
      if (snap) this.pageSize.set(snap.pageSize);
      this.pageIndex.set(0);
      this.load();
      return;
    }

    if (snap) {
      this.searchForm.patchValue(snap.form);
      this.pageIndex.set(snap.pageIndex);
      this.pageSize.set(snap.pageSize);
      this.restoredIds.set(snap.selectedIds);
    }
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.selectedRow.set(null);
    const v = this.searchForm.getRawValue();
    const params: ItSystemSearchParams = {
      page:                  this.pageIndex(),
      size:                  this.pageSize(),
      query:                 v.query || undefined,
      ownerQuery:            v.ownerQuery || undefined,
      tag:                   v.tag || undefined,
      statusId:              v.statusId || undefined,
      lifecycleStageId:      v.lifecycleStageId || undefined,
      businessCriticalityId: v.businessCriticalityId || undefined,
      systemTypeId:          v.systemTypeId || undefined,
      active:                v.active ?? undefined,
    };
    this.service.findAll(params).subscribe({
      next: (page) => {
        this.data.set(page.content);
        this.totalItems.set(page.totalElements);
        this.loading.set(false);
        if (this.pendingSelectId) {
          this.resolvePendingSelect(page.totalPages);
        } else {
          this.saveState();
        }
      },
      error: () => this.loading.set(false),
    });
  }

  private resolvePendingSelect(totalPages: number): void {
    const id = this.pendingSelectId;
    if (!id) return;
    const found = this.data().find(r => r.id === id);
    if (found) {
      this.selectedRow.set(found);
      this.pendingSelectId = null;
      this.saveState();
      return;
    }
    if (this.pageIndex() < totalPages - 1 && this.pageIndex() < this.MAX_SCAN_PAGES - 1) {
      this.pageIndex.set(this.pageIndex() + 1);
      this.load();
    } else {
      this.pendingSelectId = null;
      this.saveState();
    }
  }

  /** Persist current list state so it can be restored after navigation. */
  private saveState(): void {
    const v = this.searchForm.getRawValue();
    this.listState.save({
      form: {
        query:                 v.query || null,
        ownerQuery:            v.ownerQuery || null,
        tag:                   v.tag || null,
        statusId:              v.statusId || null,
        lifecycleStageId:      v.lifecycleStageId || null,
        businessCriticalityId: v.businessCriticalityId || null,
        systemTypeId:          v.systemTypeId || null,
        active:                v.active ?? null,
      },
      pageIndex:   this.pageIndex(),
      pageSize:    this.pageSize(),
      selectedIds: this.checkedRows().map(s => s.id),
    });
  }

  private loadDictionaries(): void {
    this.entryService.findByTypeCode('SYSTEM_STATUS').subscribe(e => this.statuses.set(e));
    this.entryService.findByTypeCode('LIFECYCLE_STAGE').subscribe(e => this.lifecycleStages.set(e));
    this.entryService.findByTypeCode('BUSINESS_CRITICALITY').subscribe(e => this.businessCriticalities.set(e));
    this.entryService.findByTypeCode('SYSTEM_TYPE').subscribe(e => this.systemTypes.set(e));
  }

  private confirmDeactivate(row: ItSystemSummaryDto): void {
    this.dialogs.question(
      this.t.translate('itsystem.action.deactivate'),
      this.t.translate('itsystem.confirm.deactivate'),
      () => {
        this.service.deactivate(row.id).subscribe({
          next: () => {
            this.toast.success(this.t.translate('itsystem.toast.deactivated'));
            this.load();
          },
        });
      },
    );
  }
}
