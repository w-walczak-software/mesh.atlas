import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  OnDestroy,
  output,
  signal,
  untracked,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslocoService } from '@jsverse/transloco';
import { ActionDef, BadgeColor, CellDisplay, ColumnDef, IconConfig, PageEvent, PaginationConfig, SortDirection, SortState, TableConfig } from './data-table.models';

const PREDEFINED_COLORS = new Set<BadgeColor>([
  'primary', 'secondary', 'tertiary', 'error', 'success', 'warn', 'neutral',
]);

interface DragState {
  draggingKey: string | null;
  overKey: string | null;
}

@Component({
  selector: 'app-data-table',
  imports: [FormsModule, MatCheckboxModule, MatIconModule, MatButtonModule, MatMenuModule, MatTooltipModule],
  templateUrl: './data-table.html',
  styleUrl: './data-table.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.dt-embedded]': 'embedded()' },
})
export class DataTable<T extends object> implements OnDestroy {
  readonly config = input.required<TableConfig<T>>();
  readonly data = input<T[]>([]);
  readonly loading = input(false);
  readonly embedded = input(false);
  readonly selectedItem = input<T | null>(null);
  /**
   * Externally controlled active page index (0-based).
   * Use to sync the table's pagination display when loading pages programmatically.
   */
  readonly currentPage = input<number | null>(null);
  /**
   * Pre-checked row IDs for state restore after navigation.
   * Requires `config().rowId` to be set.
   * Applied once — on the first data load where matching rows are found.
   */
  readonly checkedRowIds = input<string[]>([]);

  readonly rowSelect = output<T | null>();
  readonly rowsSelect = output<T[]>();
  readonly pageChange = output<PageEvent>();

  private readonly t = inject(TranslocoService);
  private readonly lang = toSignal(this.t.langChanges$, { initialValue: this.t.getActiveLang() });

  protected readonly ui = computed(() => {
    this.lang();
    return {
      filterPlaceholder: this.t.translate<string>('common.table.filterPlaceholder'),
      filterAriaLabel: this.t.translate<string>('common.table.filterAriaLabel'),
      filterClear: this.t.translate<string>('common.table.filterClear'),
      loading: this.t.translate<string>('common.table.loading'),
      noData: this.t.translate<string>('common.table.noData'),
      rowsPerPage: this.t.translate<string>('common.table.rowsPerPage'),
      columnVisibility: this.t.translate<string>('common.table.columnVisibility'),
      prevPage: this.t.translate<string>('common.table.prevPage'),
      nextPage: this.t.translate<string>('common.table.nextPage'),
      selectAll: this.t.translate<string>('common.table.selectAll'),
      selectRow: this.t.translate<string>('common.table.selectRow'),
      rowActions: this.t.translate<string>('common.table.rowActions'),
    };
  });

  protected readonly rowCountLabel = computed(() => {
    this.lang();
    const total = this.totalItems();
    if (total === 0) return this.t.translate<string>('common.table.noRows');
    const pg = this.config().pagination;
    if (!pg) return this.t.translate<string>('common.table.rowCount', { count: total });
    return this.t.translate<string>('common.table.rowRange', {
      from: this.pageStart(),
      to: this.pageEnd(),
      total,
    });
  });

  protected readonly filterValue = signal('');
  protected readonly sort = signal<SortState>({ column: '', direction: null });
  protected readonly selectedRow = signal<T | null>(null);
  protected readonly checkedRows = signal<Set<T>>(new Set());
  protected readonly pageIndex = signal(0);
  protected readonly pageSize = signal(10);
  protected readonly drag = signal<DragState>({ draggingKey: null, overKey: null });

  private filterDebounce: ReturnType<typeof setTimeout> | null = null;
  protected readonly rawFilter = signal('');

  protected readonly hiddenKeys = signal<Set<string>>(new Set());
  protected readonly columnOrder = signal<string[]>([]);

  private storageKeysLoaded = false;
  /** Prevents `checkedRowIds` from overwriting user-made checkbox changes after the first sync. */
  private checkedRowIdsApplied = false;

