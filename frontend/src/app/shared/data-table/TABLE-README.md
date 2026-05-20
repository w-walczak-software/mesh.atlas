# DataTable — dokumentacja komponentu

Generyczny komponent tabeli danych (`app-data-table`) obsługujący sortowanie, filtrowanie, paginację, zaznaczanie wierszy, zmianę kolejności i widoczności kolumn.

Lokalizacja: `src/app/shared/data-table/`

---

## Szybki start

```typescript
// my-feature.ts
import { DataTable } from '../shared/data-table/data-table';
import { TableConfig } from '../shared/data-table/data-table.models';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

@Component({
  imports: [DataTable],
  template: `<app-data-table [config]="tableConfig" [data]="users" />`,
})
export class MyFeature {
  readonly users: User[] = [ /* ... */ ];

  readonly tableConfig: TableConfig<User> = {
    tableId: 'users',
    columns: [
      { key: 'name',  label: 'Imię i nazwisko', sortable: true },
      { key: 'email', label: 'E-mail',           sortable: true },
      { key: 'role',  label: 'Rola' },
    ],
  };
}
```

```html
<app-data-table [config]="tableConfig" [data]="users" />
```

---

## Inputy komponentu

| Input      | Typ               | Wymagany | Domyślnie | Opis |
|------------|-------------------|----------|-----------|------|
| `config`   | `TableConfig<T>`  | tak      | —         | Główna konfiguracja tabeli (kolumny, zachowania, paginacja). |
| `data`     | `T[]`             | nie      | `[]`      | Tablica wierszy do wyświetlenia. |
| `loading`  | `boolean`         | nie      | `false`   | Gdy `true`, tabela pokazuje stan ładowania zamiast danych. |
| `embedded` | `boolean`         | nie      | `false`   | Tryb osadzony — usuwa zewnętrzną ramkę i zaokrąglenie rogów (do użycia wewnątrz `mat-card`). |

---

## Outputy komponentu

| Output       | Typ          | Opis |
|--------------|--------------|------|
| `rowSelect`  | `T \| null`  | Emitowany po kliknięciu wiersza. Zwraca obiekt wiersza lub `null` po odznaczeniu. |
| `rowsSelect` | `T[]`        | Emitowany po każdej zmianie checkboxów. Zwraca tablicę wszystkich zaznaczonych wierszy. |
| `pageChange` | `PageEvent`  | Emitowany przy zmianie strony lub rozmiaru strony (używane w trybie `backend`). |

### `PageEvent`

```typescript
interface PageEvent {
  pageIndex: number; // indeks strony (od 0)
  pageSize:  number; // liczba wierszy na stronie
}
```

---

## `TableConfig<T>`

Obiekt przekazywany przez input `[config]`.

```typescript
interface TableConfig<T extends object> {
  tableId:       string;
  columns:       ColumnDef<T>[];
  showCheckboxes?: boolean;
  showFilter?:     boolean;
  pagination?:     PaginationConfig;
  rowClick?:       (row: T) => void;
  rowDblClick?:    (row: T) => void;
  rowStyle?:       (row: T) => Record<string, string>;
}
```

### `tableId` _(wymagany)_

Unikalny identyfikator tabeli. Używany jako prefiks kluczy w `localStorage`:
- `dt_<tableId>_hidden` — widoczność kolumn
- `dt_<tableId>_order` — kolejność kolumn

Każda tabela w aplikacji musi mieć inny `tableId`, by konfiguracja użytkownika nie nakładała się.

```typescript
tableId: 'api-registry'
```

### `columns` _(wymagany)_

Tablica definicji kolumn. Kolejność w tablicy wyznacza domyślny porządek wyświetlania.

