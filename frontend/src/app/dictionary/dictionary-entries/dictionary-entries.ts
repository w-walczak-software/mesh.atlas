import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
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
import { DictionaryEntryService } from '../service/dictionary-entry.service';
import { DictionaryEntryDto, DictionaryTypeDto } from '../model/dictionary.model';
import { EditEntryDialog } from './edit-entry.dialog';
import { AddEntryDialog, AddEntryDialogData } from './add-entry.dialog';

@Component({
  selector: 'app-dictionary-entries',
  imports: [DataTable, TranslocoDirective, MatIconModule, MatButtonModule],
  providers: [provideTranslocoScope('dictionary')],
  templateUrl: './dictionary-entries.html',
  styleUrl: './dictionary-entries.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DictionaryEntries {
  readonly id = input.required<string>();

  private readonly typeService = inject(DictionaryTypeService);
  private readonly entryService = inject(DictionaryEntryService);
  private readonly historyService = inject(HistoryService);
  private readonly router = inject(Router);
  private readonly dialogs = inject(DialogService);
  private readonly toast = inject(ToastService);
  private readonly matDialog = inject(MatDialog);
  private readonly t = inject(TranslocoService);

  protected readonly lang = toSignal(this.t.langChanges$, { initialValue: this.t.getActiveLang() });
  protected readonly typeInfo = signal<DictionaryTypeDto | null>(null);
  protected readonly data = signal<DictionaryEntryDto[]>([]);
  protected readonly loading = signal(false);
  protected readonly selectedEntry = signal<DictionaryEntryDto | null>(null);
  private readonly totalItems = signal(0);
  private readonly pageIndex = signal(0);
  private readonly pageSize = signal(20);

  protected readonly tableConfig = computed<TableConfig<DictionaryEntryDto>>(() => {
    const _lang = this.lang();
    const selected = this.selectedEntry();
    return {
      tableId: 'dictionary-entries',
      columns: [
        { key: 'code', label: this.t.translate('dictionary.entry.code'), width: '160px', sortable: true },
        { key: 'name', label: this.t.translate('dictionary.entry.name'), sortable: true },
        { key: 'description', label: this.t.translate('dictionary.entry.description'), sortable: true },
        { key: 'displayOrder', label: this.t.translate('dictionary.entry.displayOrder'), width: '110px', sortable: true },
        {
          key: 'systemDefined',
          label: this.t.translate('dictionary.entry.systemDefined'),
          width: '130px',
          sortable: true,
          badges: {
            'true': { label: this.t.translate('dictionary.badge.system'), color: 'secondary' },
            'false': { label: this.t.translate('dictionary.badge.custom'), color: 'neutral' },
          },
        },
        {
          key: 'active',
          label: this.t.translate('dictionary.entry.active'),
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
      toolbar: [
        {
          label: this.t.translate('dictionary.action.add'),
          icon: 'add',
          action: () => this.openAddDialog(),
        },
        {
          label: this.t.translate('dictionary.action.edit'),
          icon: 'edit',
          disabled: !selected,
          action: () => { if (selected) this.openEditDialog(selected); },
        },
        {
          label: this.t.translate('dictionary.action.deactivate'),
          icon: 'block',
          disabled: !selected || selected.systemDefined || !selected.active,
          action: () => { if (selected) this.confirmDeactivate(selected); },
        },
      ],
      actions: [
        {
          label: this.t.translate('dictionary.action.edit'),
          icon: 'edit',
          action: (row) => this.openEditDialog(row),
        },
        {
          label: this.t.translate('dictionary.action.history'),
          icon: 'history',
          action: (row) => this.openEntryHistory(row),
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
    effect(() => {
      const typeId = this.id();
      this.pageIndex.set(0);
      this.typeService.findById(typeId).subscribe({
        next: (type) => this.typeInfo.set(type),
        error: () => {},
      });
      this.loadEntries(typeId);
    });
  }

  protected onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadEntries(this.id());
  }

  protected goBack(): void {
    this.router.navigate(['/dictionaries/types']);
  }

  private loadEntries(typeId: string, selectId?: string): void {
    this.loading.set(true);
    this.entryService.findByTypeIdPaged(typeId, undefined, this.pageIndex(), this.pageSize()).subscribe({
      next: (page) => {
        this.data.set(page.content);
        this.totalItems.set(page.totalElements);
        this.loading.set(false);
        if (selectId) {
          this.selectedEntry.set(page.content.find(e => e.id === selectId) ?? null);
        }
      },
      error: () => this.loading.set(false),
    });
  }

  private openEntryHistory(row: DictionaryEntryDto): void {
    this.historyService.getDictionaryEntryRevisions(row.id).subscribe(entries => {
      this.matDialog.open(HistoryDialog, {
        data: {
          title: `${row.typeCode} / ${row.code} – ${row.name}`,
          entries,
          fieldLabels: this.buildEntryFieldLabels(),
        } satisfies HistoryDialogData,
        maxWidth: '800px',
        width: '95vw',
      });
    });
  }

  private buildEntryFieldLabels(): Record<string, string> {
    const tr = (k: string) => this.t.translate<string>('history.fields.' + k);
    return {
      id: tr('id'), typeId: tr('typeId'), typeCode: tr('typeCode'),
      code: tr('code'), name: tr('name'), description: tr('description'),
      displayOrder: tr('displayOrder'), active: tr('active'), systemDefined: tr('systemDefined'),
      createdAt: tr('createdAt'), createdBy: tr('createdBy'),
      updatedAt: tr('updatedAt'), updatedBy: tr('updatedBy'),
    };
  }

  private openAddDialog(): void {
    const type = this.typeInfo();
    if (!type) return;
    const data: AddEntryDialogData = { typeId: type.id, typeCode: type.code };
    this.matDialog
      .open(AddEntryDialog, { width: '560px', maxWidth: '95vw', disableClose: true, data })
      .afterClosed()
      .subscribe((created: DictionaryEntryDto | undefined) => {
        if (created) {
          this.toast.success(this.t.translate('dictionary.toast.entryCreated'));
          this.loadEntries(this.id(), created.id);
        }
      });
  }

  private openEditDialog(row: DictionaryEntryDto): void {
    this.matDialog
      .open(EditEntryDialog, { width: '560px', maxWidth: '95vw', disableClose: true, data: row })
      .afterClosed()
      .subscribe((updated: DictionaryEntryDto | undefined) => {
        if (updated) {
          this.toast.success(this.t.translate('dictionary.toast.entryUpdated'));
          this.loadEntries(this.id(), updated.id);
        }
      });
  }

  private confirmDeactivate(row: DictionaryEntryDto): void {
    this.dialogs.question(
      this.t.translate('dictionary.action.deactivate'),
      this.t.translate('dictionary.confirm.deactivateEntry'),
      () => {
        this.entryService.deactivate(row.id).subscribe({
          next: () => {
            this.toast.success(this.t.translate('dictionary.toast.entryDeactivated'));
            this.loadEntries(this.id());
          },
        });
      },
    );
  }
}
