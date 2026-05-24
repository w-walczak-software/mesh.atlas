import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { TranslocoDirective, TranslocoService, provideTranslocoScope } from '@jsverse/transloco';
import { toSignal } from '@angular/core/rxjs-interop';
import { DataTable } from '@shared/data-table/data-table';
import { PageEvent, TableConfig } from '@shared/data-table/data-table.models';
import { DialogService } from '@shared/dialogs/dialog.service';
import { ToastService } from '@shared/toast/toast.service';
import { HistoryDialog, HistoryDialogData } from '@shared/history/history.dialog';
import { HistoryService } from '@shared/history/history.service';
import { DictionaryTypeService } from '../service/dictionary-type.service';
import { DictionaryTypeDto } from '../model/dictionary.model';
import { EditTypeDialog } from './edit-type.dialog';

@Component({
  selector: 'app-dictionary-types',
  imports: [DataTable, TranslocoDirective, MatIconModule, MatButtonModule],
  providers: [provideTranslocoScope('dictionary')],
  templateUrl: './dictionary-types.html',
  styleUrl: './dictionary-types.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DictionaryTypes {
  private readonly service = inject(DictionaryTypeService);
  private readonly historyService = inject(HistoryService);
  private readonly router = inject(Router);
  private readonly dialogs = inject(DialogService);
  private readonly toast = inject(ToastService);
  private readonly matDialog = inject(MatDialog);
  private readonly t = inject(TranslocoService);

  protected readonly lang = toSignal(this.t.langChanges$, { initialValue: this.t.getActiveLang() });
  protected readonly data = signal<DictionaryTypeDto[]>([]);
  protected readonly loading = signal(false);
  private readonly totalItems = signal(0);
  private readonly pageIndex = signal(0);
  private readonly pageSize = signal(20);

  protected readonly tableConfig = computed<TableConfig<DictionaryTypeDto>>(() => {
    const _lang = this.lang();
    const selectedId = this.service.lastSelectedId();
    return {
      tableId: 'dictionary-types',
      columns: [
        { key: 'code', label: this.t.translate('dictionary.type.code'), width: '160px', sortable: true },
        { key: 'name', label: this.t.translate('dictionary.type.name'), sortable: true },
        { key: 'description', label: this.t.translate('dictionary.type.description'), sortable: true },
        {
          key: 'systemDefined',
          label: this.t.translate('dictionary.type.systemDefined'),
          width: '130px',
          sortable: true,
          badges: {
            'true': { label: this.t.translate('dictionary.badge.system'), color: 'secondary' },
            'false': { label: this.t.translate('dictionary.badge.custom'), color: 'neutral' },
          },
        },
        {
          key: 'active',
          label: this.t.translate('dictionary.type.active'),
          width: '110px',
          sortable: true,
          badges: {
            'true': { label: this.t.translate('dictionary.badge.active'), color: 'success' },
            'false': { label: this.t.translate('dictionary.badge.inactive'), color: 'error' },
          },
        },
      ],
      pagination: {
        mode: 'backend',
        totalItems: this.totalItems(),
        pageSize: this.pageSize(),
        pageSizeOptions: [10, 20, 50],
      },
      showFilter: true,
      rowDblClick: (row) => this.viewEntries(row),
      rowStyle: (row): Record<string, string> => row.id === selectedId
        ? { background: 'var(--mat-sys-secondary-container)' }
        : {},
      actions: [
        {
          label: this.t.translate('dictionary.action.edit'),
          icon: 'edit',
          action: (row) => this.openEditDialog(row),
        },
        {
          label: this.t.translate('dictionary.action.history'),
          icon: 'history',
          action: (row) => this.openTypeHistory(row),
        },
        {
          label: this.t.translate('dictionary.action.deactivate'),
          icon: 'block',
          color: 'error',
          disabled: (row) => row.systemDefined || !row.active,
          action: (row) => this.confirmDeactivate(row),
        },
      ],
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
    this.service.findAll(undefined, this.pageIndex(), this.pageSize()).subscribe({
      next: (page) => {
        this.data.set(page.content);
        this.totalItems.set(page.totalElements);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private viewEntries(row: DictionaryTypeDto): void {
    this.service.lastSelectedId.set(row.id);
    this.router.navigate(['/dictionaries/types', row.id, 'entries']);
  }

  private openTypeHistory(row: DictionaryTypeDto): void {
    this.historyService.getDictionaryTypeRevisions(row.id).subscribe(entries => {
      this.matDialog.open(HistoryDialog, {
        data: {
          title: `${row.code} – ${row.name}`,
          entries,
          fieldLabels: this.buildTypeFieldLabels(),
        } satisfies HistoryDialogData,
        maxWidth: '800px',
        width: '95vw',
      });
    });
  }

  private buildTypeFieldLabels(): Record<string, string> {
    const tr = (k: string) => this.t.translate<string>('history.fields.' + k);
    return {
      id: tr('id'), code: tr('code'), name: tr('name'), description: tr('description'),
      systemDefined: tr('systemDefined'), active: tr('active'),
      createdAt: tr('createdAt'), createdBy: tr('createdBy'),
      updatedAt: tr('updatedAt'), updatedBy: tr('updatedBy'),
    };
  }

  private openEditDialog(row: DictionaryTypeDto): void {
    this.matDialog
      .open(EditTypeDialog, { width: '560px', maxWidth: '95vw', disableClose: true, data: row })
      .afterClosed()
      .subscribe((updated: DictionaryTypeDto | undefined) => {
        if (updated) {
          this.toast.success(this.t.translate('dictionary.toast.typeUpdated'));
          this.load();
        }
      });
  }

  private confirmDeactivate(row: DictionaryTypeDto): void {
    this.dialogs.question(
      this.t.translate('dictionary.action.deactivate'),
      this.t.translate('dictionary.confirm.deactivateType'),
      () => {
        this.service.deactivate(row.id).subscribe({
          next: () => {
            this.toast.success(this.t.translate('dictionary.toast.typeDeactivated'));
            this.load();
          },
        });
      },
    );
  }
}
