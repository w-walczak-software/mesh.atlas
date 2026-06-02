import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  OnInit,
  output,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  ControlValueAccessor,
  FormControl,
  NgControl,
  ReactiveFormsModule,
} from '@angular/forms';
import {
  MatAutocompleteModule,
  MatAutocompleteSelectedEvent,
} from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import {
  debounceTime,
  distinctUntilChanged,
  forkJoin,
  map,
  Observable,
  of,
  switchMap,
} from 'rxjs';
import { ItSystemDto, ItSystemSummaryDto } from '../../itsystem/model/itsystem.model';
import { ItSystemService } from '../../itsystem/service/itsystem.service';

@Component({
  selector: 'app-it-system-select',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatChipsModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './it-system-select.html',
  styleUrl: './it-system-select.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'app-it-system-select' },
})
export class ItSystemSelectComponent implements ControlValueAccessor, OnInit {
  readonly multiple = input(false);
  readonly label = input('');
  readonly required = input(false);
  readonly excludeIds = input<string[]>([]);
  /** When provided, the dropdown is restricted to this fixed list (no backend search). */
  readonly allowedSystems = input<ItSystemSummaryDto[] | null>(null);

  readonly systemChange = output<ItSystemSummaryDto | ItSystemSummaryDto[] | null>();

