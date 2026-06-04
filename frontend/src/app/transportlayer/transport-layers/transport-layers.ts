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
import { AtlasTextInput } from '@shared/text-input/text-input';
import { AtlasPanelHeader } from '@shared/panel-header/panel-header';
import { AtlasSelectActive } from '@shared/select/select-active';
import { PageEvent, TableConfig } from '@shared/data-table/data-table.models';
import { DialogService } from '@shared/dialogs/dialog.service';
import { ToastService } from '@shared/toast/toast.service';
import { AuthService } from '@core/auth/auth.service';
import { TransportLayerService } from '../service/transport-layer.service';
import { TransportLayerSearchParams, TransportLayerSummaryDto } from '../model/transport-layer.model';

@Component({
  selector: 'app-transport-layers',
  imports: [
    AtlasPanelHeader,
    AtlasTextInput,
    AtlasSelectActive,
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
  providers: [provideTranslocoScope('transportlayer')],
  templateUrl: './transport-layers.html',
  styleUrl: './transport-layers.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransportLayers implements OnInit {
  private readonly service = inject(TransportLayerService);
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

  protected readonly data = signal<TransportLayerSummaryDto[]>([]);
  protected readonly loading = signal(false);
  protected readonly selectedRow = signal<TransportLayerSummaryDto | null>(null);
  private readonly totalItems = signal(0);
  private readonly pageIndex = signal(0);
  private readonly pageSize = signal(20);

  protected readonly searchForm = this.fb.group({
    query: [''],
    active: [null as boolean | null],
  });

  protected readonly tableConfig = computed<TableConfig<TransportLayerSummaryDto>>(() => {
    const selected = this.selectedRow();

    return {
      tableId: 'transport-layers',
      columns: [
        {
          key: 'icon',
          label: '',
          width: '48px',
          cellRender: (row) => {
            const effectiveIcon = row.itSystem?.icon ?? row.icon;
            return effectiveIcon ? { icon: { name: effectiveIcon } } : { text: '' };
          },
        },
        {
          key: 'color',
          label: '',
          width: '36px',
          cellRender: (row) => row.color
            ? { icon: { name: 'circle', style: { color: row.color } } }
            : { text: '' },
        },
        { key: 'code', label: this.t.translate('transportlayer.field.code'), width: '160px', sortable: true },
        { key: 'name', label: this.t.translate('transportlayer.field.name'), sortable: true },
        {
          key: 'itSystem',
          label: this.t.translate('transportlayer.field.itSystem'),
          width: '200px',
          cellRender: (row) => ({ text: row.itSystem ? `${row.itSystem.code} – ${row.itSystem.name}` : '' }),
        },
        {
          key: 'active',
          label: this.t.translate('transportlayer.field.active'),
          width: '100px',
          sortable: true,
          badges: {
            'true': { label: this.t.translate('transportlayer.badge.active'), color: 'success' },
            'false': { label: this.t.translate('transportlayer.badge.inactive'), color: 'error' },
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
          label: this.t.translate('transportlayer.action.new'),
          icon: 'add',
          action: () => this.router.navigate(['/transport-layers/new']),
        },
        {
          label: this.t.translate('transportlayer.action.edit'),
          icon: 'edit',
          disabled: !selected,
          tooltip: !selected ? this.t.translate('transportlayer.toolbar.selectToEdit') : undefined,
          action: () => { if (selected) this.router.navigate(['/transport-layers', selected.id, 'edit']); },
        },
        {
          label: this.t.translate('transportlayer.action.deactivate'),
          icon: 'block',
          disabled: !selected || !selected.active,
          tooltip: !selected
            ? this.t.translate('transportlayer.toolbar.selectToDeactivate')
            : !selected.active
              ? this.t.translate('transportlayer.toolbar.alreadyInactive')
              : undefined,
          action: () => { if (selected) this.confirmDeactivate(selected); },
        },
      ] : [],
      rowDblClick: (row) => this.router.navigate(['/transport-layers', row.id, 'edit']),
      actions: [
        {
          label: this.t.translate('transportlayer.action.edit'),
          icon: 'edit',
          visible: () => this.canWrite(),
          action: (row) => this.router.navigate(['/transport-layers', row.id, 'edit']),
        },
        {
          label: this.t.translate('transportlayer.action.deactivate'),
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
    const params: TransportLayerSearchParams = {
      page: this.pageIndex(),
      size: this.pageSize(),
      query: v.query || undefined,
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

  private confirmDeactivate(row: TransportLayerSummaryDto): void {
    this.dialogs.question(
      this.t.translate('transportlayer.action.deactivate'),
      this.t.translate('transportlayer.confirm.deactivate'),
      () => {
        this.service.deactivate(row.id).subscribe({
          next: () => {
            this.toast.success(this.t.translate('transportlayer.toast.deactivated'));
            this.load();
          },
        });
      },
    );
  }
}