  protected readonly visibleColumns = computed<ColumnDef<T>[]>(() => {
    const cfg = this.config();
    const order = this.columnOrder();
    const hidden = this.hiddenKeys();

    let cols = [...cfg.columns];

    if (order.length) {
      cols.sort((a, b) => {
        const ai = order.indexOf(a.key);
        const bi = order.indexOf(b.key);
        return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
      });
    }

    return cols.filter(c => !hidden.has(c.key) && !c.hidden);
  });

  protected readonly toggleableCols = computed(() =>
    this.config().columns.filter(c => !c.hidden)
  );

  protected readonly filteredData = computed<T[]>(() => {
    const filter = this.filterValue().toLowerCase().trim();
    let rows = this.data();

    if (filter) {
      rows = rows.filter(row =>
        Object.values(row as Record<string, unknown>).some(v => String(v ?? '').toLowerCase().includes(filter))
      );
    }

    const s = this.sort();
    if (s.column && s.direction) {
      const dir = s.direction === 'asc' ? 1 : -1;
      rows = [...rows].sort((a, b) => {
        const av = String((a as Record<string, unknown>)[s.column] ?? '');
        const bv = String((b as Record<string, unknown>)[s.column] ?? '');
        return av.localeCompare(bv) * dir;
      });
    }

    return rows;
  });

  protected readonly paginatedData = computed<T[]>(() => {
    const cfg = this.config();
    const pg = cfg.pagination;
    if (!pg || pg.mode === 'backend') return this.filteredData();

    const size = this.pageSize();
    const idx = this.pageIndex();
    return this.filteredData().slice(idx * size, idx * size + size);
  });

  protected readonly totalItems = computed(() => {
    const cfg = this.config();
    const pg = cfg.pagination;
    if (!pg) return this.filteredData().length;
    if (pg.mode === 'backend') return pg.totalItems ?? 0;
    return this.filteredData().length;
  });

  protected readonly totalPages = computed(() => {
    const size = this.pageSize();
    return Math.max(1, Math.ceil(this.totalItems() / size));
  });

  protected readonly pageStart = computed(() => this.pageIndex() * this.pageSize() + 1);
  protected readonly pageEnd = computed(() => Math.min((this.pageIndex() + 1) * this.pageSize(), this.totalItems()));

  protected readonly allChecked = computed(() => {
    const rows = this.paginatedData();
    if (!rows.length) return false;
    const checked = this.checkedRows();
    return rows.every(r => checked.has(r));
  });

  protected readonly someChecked = computed(() => {
    const rows = this.paginatedData();
    const checked = this.checkedRows();
    return rows.some(r => checked.has(r)) && !this.allChecked();
  });

  constructor() {
    // Persist column visibility / order preferences
    effect(() => {
      const cfg = this.config();
      if (!cfg || this.storageKeysLoaded) return;
      this.storageKeysLoaded = true;

      const defaultHidden = new Set(cfg.columns.filter(c => c.defaultHidden).map(c => c.key));
      const savedHidden = this.loadStorage<string[]>('hidden');
      this.hiddenKeys.set(savedHidden ? new Set(savedHidden) : defaultHidden);

      const savedOrder = this.loadStorage<string[]>('order');
      this.columnOrder.set(savedOrder ?? cfg.columns.map(c => c.key));

      const pg = cfg.pagination;
      if (pg?.pageSize) this.pageSize.set(pg.pageSize);
    });

    // Sync external page control → internal pageIndex
    effect(() => {
      const p = this.currentPage();
      if (p === null) return;
      untracked(() => { if (this.pageIndex() !== p) this.pageIndex.set(p); });
    }, { allowSignalWrites: true });

    // One-shot restore of pre-checked rows from `checkedRowIds` input
    effect(() => {
      const ids = this.checkedRowIds();
      const rowId = this.config()?.rowId;
      const rows = this.data();

      if (!ids.length || !rowId || this.checkedRowIdsApplied) return;

      const idSet = new Set(ids);
      const matching = rows.filter(r => idSet.has(rowId(r)));
      if (!matching.length) return;  // data not yet loaded — wait for next tick

      this.checkedRowIdsApplied = true;
      untracked(() => {
        this.checkedRows.set(new Set(matching));
        this.rowsSelect.emit(matching);
      });
    }, { allowSignalWrites: true });
  }

