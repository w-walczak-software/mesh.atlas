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
import { ItSystemSummaryDto } from '../../itsystem/model/itsystem.model';
import { ItSystemService } from '../../itsystem/service/itsystem.service';
import { ApiService } from '../service/api.service';
import { ApiSearchParams, ApiSummaryDto } from '../model/api.model';

@Component({
  selector: 'app-apis',
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
  providers: [provideTranslocoScope('api')],
  templateUrl: './apis.html',
  styleUrl: './apis.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Apis implements OnInit {
  private readonly service = inject(ApiService);
  private readonly entryService = inject(DictionaryEntryService);
  private readonly itSystemService = inject(ItSystemService);
  private readonly router = inject(Router);
  private readonly dialogs = inject(DialogService);
  private readonly toast = inject(ToastService);
  private readonly auth = inject(AuthService);
  private readonly t = inject(TranslocoService);
  private readonly fb = inject(FormBuilder);

  protected readonly lang = toSignal(this.t.langChanges$, { initialValue: this.t.getActiveLang() });
  protected readonly canWrite = computed(() =>
    this.auth.hasAnyRole(['atlas_admin', 'atlas_system'])
  );

  protected readonly data = signal<ApiSummaryDto[]>([]);
  protected readonly loading = signal(false);
  protected readonly selectedRow = signal<ApiSummaryDto | null>(null);
  private readonly totalItems = signal(0);
  private readonly pageIndex = signal(0);
  private readonly pageSize = signal(20);

  protected readonly statuses = signal<DictionaryEntryDto[]>([]);
  protected readonly types = signal<DictionaryEntryDto[]>([]);
  protected readonly itSystems = signal<ItSystemSummaryDto[]>([]);

  protected readonly searchForm = this.fb.group({
    query: [''],
    tag: [''],
    statusId: [null as string | null],
    typeId: [null as string | null],
    sourceSystemId: [null as string | null],
    active: [null as boolean | null],
  });

  protected readonly tableConfig = computed<TableConfig<ApiSummaryDto>>(() => {
    const selected = this.selectedRow();

    return {
      tableId: 'apis',
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
          key: 'sourceSystem',
          label: this.t.translate('api.field.sourceSystem'),
          width: '160px',
          cellRender: (row) => ({ text: row.sourceSystem?.name ?? '–' }),
        },
        {
          key: 'targetSystem',
          label: this.t.translate('api.field.targetSystem'),
          width: '160px',
          cellRender: (row) => ({ text: row.targetSystem?.name ?? '–' }),
        },
        {
          key: 'active',
          label: this.t.translate('api.field.active'),
          width: '100px',
          sortable: true,
          badges: {
            'true': { label: this.t.translate('api.badge.active'), color: 'success' },
            'false': { label: this.t.translate('api.badge.inactive'), color: 'error' },
          },
        },
      ],
      pagination: {
        mode: 'backend',
        totalItems: this.totalItems(),
        pageSize: this.pageSize(),
        pageSizeOptions: [10, 20, 50],
      },
      toolbar: this.canWrite() ? [
        {
          label: this.t.translate('api.action.new'),
          icon: 'add',
          action: () => this.router.navigate(['/apis/new']),
        },
        {
          label: this.t.translate('api.action.edit'),
          icon: 'edit',
          disabled: !selected,
          tooltip: !selected ? this.t.translate('api.toolbar.selectToEdit') : undefined,
          action: () => { if (selected) this.router.navigate(['/apis', selected.id, 'edit']); },
        },
        {
          label: this.t.translate('api.action.deactivate'),
          icon: 'block',
          disabled: !selected || !selected.active,
          tooltip: !selected
            ? this.t.translate('api.toolbar.selectToDeactivate')
            : !selected.active
              ? this.t.translate('api.toolbar.alreadyInactive')
              : undefined,
          action: () => { if (selected) this.confirmDeactivate(selected); },
        },
      ] : [],
      rowDblClick: (row) => this.router.navigate(['/apis', row.id, 'edit']),
      actions: [
        {
          label: this.t.translate('api.action.edit'),
          icon: 'edit',
          visible: () => this.canWrite(),
          action: (row) => this.router.navigate(['/apis', row.id, 'edit']),
        },
        {
          label: this.t.translate('api.action.deactivate'),
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
    this.loadDictionaries();
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

  private load(): void {
    this.loading.set(true);
    this.selectedRow.set(null);
    const v = this.searchForm.getRawValue();
    const params: ApiSearchParams = {
      page: this.pageIndex(),
      size: this.pageSize(),
      query: v.query || undefined,
      tag: v.tag || undefined,
      statusId: v.statusId || undefined,
      typeId: v.typeId || undefined,
      sourceSystemId: v.sourceSystemId || undefined,
      active: v.active ?? undefined,
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

  private loadDictionaries(): void {
    this.entryService.findByTypeCode('API_STATUS').subscribe(e => this.statuses.set(e));
    this.entryService.findByTypeCode('API_TYPE').subscribe(e => this.types.set(e));
    this.itSystemService.findAll({ active: true, size: 500, sort: 'name' }).subscribe(
      page => this.itSystems.set(page.content),
    );
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
