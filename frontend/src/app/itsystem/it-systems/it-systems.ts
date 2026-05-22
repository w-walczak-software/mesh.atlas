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
  private readonly service = inject(ItSystemService);
  private readonly entryService = inject(DictionaryEntryService);
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

  protected readonly data = signal<ItSystemSummaryDto[]>([]);
  protected readonly loading = signal(false);
  protected readonly selectedRow = signal<ItSystemSummaryDto | null>(null);
  private readonly totalItems = signal(0);
  private readonly pageIndex = signal(0);
  private readonly pageSize = signal(20);

  protected readonly statuses = signal<DictionaryEntryDto[]>([]);
  protected readonly lifecycleStages = signal<DictionaryEntryDto[]>([]);
  protected readonly businessCriticalities = signal<DictionaryEntryDto[]>([]);
  protected readonly systemTypes = signal<DictionaryEntryDto[]>([]);

  protected readonly searchForm = this.fb.group({
    query: [''],
    ownerQuery: [''],
    statusId: [null as string | null],
    lifecycleStageId: [null as string | null],
    businessCriticalityId: [null as string | null],
    systemTypeId: [null as string | null],
    active: [null as boolean | null],
  });

  protected readonly tableConfig = computed<TableConfig<ItSystemSummaryDto>>(() => {
    const selected = this.selectedRow();

    return {
      tableId: 'it-systems',
      columns: [
        { key: 'code', label: this.t.translate('itsystem.field.code'), width: '140px', sortable: true },
        { key: 'name', label: this.t.translate('itsystem.field.name'), sortable: true },
        {
          key: 'status',
          label: this.t.translate('itsystem.field.status'),
          width: '160px',
          cellRender: (row) => ({ text: row.status?.name }),
        },
        {
          key: 'lifecycleStage',
          label: this.t.translate('itsystem.field.lifecycleStage'),
          width: '160px',
          cellRender: (row) => ({ text: row.lifecycleStage?.name }),
        },
        {
          key: 'businessCriticality',
          label: this.t.translate('itsystem.field.businessCriticality'),
          width: '170px',
          cellRender: (row) => ({ text: row.businessCriticality?.name }),
        },
        {
          key: 'systemType',
          label: this.t.translate('itsystem.field.systemType'),
          width: '150px',
          cellRender: (row) => ({ text: row.systemType?.name }),
        },
        {
          key: 'active',
          label: this.t.translate('itsystem.field.active'),
          width: '100px',
          sortable: true,
          badges: {
            'true': { label: this.t.translate('itsystem.badge.active'), color: 'success' },
            'false': { label: this.t.translate('itsystem.badge.inactive'), color: 'error' },
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
          label: this.t.translate('itsystem.action.new'),
          icon: 'add',
          action: () => this.router.navigate(['/it-systems/new']),
        },
        {
          label: this.t.translate('itsystem.action.edit'),
          icon: 'edit',
          disabled: !selected,
          tooltip: !selected ? this.t.translate('itsystem.toolbar.selectToEdit') : undefined,
          action: () => { if (selected) this.router.navigate(['/it-systems', selected.id, 'edit']); },
        },
        {
          label: this.t.translate('itsystem.action.deactivate'),
          icon: 'block',
          disabled: !selected || !selected.active,
          tooltip: !selected
            ? this.t.translate('itsystem.toolbar.selectToDeactivate')
            : !selected.active
              ? this.t.translate('itsystem.toolbar.alreadyInactive')
              : undefined,
          action: () => { if (selected) this.confirmDeactivate(selected); },
        },
      ] : [],
      rowDblClick: (row) => this.router.navigate(['/it-systems', row.id, 'edit']),
      actions: [
        {
          label: this.t.translate('itsystem.action.edit'),
          icon: 'edit',
          visible: () => this.canWrite(),
          action: (row) => this.router.navigate(['/it-systems', row.id, 'edit']),
        },
        {
          label: this.t.translate('itsystem.action.deactivate'),
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
    const params: ItSystemSearchParams = {
      page: this.pageIndex(),
      size: this.pageSize(),
      query: v.query || undefined,
      ownerQuery: v.ownerQuery || undefined,
      statusId: v.statusId || undefined,
      lifecycleStageId: v.lifecycleStageId || undefined,
      businessCriticalityId: v.businessCriticalityId || undefined,
      systemTypeId: v.systemTypeId || undefined,
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