Szczegółowy opis — patrz sekcja [`ColumnDef`](#columndef) poniżej.

### `showCheckboxes`

Gdy `true`, przed każdą kolumną danych pojawia się kolumna z checkboxem umożliwiająca zaznaczanie wielu wierszy jednocześnie. W nagłówku działa checkbox "zaznacz wszystkie na bieżącej stronie".

```typescript
showCheckboxes: true
```

### `showFilter`

Gdy `true`, nad tabelą pojawia się pole tekstowe filtrujące wiersze po wszystkich kolumnach. Filtr działa z opóźnieniem 300 ms po ostatnim naciśnięciu klawisza. Przy filtracji paginacja wraca do strony 0.

```typescript
showFilter: true
```

### `pagination`

Konfiguracja paginacji. Gdy pominięta, wszystkie wiersze wyświetlane są bez stronicowania.

Szczegółowy opis — patrz sekcja [`PaginationConfig`](#paginationconfig) poniżej.

### `rowClick`

Funkcja wywoływana po pojedynczym kliknięciu na wiersz (nie dotyczy kliknięcia w obszar checkboxa). Wybrany wiersz jest zaznaczany i emitowany przez output `rowSelect`.

```typescript
rowClick: (row) => this.router.navigate(['/apis', row.id])
```

### `rowDblClick`

Funkcja wywoływana po podwójnym kliknięciu na wiersz.

```typescript
rowDblClick: (row) => this.dialog.info('Szczegóły', row.description)
```

### `rowStyle`

Funkcja zwracająca obiekt stylów CSS dla danego wiersza (analogicznie do `[ngStyle]`). Umożliwia dynamiczne kolorowanie lub inne wizualne wyróżnienie wierszy na podstawie ich danych.

```typescript
rowStyle: (row): Record<string, string> => {
  if (row.status === 'deprecated') return { opacity: '0.5', fontStyle: 'italic' };
  if (row.priority === 'high')     return { backgroundColor: '#fff3e0' };
  return {};
}
```

> Ważne: funkcja musi zwracać `Record<string, string>` (bez opcjonalnych pól). Użyj jawnej adnotacji typu zwracanego, by uniknąć błędów TypeScript.

---

## `ColumnDef<T>`

```typescript
interface ColumnDef<T extends object> {
  key:            keyof T & string;
  label:          string;
  sortable?:      boolean;
  hidden?:        boolean;
  defaultHidden?: boolean;
  width?:         string;
  cellClass?:     (row: T) => string;
  badges?:        Record<string, BadgeConfig>;
  icons?:         Record<string, IconConfig>;
  cellRender?:    (row: T) => CellDisplay;
}
```

| Pole           | Typ                           | Opis |
|----------------|-------------------------------|------|
| `key`          | `keyof T & string`            | Klucz pola obiektu `T`. Wartość komórki pobierana jest jako `row[key]`. |
| `label`        | `string`                      | Tekst nagłówka kolumny widoczny w tabeli i w menu widoczności. |
| `sortable`     | `boolean`                     | Gdy `true`, kliknięcie w nagłówek sortuje tabelę wg tej kolumny (asc → desc → brak). |
| `hidden`       | `boolean`                     | Kolumna trwale ukryta — nie pojawia się ani w tabeli, ani w menu widoczności. |
| `defaultHidden`| `boolean`                     | Kolumna domyślnie ukryta, ale dostępna w menu widoczności. Wybór jest zapamiętywany. |
| `width`        | `string`                      | Szerokość kolumny jako wartość CSS (`'120px'`, `'15%'`, `'8rem'`). |
| `cellClass`    | `(row: T) => string`          | Funkcja zwracająca klasę CSS przypisywaną do komórki `<td>`. |
| `icons`        | `Record<string, IconConfig>`  | Mapa wartości komórki na ikonę (z opcjonalnym kolorem i etykietą). Ma wyższy priorytet niż `badges`. Szczegóły poniżej. |
| `badges`       | `Record<string, BadgeConfig>` | Mapa wartości komórki na kolorową fasolkę (badge). Szczegóły poniżej. |
| `cellRender`   | `(row: T) => CellDisplay`     | Funkcja renderująca — pełna kontrola nad komórką. Ma najwyższy priorytet (wyprzedza `icons` i `badges`). |

**Priorytet renderowania komórki:** `cellRender` → `icons` → `badges` → tekst.

### Przykłady kolumn

```typescript
columns: [
  // Kolumna podstawowa
  { key: 'name', label: 'Nazwa' },

  // Kolumna z sortowaniem
  { key: 'createdAt', label: 'Data utworzenia', sortable: true },

  // Kolumna o stałej szerokości
  { key: 'status', label: 'Status', sortable: true, width: '120px' },

  // Kolumna domyślnie ukryta (użytkownik może ją włączyć)
  { key: 'internalId', label: 'ID wewnętrzne', defaultHidden: true },

  // Kolumna trwale ukryta (np. klucz do nawigacji)
  { key: 'id', label: 'ID', hidden: true },

  // Kolumna z dynamiczną klasą CSS komórki
  {
    key: 'priority',
    label: 'Priorytet',
    cellClass: (row) => row.priority === 'high' ? 'text-error' : '',
  },
]
```

---

## Ikony (`icons`) — ikona z opcjonalną etykietą

Ikona to minimalistyczna reprezentacja wartości przy użyciu symbolu Material Symbols. Opcjonalnie można wyświetlić etykietę tekstową obok ikony.

### `IconConfig`

```typescript
interface IconConfig {
  name:    string;             // nazwa ikony Material Symbols, np. 'check_circle', 'cloud'
  color?:  BadgeColor | string; // predefiniowany kolor M3 lub dowolny kolor CSS
  label?:  string;             // tekst obok ikony — jeśli pominięty, wyświetlana jest sama ikona
}
```

### Predefiniowane kolory ikon

Kolory ikon korzystają z kolorów pierwszego planu tokenów M3 (nie tła — ikony są małe).

| Wartość `color` | Kolor                                            |
|-----------------|--------------------------------------------------|
| `primary`       | `var(--mat-sys-primary)` — fioletowy             |
| `secondary`     | `var(--mat-sys-secondary)` — niebieski           |
| `tertiary`      | `var(--mat-sys-tertiary)`                        |
| `error`         | `var(--mat-sys-error)` — czerwony                |
| `success`       | `var(--toast-success)` — zielony                 |
| `warn`          | `var(--toast-warn)` — pomarańczowy               |
| `neutral`       | `var(--mat-sys-on-surface-variant)` — szary      |

### Przykład — kolumna Environment z ikonami

```typescript
{
  key: 'environment',
  label: 'Environment',
  sortable: true,
  icons: {
    Production:  { name: 'cloud',    color: 'success',   label: 'Production' },
    Staging:     { name: 'science',  color: 'warn',      label: 'Staging' },
    Development: { name: 'computer', color: 'secondary', label: 'Development' },
  },
}
```

### Przykład — ikona bez etykiety (np. flaga)

Gdy `label` jest pominięte, wyświetlana jest tylko ikona. Przydatne do zwartych kolumn typu boolean.

```typescript
{
  key: 'monitored',
  label: 'Mon.',
  width: '60px',
  icons: {
    'true':  { name: 'monitoring',    color: 'success' },
    'false': { name: 'remove_circle', color: 'neutral' },
  },
}
```

### Przykład — niestandardowy kolor CSS

```typescript
{
  key: 'tier',
  label: 'Tier',
  icons: {
    gold:   { name: 'star',         color: '#f59e0b', label: 'Gold' },
    silver: { name: 'star_half',    color: '#9ca3af', label: 'Silver' },
    bronze: { name: 'star_outline', color: '#92400e', label: 'Bronze' },
  },
}
```

---

## Fasolki (badges) — kolorowe etykiety statusów

Fasolka to zaokrąglona etykieta z kolorem tła identyfikującym wartość (np. status, priorytet).

### Predefiniowane kolory

Kolory używają tokenów Material M3 — automatycznie dostosowują się do trybu ciemnego.

| Wartość `color` | Wygląd (jasny motyw)                                   |
|-----------------|--------------------------------------------------------|
| `primary`       | fioletowe tło, ciemny tekst (primary-container)        |
| `secondary`     | niebieskie tło (secondary-container)                   |
| `tertiary`      | trzeciorzędna paleta (tertiary-container)              |
| `error`         | czerwone tło (error-container)                         |
| `success`       | zielone tło (`--toast-success-bg` / `--toast-success`) |
| `warn`          | pomarańczowe tło (`--toast-warn-bg` / `--toast-warn`)  |
| `neutral`       | szare tło (surface-container-highest)                  |

### `BadgeConfig`

```typescript
interface BadgeConfig {
  label?:     string;           // nadpisanie tekstu — domyślnie wartość komórki
  color:      BadgeColor | string; // predefiniowany kolor LUB dowolny kolor CSS
  textColor?: string;           // kolor tekstu (tylko przy niestandardowym color CSS)
}
```

### Przykład — kolumna ze statusami

```typescript
{
  key: 'status',
  label: 'Status',
  sortable: true,
  badges: {
    active:     { color: 'success',   label: 'Aktywny' },
    inactive:   { color: 'neutral',   label: 'Nieaktywny' },
    deprecated: { color: 'error',     label: 'Przestarzały' },
    draft:      { color: 'warn',      label: 'Szkic' },
    beta:       { color: 'secondary', label: 'Beta' },
    internal:   { color: 'primary',   label: 'Wewnętrzny' },
  },
}
```

### Przykład — kolumna Environment

```typescript
{
  key: 'environment',
  label: 'Environment',
  sortable: true,
  badges: {
    Production:  { color: 'success',   label: 'Production' },
    Staging:     { color: 'warn',      label: 'Staging' },
    Development: { color: 'secondary', label: 'Development' },
  },
}
```

### Przykład — niestandardowe kolory CSS

Gdy predefiniowane kolory nie wystarczają, można podać dowolny kolor CSS. Tryb ciemny należy obsłużyć samodzielnie (np. przez CSS custom properties).

```typescript
{
  key: 'tier',
  label: 'Tier',
  badges: {
    gold:     { color: '#b8860b', textColor: '#fff', label: 'Gold' },
    silver:   { color: '#808080', textColor: '#fff', label: 'Silver' },
    bronze:   { color: '#8b4513', textColor: '#fff', label: 'Bronze' },
  },
}
```

---

## Własny renderer komórki (`cellRender`)

Gdy `badges` nie wystarczą — np. komórka ma zawierać ikonę, wielokrotny tekst lub wartość warunkową niezależną od `row[key]` — użyj `cellRender`. Funkcja otrzymuje cały obiekt wiersza i zwraca `CellDisplay`.

```typescript
interface CellDisplay {
  text?:  string;       // zwykły tekst
  badge?: BadgeDisplay; // fasolka
}

interface BadgeDisplay {
  label:       string;
  colorClass?: string;             // 'primary' | 'secondary' | … → klasa CSS dt-badge--*
  style?:      Record<string, string>; // style inline (niestandardowe kolory)
}
```

### Przykład — badge na podstawie wielu pól

```typescript
{
  key: 'status',
  label: 'Status',
  cellRender: (row): CellDisplay => {
    // badge zależy od kombinacji pól
    if (row.status === 'active' && row.isPremium) {
      return { badge: { label: 'Premium', colorClass: 'tertiary' } };
    }
    if (row.status === 'active') {
      return { badge: { label: 'Aktywny', colorClass: 'success' } };
    }
    return { badge: { label: row.status, colorClass: 'neutral' } };
  },
}
```

### Przykład — tekst warunkowy

```typescript
{
  key: 'calls',
  label: 'Ruch',
  cellRender: (row): CellDisplay => ({
    text: row.status === 'draft' ? '—' : row.calls,
  }),
}
```

### Przykład — badge z niestandardowym kolorem inline

```typescript
{
  key: 'environment',
  label: 'Środowisko',
  cellRender: (row): CellDisplay => {
    const map: Record<string, { bg: string; fg: string }> = {
      Production:  { bg: '#1b5e20', fg: '#fff' },
      Staging:     { bg: '#e65100', fg: '#fff' },
      Development: { bg: '#1565c0', fg: '#fff' },
    };
    const c = map[row.environment];
    return c
      ? { badge: { label: row.environment, style: { background: c.bg, color: c.fg } } }
      : { text: row.environment };
  },
}
```

---

## `PaginationConfig`

```typescript
interface PaginationConfig {
  mode:             'frontend' | 'backend';
  pageSize?:        number;
  pageSizeOptions?: number[];
  totalItems?:      number;
}
```

| Pole              | Domyślnie        | Opis |
|-------------------|------------------|------|
| `mode`            | —                | `'frontend'` — tabela sama stronicuje przefiltrowane dane. `'backend'` — komponent tylko emituje `pageChange`, dane dostarcza rodzic. |
| `pageSize`        | `10`             | Początkowa liczba wierszy na stronie. |
| `pageSizeOptions` | `[5, 10, 25, 50]`| Opcje w selektorze rozmiaru strony. |
| `totalItems`      | `0`              | Wymagany w trybie `backend` — łączna liczba wierszy po stronie serwera. |

### Paginacja po stronie frontendu

Tabela samodzielnie filtruje, sortuje i stronicuje tablicę `data`. Nie wymaga żadnej dodatkowej logiki w komponencie-rodzicu.

```typescript
pagination: {
  mode: 'frontend',
  pageSize: 10,
  pageSizeOptions: [5, 10, 25, 50],
}
```

### Paginacja po stronie backendu

Tabela wyświetla dane przekazane przez `[data]` bez własnego stronicowania. Przy każdej zmianie strony lub rozmiaru emituje output `(pageChange)`. Rodzic jest odpowiedzialny za pobranie właściwej strony i zaktualizowanie `data` oraz `totalItems`.

```typescript
// konfiguracja
pagination: {
  mode: 'backend',
  pageSize: 20,
  pageSizeOptions: [10, 20, 50],
  totalItems: this.totalCount(),  // sygnał lub wartość z API
}
```

```html
<app-data-table
  [config]="tableConfig"
  [data]="currentPage()"
  [loading]="isLoading()"
  (pageChange)="onPageChange($event)"
/>
```

```typescript
onPageChange(event: PageEvent): void {
  this.apiService.getUsers(event.pageIndex, event.pageSize).subscribe(res => {
    this.currentPage.set(res.items);
    this.totalCount.set(res.total);
  });
}
```

> Przy trybie `backend` filtr tekstowy nadal działa po stronie frontendu (na danych bieżącej strony). Jeśli potrzebne jest filtrowanie po stronie serwera, ustaw `showFilter: false` i zaimplementuj własne pole wyszukiwania.

---

## Widoczność i kolejność kolumn

Kolumny oznaczone jako `defaultHidden: true` są domyślnie ukryte, ale widoczne w menu (ikona `view_column` w prawym górnym rogu tabeli). Użytkownik może je włączyć — wybór jest zapamiętywany w `localStorage` pod kluczem `dt_<tableId>_hidden`.

Kolumny można przeciągać w nagłówku tabeli (drag-and-drop), by zmieniać ich kolejność. Nowy porządek jest zapisywany pod kluczem `dt_<tableId>_order`.

Aby zresetować preferencje użytkownika dla konkretnej tabeli:

```typescript
localStorage.removeItem('dt_users_hidden');
localStorage.removeItem('dt_users_order');
```

---

## Tryb osadzony (`embedded`)

Gdy tabela umieszczona jest wewnątrz karty (`mat-card`) lub innego kontenera z własną ramką, użyj `[embedded]="true"`. Usuwa to zewnętrzną ramkę i zaokrąglenie `DataTable`, pozostawiając jedynie linię oddzielającą tabelę od nagłówka karty.

```html
<mat-card appearance="outlined">
  <mat-card-header>
    <mat-card-title>Lista użytkowników</mat-card-title>
  </mat-card-header>
  <mat-card-content style="padding: 0 !important">
    <app-data-table [config]="cfg" [data]="rows" [embedded]="true" />
  </mat-card-content>
</mat-card>
```

---

## Stan ładowania

```html
<app-data-table
  [config]="tableConfig"
  [data]="rows()"
  [loading]="isLoading()"
/>
```

Gdy `loading` jest `true`, tabela wyświetla komunikat "Loading…" zamiast wierszy. Nagłówek i stopka pozostają widoczne.

---

## Kompletny przykład — backend pagination

```typescript
// users.ts
interface User {
  id: string;
  fullName: string;
  email: string;
  department: string;
  status: 'active' | 'inactive' | 'suspended';
  lastLogin: string;
}

@Component({
  selector: 'app-users',
  imports: [DataTable],
  templateUrl: './users.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Users {
  private readonly api = inject(UsersApiService);

  readonly rows       = signal<User[]>([]);
  readonly totalCount = signal(0);
  readonly isLoading  = signal(false);

  readonly tableConfig: TableConfig<User> = {
    tableId: 'users-list',
    showFilter: true,
    showCheckboxes: true,
    pagination: {
      mode: 'backend',
      pageSize: 20,
      pageSizeOptions: [10, 20, 50, 100],
      totalItems: this.totalCount(),
    },
    columns: [
      { key: 'id',         label: 'ID',          hidden: true },
      { key: 'fullName',   label: 'Imię i nazwisko', sortable: true },
      { key: 'email',      label: 'E-mail',       sortable: true },
      { key: 'department', label: 'Dział',        sortable: true },
      { key: 'status',     label: 'Status',       sortable: true, width: '110px',
        cellClass: (row) => `status-badge status-${row.status}` },
      { key: 'lastLogin',  label: 'Ostatnie logowanie', sortable: true,
        defaultHidden: true },
    ],
    rowClick: (row) => this.onSelect(row),
    rowDblClick: (row) => this.openDetails(row),
    rowStyle: (row): Record<string, string> => {
      if (row.status === 'suspended') return { opacity: '0.5' };
      if (row.status === 'inactive')  return { color: 'var(--mat-sys-on-surface-variant)' };
      return {};
    },
  };

  constructor() {
    this.loadPage(0, 20);
  }

  onPageChange(event: PageEvent): void {
    this.loadPage(event.pageIndex, event.pageSize);
  }

  onRowSelect(row: User | null): void {
    console.log('Zaznaczono:', row);
  }

  onRowsSelect(rows: User[]): void {
    console.log(`Zaznaczono ${rows.length} wierszy`);
  }

  private loadPage(pageIndex: number, pageSize: number): void {
    this.isLoading.set(true);
    this.api.getUsers(pageIndex, pageSize).subscribe({
      next: res => {
        this.rows.set(res.items);
        this.totalCount.set(res.total);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  private onSelect(row: User): void { /* ... */ }
  private openDetails(row: User): void { /* ... */ }
}
```

```html
<!-- users.html -->
<app-data-table
  [config]="tableConfig"
  [data]="rows()"
  [loading]="isLoading()"
  (rowSelect)="onRowSelect($event)"
  (rowsSelect)="onRowsSelect($event)"
  (pageChange)="onPageChange($event)"
/>
```

---

## Kompletny przykład — frontend pagination

```typescript
readonly tableConfig: TableConfig<RecentApi> = {
  tableId: 'recent-apis',
  showFilter: true,
  showCheckboxes: true,
  pagination: {
    mode: 'frontend',
    pageSize: 5,
    pageSizeOptions: [5, 10, 25],
  },
  columns: [
    { key: 'name',        label: 'API Name',    sortable: true },
    { key: 'version',     label: 'Version',     sortable: true },
    { key: 'environment', label: 'Environment', sortable: true },
    { key: 'status',      label: 'Status',      sortable: true },
    { key: 'calls',       label: 'Traffic' },
  ],
  rowClick:    (row) => this.toast.info('Wybrano', row.name),
  rowDblClick: (row) => this.dialog.info('Szczegóły API', `${row.name} ${row.version}`),
  rowStyle: (row): Record<string, string> => {
    if (row.status === 'deprecated') return { opacity: '0.65' };
    if (row.status === 'draft')      return { fontStyle: 'italic' };
    return {};
  },
};
```

---

---

## Kolumna akcji (`actions`)

Opcjonalna kolumna na końcu tabeli z przyciskiem ⋮ (`more_vert`), który otwiera menu kontekstowe dla danego wiersza. Przycisk jest ukrywany dopóki kursor nie najedzie na wiersz — pojawia się przy hover (i focus).

### `ActionDef<T>`

```typescript
interface ActionDef<T extends object> {
  label:     string;
  icon?:     string;
  color?:    BadgeColor | string;
  disabled?: boolean | ((row: T) => boolean);
  visible?:  boolean | ((row: T) => boolean);
  action:    (row: T) => void;
}
```

| Pole       | Typ                                     | Opis |
|------------|-----------------------------------------|------|
| `label`    | `string`                                | Tekst pozycji menu. |
| `icon`     | `string`                                | Opcjonalna ikona Material Symbols przed etykietą. |
| `color`    | `BadgeColor \| string`                  | Kolor ikony i etykiety — predefiniowany token M3 lub CSS. |
| `disabled` | `boolean \| ((row: T) => boolean)`      | Gdy `true` lub gdy funkcja zwraca `true`, pozycja jest wyszarzona. |
| `visible`  | `boolean \| ((row: T) => boolean)`      | Gdy `false` lub gdy funkcja zwraca `false`, pozycja jest ukryta. |
| `action`   | `(row: T) => void`                      | Funkcja wykonywana po kliknięciu. |

### Konfiguracja w `TableConfig`

```typescript
interface TableConfig<T> {
  // ...
  actions?:      ActionDef<T>[];
  actionsLabel?: string; // nagłówek kolumny akcji — domyślnie pusty
}
```

### Przykład

```typescript
readonly tableConfig: TableConfig<Api> = {
  tableId: 'api-list',
  columns: [ /* ... */ ],
  actionsLabel: '',   // pusty nagłówek (domyślnie)
  actions: [
    {
      label: 'View details',
      icon:  'open_in_new',
      action: (row) => this.router.navigate(['/apis', row.id]),
    },
    {
      label:    'Edit',
      icon:     'edit',
      color:    'primary',
      disabled: (row) => row.status === 'deprecated',
      action:   (row) => this.router.navigate(['/apis', row.id, 'edit']),
    },
    {
      label:   'Deprecate',
      icon:    'warning',
      color:   'warn',
      visible: (row) => row.status === 'active',
      action:  (row) => this.dialog.question(
        'Deprecate API',
        `Mark "${row.name}" as deprecated?`,
        () => this.apiService.deprecate(row.id),
      ),
    },
    {
      label:   'Delete',
      icon:    'delete',
      color:   'error',
      visible: (row) => row.status !== 'active',
      action:  (row) => this.dialog.question(
        'Delete API',
        `Permanently delete "${row.name}"?`,
        () => this.apiService.delete(row.id),
      ),
    },
  ],
};
```

### Widoczność i dostępność akcji

- **`visible`** — pozycja jest całkowicie usunięta z DOM (nie renderowana). Używaj do akcji, które nie mają zastosowania dla danego wiersza (np. "Deprecate" tylko dla aktywnych).
- **`disabled`** — pozycja jest widoczna, ale wyszarzona i nieklikalna. Używaj, gdy akcja jest dostępna kontekstowo, ale chwilowo zablokowana (np. "Edit" dla przestarzałych).

---

## Lokalny storage — klucze

| Klucz                      | Zawartość                                      |
|----------------------------|------------------------------------------------|
| `dt_<tableId>_hidden`      | `string[]` — klucze aktualnie ukrytych kolumn  |
| `dt_<tableId>_order`       | `string[]` — klucze kolumn w kolejności użytkownika |