  ngOnDestroy(): void {
    if (this.filterDebounce) clearTimeout(this.filterDebounce);
  }

  protected onFilterInput(value: string): void {
    this.rawFilter.set(value);
    if (this.filterDebounce) clearTimeout(this.filterDebounce);
    this.filterDebounce = setTimeout(() => {
      this.filterValue.set(value);
      this.pageIndex.set(0);
    }, 300);
  }

  protected sortBy(key: string): void {
    const col = this.config().columns.find(c => c.key === key);
    if (!col?.sortable) return;

    this.sort.update(s => {
      if (s.column !== key) return { column: key, direction: 'asc' };
      if (s.direction === 'asc') return { column: key, direction: 'desc' };
      return { column: '', direction: null };
    });
  }

  protected getSortIcon(key: string): string {
    const s = this.sort();
    if (s.column !== key || !s.direction) return 'unfold_more';
    return s.direction === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  protected isSortActive(key: string): boolean {
    return this.sort().column === key && this.sort().direction !== null;
  }

  protected clickRow(row: T, event: MouseEvent): void {
    if ((event.target as HTMLElement).closest('.checkbox-cell')) return;
    this.selectedRow.set(row);
    this.rowSelect.emit(row);
    this.config().rowClick?.(row);
  }

  protected dblClickRow(row: T): void {
    this.config().rowDblClick?.(row);
  }

  protected getRowStyle(row: T): Record<string, string> {
    return this.config().rowStyle?.(row) ?? {};
  }

  protected isSelected(row: T): boolean {
    return this.selectedRow() === row || this.selectedItem() === row;
  }

  protected isChecked(row: T): boolean {
    return this.checkedRows().has(row);
  }

  protected toggleCheck(row: T): void {
    this.checkedRows.update(set => {
      const next = new Set(set);
      if (next.has(row)) next.delete(row); else next.add(row);
      return next;
    });
    this.rowsSelect.emit([...this.checkedRows()]);
  }

  protected toggleAll(): void {
    const rows = this.paginatedData();
    if (this.allChecked()) {
      this.checkedRows.update(set => {
        const next = new Set(set);
        rows.forEach(r => next.delete(r));
        return next;
      });
    } else {
      this.checkedRows.update(set => {
        const next = new Set(set);
        rows.forEach(r => next.add(r));
        return next;
      });
    }
    this.rowsSelect.emit([...this.checkedRows()]);
  }

  protected toggleColumnVisibility(key: string): void {
    this.hiddenKeys.update(set => {
      const next = new Set(set);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
    this.saveStorage('hidden', [...this.hiddenKeys()]);
  }

  protected isColumnVisible(key: string): boolean {
    return !this.hiddenKeys().has(key);
  }

  protected onDragStart(key: string): void {
    this.drag.update(d => ({ ...d, draggingKey: key }));
  }

  protected onDragOver(key: string, event: DragEvent): void {
    event.preventDefault();
    this.drag.update(d => ({ ...d, overKey: key }));
  }

  protected onDrop(targetKey: string): void {
    const sourceKey = this.drag().draggingKey;
    if (!sourceKey || sourceKey === targetKey) {
      this.drag.set({ draggingKey: null, overKey: null });
      return;
    }

    this.columnOrder.update(order => {
      const arr = [...order];
      const si = arr.indexOf(sourceKey);
      const ti = arr.indexOf(targetKey);
      if (si === -1 || ti === -1) return arr;
      arr.splice(si, 1);
      arr.splice(ti, 0, sourceKey);
      return arr;
    });

    this.saveStorage('order', this.columnOrder());
    this.drag.set({ draggingKey: null, overKey: null });
  }

  protected onDragEnd(): void {
    this.drag.set({ draggingKey: null, overKey: null });
  }

  protected isDragOver(key: string): boolean {
    return this.drag().overKey === key;
  }

  protected prevPage(): void {
    if (this.pageIndex() > 0) {
      this.pageIndex.update(i => i - 1);
      this.emitPage();
    }
  }

  protected nextPage(): void {
    if (this.pageIndex() < this.totalPages() - 1) {
      this.pageIndex.update(i => i + 1);
      this.emitPage();
    }
  }

  protected setPageSize(size: number): void {
    this.pageSize.set(size);
    this.pageIndex.set(0);
    this.emitPage();
  }

  private emitPage(): void {
    this.pageChange.emit({ pageIndex: this.pageIndex(), pageSize: this.pageSize() });
  }

  protected get pageSizeOptions(): number[] {
    return this.config().pagination?.pageSizeOptions ?? [5, 10, 25, 50];
  }

  protected get hasPagination(): boolean {
    return !!this.config().pagination;
  }

  protected get hasActions(): boolean {
    return !!this.config().actions?.length;
  }

  protected readonly colspanTotal = computed(() =>
    this.visibleColumns().length
    + (this.config().showCheckboxes ? 1 : 0)
    + (this.config().actions?.length ? 1 : 0)
  );

  protected isActionDisabled(action: ActionDef<T>, row: T): boolean {
    if (typeof action.disabled === 'function') return action.disabled(row);
    return action.disabled ?? false;
  }

  protected isActionVisible(action: ActionDef<T>, row: T): boolean {
    if (typeof action.visible === 'function') return action.visible(row);
    return action.visible ?? true;
  }

  protected getActionColorClass(action: ActionDef<T>): string {
    if (!action.color) return '';
    return PREDEFINED_COLORS.has(action.color as BadgeColor)
      ? `dt-action--${action.color}`
      : '';
  }

  protected getActionColorStyle(action: ActionDef<T>): Record<string, string> {
    if (!action.color || PREDEFINED_COLORS.has(action.color as BadgeColor)) return {};
    return { color: action.color };
  }

  private storageKey(suffix: string): string {
    return `dt_${this.config().tableId}_${suffix}`;
  }

  private saveStorage(suffix: string, value: unknown): void {
    try {
      localStorage.setItem(this.storageKey(suffix), JSON.stringify(value));
    } catch { /* storage unavailable */ }
  }

  private loadStorage<R>(suffix: string): R | null {
    try {
      const raw = localStorage.getItem(this.storageKey(suffix));
      return raw ? JSON.parse(raw) as R : null;
    } catch {
      return null;
    }
  }

  protected getCellValue(row: T, key: string): string {
    return String((row as Record<string, unknown>)[key] ?? '');
  }

  protected getDisplay(col: ColumnDef<T>, row: T): CellDisplay {
    if (col.cellRender) return col.cellRender(row);

    const value = this.getCellValue(row, col.key);

    if (col.icons) {
      const cfg: IconConfig | undefined = col.icons[value];
      if (cfg) {
        const label = cfg.label;
        if (cfg.color && PREDEFINED_COLORS.has(cfg.color as BadgeColor)) {
          return { icon: { name: cfg.name, colorClass: cfg.color, label } };
        }
        const style: Record<string, string> = cfg.color ? { color: cfg.color } : {};
        return { icon: { name: cfg.name, style, label } };
      }
    }

    if (col.badges) {
      const cfg = col.badges[value];
      if (cfg) {
        const label = cfg.label ?? value;
        if (PREDEFINED_COLORS.has(cfg.color as BadgeColor)) {
          return { badge: { label, colorClass: cfg.color } };
        }
        const style: Record<string, string> = { background: cfg.color };
        if (cfg.textColor) style['color'] = cfg.textColor;
        return { badge: { label, style } };
      }
    }

    return { text: value };
  }

  protected trackByKey(_: number, col: ColumnDef<T>): string {
    return col.key;
  }

  protected trackByRow(idx: number, _: T): number {
    return idx;
  }
}
