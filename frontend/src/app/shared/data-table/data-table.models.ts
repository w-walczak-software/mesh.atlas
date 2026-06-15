export type BadgeColor =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'error'
  | 'success'
  | 'warn'
  | 'neutral';

// ── Badge ─────────────────────────────────────────────────────────────────────

export interface BadgeConfig {
  /** Tekst wyświetlany na fasolce — jeśli pominięty, użyta zostanie wartość komórki. */
  label?: string;
  /** Predefiniowany kolor z palety M3 lub dowolny kolor CSS (hex, rgb, hsl…). */
  color: BadgeColor | string;
  /** Kolor tekstu — stosowany tylko przy niestandardowym kolorze CSS. */
  textColor?: string;
}

export interface BadgeDisplay {
  label: string;
  colorClass?: string;
  style?: Record<string, string>;
}

// ── Icon ──────────────────────────────────────────────────────────────────────

export interface IconConfig {
  /** Nazwa ikony Material Symbols (np. `'check_circle'`, `'cloud'`). */
  name: string;
  /** Predefiniowany kolor z palety M3 lub dowolny kolor CSS. Brak = kolor dziedziczony. */
  color?: BadgeColor | string;
  /** Opcjonalny tekst wyświetlany obok ikony. Jeśli pominięty — wyświetlona jest tylko ikona. */
  label?: string;
}

export interface IconDisplay {
  name: string;
  colorClass?: string;
  style?: Record<string, string>;
  label?: string;
}

// ── Cell display ──────────────────────────────────────────────────────────────

export interface CellDisplay {
  text?: string;
  badge?: BadgeDisplay;
  icon?: IconDisplay;
}

// ── Column definition ─────────────────────────────────────────────────────────

export interface ColumnDef<T extends object> {
  key: keyof T & string;
  label: string;
  sortable?: boolean;
  hidden?: boolean;
  defaultHidden?: boolean;
  width?: string;
  cellClass?: (row: T) => string;
  /** Mapa wartości komórki na konfigurację fasolki (badge). */
  badges?: Record<string, BadgeConfig>;
  /** Mapa wartości komórki na konfigurację ikony. Ma pierwszeństwo przed `badges`. */
  icons?: Record<string, IconConfig>;
  /** Funkcja renderująca komórkę. Ma najwyższy priorytet — wyprzedza `icons` i `badges`. */
  cellRender?: (row: T) => CellDisplay;
}

// ── Table config ──────────────────────────────────────────────────────────────

export type SortDirection = 'asc' | 'desc' | null;

export interface SortState {
  column: string;
  direction: SortDirection;
}

export interface PageEvent {
  pageIndex: number;
  pageSize: number;
}

export interface PaginationConfig {
  mode: 'frontend' | 'backend';
  pageSize?: number;
  pageSizeOptions?: number[];
  totalItems?: number;
}

export interface ToolbarButton {
  label: string;
  icon?: string;
  /** Gdy `false` przycisk jest ukryty. Domyślnie `true`. */
  visible?: boolean;
  disabled?: boolean;
  tooltip?: string;
  /** Predefiniowany kolor — aktualnie obsługiwany: 'error' */
  color?: string;
  action: () => void;
}

export interface TableConfig<T extends object> {
  tableId: string;
  columns: ColumnDef<T>[];
  showCheckboxes?: boolean;
  showFilter?: boolean;
  toolbar?: ToolbarButton[];
  pagination?: PaginationConfig;
  rowClick?: (row: T) => void;
  rowDblClick?: (row: T) => void;
  rowStyle?: (row: T) => Record<string, string>;
  /**
   * Function that returns a stable string identifier for each row.
   * Required when using the `checkedRowIds` input on `DataTable` to restore
   * pre-checked rows after navigation.
   */
  rowId?: (row: T) => string;
}
