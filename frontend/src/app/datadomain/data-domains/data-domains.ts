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
import { DataDomainService } from '../service/data-domain.service';
import { DataDomainSearchParams, DataDomainSummaryDto } from '../model/data-domain.model';
import { ApiFilterStateService } from '../../api/service/api-filter-state.service';

@Component({
  selector: 'app-data-domains',
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
  providers: [provideTranslocoScope('datadomain')],
  templateUrl: './data-domains.html',
  styleUrl: './data-domains.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataDomains implements OnInit {
  private readonly service = inject(DataDomainService);
  private readonly entryService = inject(DictionaryEntryService);
  private readonly router = inject(Router);
  private readonly apiFilterState = inject(ApiFilterStateService);
  private readonly dialogs = inject(DialogService);
  private readonly toast = inject(ToastService);
  private readonly auth = inject(AuthService);
  private readonly t = inject(TranslocoService);
  private readonly fb = inject(FormBuilder);

  protected readonly lang = toSignal(this.t.langChanges$, { initialValue: this.t.getActiveLang() });
  protected readonly canWrite = computed(() =>
    this.auth.hasAnyRole(['atlas_admin', 'atlas_system'])
  );

  protected readonly data = signal<DataDomainSummaryDto[]>([]);
  protected readonly loading = signal(false);
  protected readonly selectedRow = signal<DataDomainSummaryDto | null>(null);
  protected readonly checkedRows = signal<DataDomainSummaryDto[]>([]);
  protected readonly groups = signal<DictionaryEntryDto[]>([]);
  private readonly totalItems = signal(0);
  private readonly pageIndex = signal(0);
  private readonly pageSize = signal(20);

  protected readonly searchForm = this.fb.group({
    query: [''],
    tag: [''],
    active: [null as boolean | null],
    groupId: [null as string | null],
  });

  protected readonly tableConfig = computed<TableConfig<DataDomainSummaryDto>>(() => {
    const selected     = this.selectedRow();
    const checked      = this.checkedRows();
    const graphEnabled = checked.length > 0 || !!selected;
    const multiCheck   = checked.length > 1;

    return {
      tableId:        'data-domains',
      showCheckboxes: true,
      rowId:          (row) => row.id,
      columns: [
        { key: 'code', label: this.t.translate('datadomain.field.code'), width: '160px', sortable: true },
        { key: 'name', label: this.t.translate('datadomain.field.name'), sortable: true },
        {
          key: 'description',
          label: this.t.translate('datadomain.field.description'),
          cellRender: (row) => ({ text: row.description ?? '' }),
        },
        {
          key: 'group',
          label: this.t.translate('datadomain.field.group'),
          width: '160px',
          cellRender: (row) => ({ text: row.group?.name ?? '' }),
        },
        {
          key: 'active',
          label: this.t.translate('datadomain.field.active'),
          width: '100px',
          sortable: true,
          badges: {
            'true': { label: this.t.translate('datadomain.badge.active'), color: 'success' },
            'false': { label: this.t.translate('datadomain.badge.inactive'), color: 'error' },
          },
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
          label:    this.t.translate('datadomain.action.graph'),
          icon:     'hub',
          disabled: !graphEnabled,
          tooltip:  !graphEnabled ? this.t.translate('datadomain.toolbar.selectForGraph') : undefined,
          action:   () => this.openGraph(),
        },
        ...(this.canWrite() ? [
          {
            label:  this.t.translate('datadomain.action.new'),
            icon:   'add',
            action: () => this.router.navigate(['/data-domains/new']),
          },
          {
            label:    this.t.translate('datadomain.action.edit'),
            icon:     'edit',
            disabled: !selected || multiCheck,
            tooltip:  multiCheck
              ? this.t.translate('datadomain.toolbar.multipleChecked')
              : !selected ? this.t.translate('datadomain.toolbar.selectToEdit') : undefined,
            action:   () => { if (selected) this.router.navigate(['/data-domains', selected.id, 'edit']); },
          },
          {
            label:    this.t.translate('datadomain.action.deactivate'),
            icon:     'block',
            disabled: !selected || !selected.active || multiCheck,
            tooltip:  multiCheck
              ? this.t.translate('datadomain.toolbar.multipleChecked')
              : !selected
                ? this.t.translate('datadomain.toolbar.selectToDeactivate')
                : !selected.active
                  ? this.t.translate('datadomain.toolbar.alreadyInactive')
                  : undefined,
            action: () => { if (selected) this.confirmDeactivate(selected); },
          },
        ] : []),
      ],
      rowDblClick: (row) => this.router.navigate(['/data-domains', row.id, 'edit']),
      actions: [
        {
          label: this.t.translate('datadomain.action.edit'),
          icon: 'edit',
          visible: () => this.canWrite(),
          action: (row) => this.router.navigate(['/data-domains', row.id, 'edit']),
        },
        {
          label: this.t.translate('datadomain.action.deactivate'),
          icon: 'block',
          color: 'error',
          visible: () => this.canWrite(),
          disabled: (row) => !row.active,
          action: (row) => this.confirmDeactivate(row),
        },
      ],
    };
  });

  ngOnInit(): void {
    this.entryService.findByTypeCode('DATA_DOMAIN_GROUP').subscribe(e => this.groups.set(e));
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
    this.pageIndex.set(0);
    this.load();
  }

  protected onRowsSelect(rows: DataDomainSummaryDto[]): void {
    this.checkedRows.set(rows);
  }

  private openGraph(): void {
    const checked  = this.checkedRows();
    const selected = this.selectedRow();
    const ids = checked.length > 0 ? checked.map(r => r.id) : (selected ? [selected.id] : []);
    if (!ids.length) return;
    this.apiFilterState.saveFromDataDomains(ids);
    this.router.navigate(['/apis/graph']);
  }

  private load(): void {
    this.loading.set(true);
    this.selectedRow.set(null);
    this.checkedRows.set([]);
    const v = this.searchForm.getRawValue();
    const params: DataDomainSearchParams = {
      page: this.pageIndex(),
      size: this.pageSize(),
      query: v.query || undefined,
      tag: v.tag || undefined,
      active: v.active ?? undefined,
      groupId: v.groupId || undefined,
    };
    this.service.findAll(params).subscribe({
      next: (page) => {
        this.data.set(page.content);
        this.totalItems.set(page.totalElements);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private confirmDeactivate(row: DataDomainSummaryDto): void {
    this.dialogs.question(
      this.t.translate('datadomain.action.deactivate'),
      this.t.translate('datadomain.confirm.deactivate'),
      () => {
        this.service.deactivate(row.id).subscribe({
          next: () => {
            this.toast.success(this.t.translate('datadomain.toast.deactivated'));
            this.load();
          },
        });
      },
    );
  }
}
