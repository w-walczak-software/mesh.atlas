import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TranslocoDirective, TranslocoService, provideTranslocoScope } from '@jsverse/transloco';
import { toSignal } from '@angular/core/rxjs-interop';
import { DataTable } from '@shared/data-table/data-table';
import { AtlasPageTitle } from '@shared/page-title/page-title';
import { ColumnDef, PageEvent, TableConfig } from '@shared/data-table/data-table.models';
import { AuthService } from '@core/auth/auth.service';
import { HistoryDialog, HistoryDialogData } from '@shared/history/history.dialog';
import { HistoryService } from '@shared/history/history.service';
import { SystemParameterDto } from '../model/admin.model';
import { SystemParameterService } from './system-parameter.service';
import { SystemParameterEditDialog, SystemParameterEditDialogData } from './system-parameter-edit-dialog';

type SystemParameterRow = SystemParameterDto & { currentValue: string };

@Component({
  selector: 'app-system-parameters',
  imports: [
    AtlasPageTitle,
    DataTable,
    TranslocoDirective,
  ],
  providers: [provideTranslocoScope('admin'), provideTranslocoScope('history')],
  templateUrl: './system-parameters.html',
  styleUrl: './system-parameters.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SystemParameters {
  private readonly service = inject(SystemParameterService);
  private readonly matDialog = inject(MatDialog);
  private readonly historyService = inject(HistoryService);
  private readonly t = inject(TranslocoService);
  private readonly auth = inject(AuthService);

  protected readonly lang = toSignal(this.t.langChanges$, { initialValue: this.t.getActiveLang() });
  protected readonly data = signal<SystemParameterRow[]>([]);
  protected readonly loading = signal(false);
  protected readonly selectedRow = signal<SystemParameterRow | null>(null);
  protected readonly pageIndex = signal(0);
  private readonly totalItems = signal(0);
  private readonly pageSize = signal(50);

  protected readonly isAdmin = computed(() => this.auth.roles().includes('atlas_admin'));

  protected readonly tableConfig = computed<TableConfig<SystemParameterRow>>(() => {
    const _lang = this.lang();
    const selected = this.selectedRow();
    const columns: ColumnDef<SystemParameterRow>[] = [
      {
        key: 'parameterKey',
        label: this.t.translate('admin.systemParam.field.parameterKey'),
        sortable: true,
        width: '280px',
      },
      {
        key: 'parameterName',
        label: this.t.translate('admin.systemParam.field.parameterName'),
        sortable: true,
      },
      {
        key: 'parameterType',
        label: this.t.translate('admin.systemParam.field.parameterType'),
        sortable: true,
        width: '110px',
        badges: {
          'STRING':   { label: 'STRING',   color: 'neutral' },
          'INTEGER':  { label: 'INTEGER',  color: 'neutral' },
          'DECIMAL':  { label: 'DECIMAL',  color: 'neutral' },
          'BOOLEAN':  { label: 'BOOLEAN',  color: 'neutral' },
          'DATE':     { label: 'DATE',     color: 'neutral' },
          'DATETIME': { label: 'DATETIME', color: 'neutral' },
        },
      },
      {
        key: 'category',
        label: this.t.translate('admin.systemParam.field.category'),
        sortable: true,
        width: '140px',
      },
      {
        key: 'currentValue',
        label: this.t.translate('admin.systemParam.field.currentValue'),
        sortable: false,
      },
      {
        key: 'updatedBy',
        label: this.t.translate('admin.systemParam.field.updatedBy'),
        sortable: false,
        width: '200px',
      },
    ];

    return {
      tableId: 'system-parameters',
      columns,
      pagination: {
        mode: 'backend',
        totalItems: this.totalItems(),
        pageSize: this.pageSize(),
        pageSizeOptions: [25, 50, 100],
      },
      showFilter: false,
      toolbar: [
        {
          label:    this.t.translate('admin.systemParam.action.history'),
          icon:     'history',
          disabled: !selected,
          tooltip:  !selected ? this.t.translate('admin.toolbar.selectParam') : undefined,
          action:   () => { if (selected) this.openHistory(selected); },
        },
      ],
      rowDblClick: this.isAdmin() ? (row) => this.openEditDialog(row) : undefined,
    };
  });

  constructor() {
    this.load();
  }

  protected onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.service.findAll(this.pageIndex(), this.pageSize()).subscribe({
      next: (page) => {
        this.data.set(page.content.map(p => ({ ...p, currentValue: this.formatValue(p) })));
        this.totalItems.set(page.totalElements);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private openEditDialog(row: SystemParameterRow): void {
    this.matDialog
      .open(SystemParameterEditDialog, {
        width: '560px',
        maxWidth: '95vw',
        disableClose: false,
        data: { parameter: row } satisfies SystemParameterEditDialogData,
      })
      .afterClosed()
      .subscribe((updated: SystemParameterDto | null) => {
        if (updated) {
          this.data.update(list =>
            list.map(p => p.id === updated.id ? { ...updated, currentValue: this.formatValue(updated) } : p)
          );
        }
      });
  }

  private openHistory(row: SystemParameterRow): void {
    this.historyService.getSystemParameterRevisions(row.id).subscribe(entries => {
      this.matDialog.open(HistoryDialog, {
        data: {
          title: `${row.parameterKey} – ${row.parameterName}`,
          entries,
          fieldLabels: this.buildFieldLabels(),
        } satisfies HistoryDialogData,
        maxWidth: '800px',
        width: '95vw',
      });
    });
  }

  private buildFieldLabels(): Record<string, string> {
    const tr = (k: string) => this.t.translate<string>('history.fields.' + k);
    return {
      id: tr('id'),
      parameterKey: this.t.translate('admin.systemParam.field.parameterKey'),
      parameterName: this.t.translate('admin.systemParam.field.parameterName'),
      parameterType: this.t.translate('admin.systemParam.field.parameterType'),
      description: tr('description'),
      category: this.t.translate('admin.systemParam.field.category'),
      stringValue: this.t.translate('admin.systemParam.field.stringValue'),
      integerValue: this.t.translate('admin.systemParam.field.integerValue'),
      decimalValue: this.t.translate('admin.systemParam.field.decimalValue'),
      booleanValue: this.t.translate('admin.systemParam.field.booleanValue'),
      dateValue: this.t.translate('admin.systemParam.field.dateValue'),
      datetimeValue: this.t.translate('admin.systemParam.field.datetimeValue'),
      systemDefined: tr('systemDefined'),
      createdAt: tr('createdAt'),
      createdBy: tr('createdBy'),
      updatedAt: tr('updatedAt'),
      updatedBy: tr('updatedBy'),
    };
  }

  private formatValue(param: SystemParameterDto): string {
    switch (param.parameterType) {
      case 'STRING':   return param.stringValue   ?? '—';
      case 'INTEGER':  return param.integerValue  != null ? String(param.integerValue)  : '—';
      case 'DECIMAL':  return param.decimalValue  != null ? String(param.decimalValue)  : '—';
      case 'BOOLEAN':  return param.booleanValue  != null ? (param.booleanValue ? '✓ true' : '✗ false') : '—';
      case 'DATE':     return param.dateValue     ?? '—';
      case 'DATETIME': return param.datetimeValue ? param.datetimeValue.replace('T', ' ') : '—';
      default:         return '—';
    }
  }
}