  private readonly itSystemService = inject(ItSystemService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly ngControl = inject(NgControl, { self: true, optional: true });

  protected readonly searchCtrl = new FormControl<ItSystemSummaryDto | string | null>(null);
  protected readonly options = signal<ItSystemSummaryDto[]>([]);
  protected readonly selectedSingle = signal<ItSystemSummaryDto | null>(null);
  protected readonly selectedMultiple = signal<ItSystemSummaryDto[]>([]);

  private onChangeFn: (v: string | string[] | null) => void = () => {};
  private onTouchedFn: () => void = () => {};

  constructor() {
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }

    // Re-fetch options whenever the allowed list changes
    effect(() => {
      this.allowedSystems(); // track
      untracked(() => this.fetchOptions(''));
    }, { allowSignalWrites: true });

    effect(() => {
      const excluded = this.excludeIds();
      if (this.multiple()) {
        const current = untracked(() => this.selectedMultiple());
        const filtered = current.filter(s => !excluded.includes(s.id));
        if (filtered.length !== current.length) {
          this.selectedMultiple.set(filtered);
          this.notifyChange();
        }
      } else {
        const current = untracked(() => this.selectedSingle());
        if (current && excluded.includes(current.id)) {
          this.selectedSingle.set(null);
          this.searchCtrl.setValue(null, { emitEvent: false });
          this.notifyChange();
        }
      }
      untracked(() => this.fetchOptions(''));
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    this.fetchOptions('');

    // Debounced search triggered by user typing
    this.searchCtrl.valueChanges.pipe(
      debounceTime(250),
      distinctUntilChanged(),
      switchMap(v => {
        if (v && typeof v === 'object') return of(null); // just selected — skip
        const query = typeof v === 'string' ? v.trim() : '';
        const allowed = this.allowedSystems();
        if (allowed !== null) {
          // Restricted mode: filter the fixed list locally
          return of({ content: this.filterAllowed(allowed, query) });
        }
        return this.itSystemService.findAll({ active: true, query: query || undefined, size: 20, sort: 'name' });
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(page => {
      if (!page) return;
      const excluded = this.excludeIds();
      const selectedIds = this.selectedMultiple().map(s => s.id);
      this.options.set(page.content.filter(s => !excluded.includes(s.id) && !selectedIds.includes(s.id)));
    });

    // Detect typing in single mode to clear the current selection
    this.searchCtrl.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(v => {
      if (!this.multiple() && typeof v === 'string' && this.selectedSingle() !== null) {
        this.selectedSingle.set(null);
        this.onChangeFn(null);
        this.systemChange.emit(null);
      }
    });
  }

  writeValue(value: string | string[] | null): void {
    if (Array.isArray(value)) {
      if (!value.length) {
        this.selectedMultiple.set([]);
        return;
      }
      forkJoin(value.map(id => this.resolveById(id))).pipe(
        takeUntilDestroyed(this.destroyRef),
      ).subscribe(systems => {
        this.selectedMultiple.set(systems);
        this.systemChange.emit(systems);
      });
    } else if (value) {
      if (this.selectedSingle()?.id === value) return;
      this.resolveById(value).pipe(
        takeUntilDestroyed(this.destroyRef),
      ).subscribe(sys => {
        this.selectedSingle.set(sys);
        this.searchCtrl.setValue(sys, { emitEvent: false });
        this.systemChange.emit(sys);
      });
    } else {
      this.selectedSingle.set(null);
      this.selectedMultiple.set([]);
      this.searchCtrl.setValue(null, { emitEvent: false });
    }
  }

  registerOnChange(fn: (v: string | string[] | null) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    isDisabled ? this.searchCtrl.disable() : this.searchCtrl.enable();
  }

  protected displayFn(value: ItSystemSummaryDto | string | null): string {
    if (!value) return '';
    if (typeof value === 'string') return value;
    return `${value.code} – ${value.name}`;
  }

  protected onSingleSelected(event: MatAutocompleteSelectedEvent): void {
    const sys = event.option.value as ItSystemSummaryDto;
    this.selectedSingle.set(sys);
    this.onChangeFn(sys.id);
    this.systemChange.emit(sys);
    this.onTouchedFn();
  }

  protected onMultiSelected(event: MatAutocompleteSelectedEvent): void {
    const sys = event.option.value as ItSystemSummaryDto;
    this.selectedMultiple.update(list => [...list, sys]);
    this.searchCtrl.setValue(null, { emitEvent: false });
    this.notifyChange();
    this.onTouchedFn();
    this.fetchOptions('');
  }

  protected clearSingle(): void {
    this.selectedSingle.set(null);
    this.searchCtrl.setValue(null, { emitEvent: false });
    this.onChangeFn(null);
    this.systemChange.emit(null);
    this.onTouchedFn();
  }

  protected removeMultiple(sys: ItSystemSummaryDto): void {
    this.selectedMultiple.update(list => list.filter(s => s.id !== sys.id));
    this.notifyChange();
    this.onTouchedFn();
  }

  protected touch(): void {
    this.onTouchedFn();
  }

  private notifyChange(): void {
    if (this.multiple()) {
      const ids = this.selectedMultiple().map(s => s.id);
      this.onChangeFn(ids);
      this.systemChange.emit(this.selectedMultiple());
    } else {
      const sys = this.selectedSingle();
      this.onChangeFn(sys?.id ?? null);
      this.systemChange.emit(sys);
    }
  }

  private resolveById(id: string): Observable<ItSystemSummaryDto> {
    const cached = this.options().find(s => s.id === id)
      ?? this.selectedMultiple().find(s => s.id === id);
    if (cached) return of(cached);
    return this.itSystemService.findById(id).pipe(map(s => this.toSummary(s)));
  }

  private toSummary(s: ItSystemDto): ItSystemSummaryDto {
    return {
      id: s.id, code: s.code, name: s.name, icon: s.icon,
      status: s.status, lifecycleStage: s.lifecycleStage,
      businessCriticality: s.businessCriticality, systemType: s.systemType,
      active: s.active, canEdit: false,
    };
  }

  private fetchOptions(query: string): void {
    const excluded = this.excludeIds();
    const selectedIds = this.selectedMultiple().map(s => s.id);
    const allowed = this.allowedSystems();

    if (allowed !== null) {
      const filtered = this.filterAllowed(allowed, query)
        .filter(s => !excluded.includes(s.id) && !selectedIds.includes(s.id));
      this.options.set(filtered);
      return;
    }

    this.itSystemService.findAll({ active: true, query: query || undefined, size: 20, sort: 'name' }).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(page => {
      this.options.set(page.content.filter(s => !excluded.includes(s.id) && !selectedIds.includes(s.id)));
    });
  }

  private filterAllowed(systems: ItSystemSummaryDto[], query: string): ItSystemSummaryDto[] {
    if (!query) return systems;
    const q = query.toLowerCase();
    return systems.filter(s =>
      s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q)
    );
  }
}
