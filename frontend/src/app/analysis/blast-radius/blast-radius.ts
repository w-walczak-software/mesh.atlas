import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { provideTranslocoScope, TranslocoDirective } from '@jsverse/transloco';
import { toSignal } from '@angular/core/rxjs-interop';
import { Subject, switchMap, debounceTime, filter, tap, map, catchError, of } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AnalysisService } from '../service/analysis.service';
import { ItSystemService } from '../../itsystem/service/itsystem.service';
import { ApiService } from '../../api/service/api.service';
import { ToastService } from '../../shared/toast/toast.service';
import {
  BlastRadiusImpactedApiDto,
  BlastRadiusImpactedSystemDto,
  BlastRadiusRequest,
  BlastRadiusResultDto,
  BlastSeverity,
} from '../model/analysis.model';

interface SearchSuggestion {
  id: string;
  code: string;
  name: string;
}

@Component({
  selector: 'app-blast-radius',
  imports: [
    TranslocoDirective,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatRadioModule,
    MatTooltipModule,
    MatAutocompleteModule,
  ],
  providers: [provideTranslocoScope('analysis')],
  templateUrl: './blast-radius.html',
  styleUrl: './blast-radius.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlastRadius implements OnInit, OnDestroy {
  private readonly analysisService = inject(AnalysisService);
  private readonly itSystemService = inject(ItSystemService);
  private readonly apiService      = inject(ApiService);
  private readonly toast           = inject(ToastService);
  private readonly router          = inject(Router);
  private readonly destroy$        = new Subject<void>();

  protected readonly searchControl    = new FormControl<string>('', { nonNullable: true });
  protected readonly maxDepthControl  = new FormControl<number>(5, {
    nonNullable: true,
    validators: [Validators.min(1), Validators.max(10)],
  });
  protected readonly sourceTypeControl = new FormControl<'SYSTEM' | 'API'>('SYSTEM', { nonNullable: true });

  protected readonly form = new FormGroup({
    sourceType: this.sourceTypeControl,
    search:     this.searchControl,
    maxDepth:   this.maxDepthControl,
  });

  protected readonly selectedId      = signal<string | null>(null);
  protected readonly result          = signal<BlastRadiusResultDto | null>(null);
  protected readonly loading         = signal(false);
  protected readonly searchLoading   = signal(false);
  protected readonly suggestions     = signal<SearchSuggestion[]>([]);

  protected readonly sourceType = toSignal(
    this.sourceTypeControl.valueChanges,
    { initialValue: this.sourceTypeControl.value },
  );

  protected readonly systemsByDepth = computed(() => {
    const r = this.result();
    if (!r) return new Map<number, BlastRadiusImpactedSystemDto[]>();
    return groupByDepth(r.impactedSystems);
  });

  protected readonly apisByDepth = computed(() => {
    const r = this.result();
    if (!r) return new Map<number, BlastRadiusImpactedApiDto[]>();
    return groupByDepth(r.impactedApis);
  });

  protected readonly sortedSystemDepths = computed(() =>
    [...this.systemsByDepth().keys()].sort((a, b) => a - b),
  );

  protected readonly sortedApiDepths = computed(() =>
    [...this.apisByDepth().keys()].sort((a, b) => a - b),
  );

  protected readonly canAnalyze = computed(() => !!this.selectedId() && !this.loading());

  ngOnInit(): void {
    this.sourceTypeControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.selectedId.set(null);
      this.suggestions.set([]);
      this.result.set(null);
      this.searchControl.setValue('', { emitEvent: false });
    });

    this.searchControl.valueChanges.pipe(
      takeUntil(this.destroy$),
      tap(() => this.selectedId.set(null)),
      debounceTime(300),
      // Angular Material autocomplete emits the option's [value] object (SearchSuggestion)
      // via _onChange before our onOptionSelected handler fires. We must guard against it
      // here — calling .trim() on an object would throw and permanently kill the subscription.
      filter((v): v is string => typeof v === 'string' && v.trim().length >= 2),
      tap(() => this.searchLoading.set(true)),
      switchMap(query => this.searchFor(this.sourceTypeControl.value, query).pipe(
        catchError(() => { this.searchLoading.set(false); return of<SearchSuggestion[]>([]); }),
      )),
    ).subscribe({
      next: items => {
        this.suggestions.set(items);
        this.searchLoading.set(false);
      },
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private searchFor(sourceType: 'SYSTEM' | 'API', query: string) {
    if (sourceType === 'SYSTEM') {
      return this.itSystemService.findAll({ query, size: 10, active: true }).pipe(
        map(page => page.content.map(s => ({ id: s.id, code: s.code, name: s.name }))),
      );
    }
    return this.apiService.findAll({ query, size: 10, active: true }).pipe(
      map(page => page.content.map(a => ({ id: a.id, code: a.code, name: a.name }))),
    );
  }

  protected onOptionSelected(event: MatAutocompleteSelectedEvent): void {
    const item = event.option.value as SearchSuggestion;
    this.selectedId.set(item.id);
    this.searchControl.setValue(`${item.code} – ${item.name}`, { emitEvent: false });
    this.suggestions.set([]);
  }

  protected analyze(): void {
    const id = this.selectedId();
    if (!id || this.maxDepthControl.invalid) return;

    const request: BlastRadiusRequest = {
      maxDepth: this.maxDepthControl.value,
      ...(this.sourceTypeControl.value === 'SYSTEM' ? { systemId: id } : { apiId: id }),
    };

    this.loading.set(true);
    this.result.set(null);

    this.analysisService.analyzeBlastRadius(request).pipe(
      takeUntil(this.destroy$),
    ).subscribe({
      next: res => {
        this.result.set(res);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Wystąpił błąd podczas analizy. Spróbuj ponownie.');
      },
    });
  }

  protected clear(): void {
    this.selectedId.set(null);
    this.result.set(null);
    this.suggestions.set([]);
    this.form.reset({ sourceType: 'SYSTEM', search: '', maxDepth: 5 });
  }

  protected severityClass(s: BlastSeverity): string {
    return `severity-${s.toLowerCase()}`;
  }

  protected navigateTo(type: 'system' | 'api', id: string): void {
    if (type === 'system') {
      this.router.navigate(['/it-systems', id, 'edit']);
    } else {
      this.router.navigate(['/apis', id, 'edit']);
    }
  }
}

function groupByDepth<T extends { depth: number }>(items: T[]): Map<number, T[]> {
  const map = new Map<number, T[]>();
  for (const item of items) {
    const arr = map.get(item.depth) ?? [];
    arr.push(item);
    map.set(item.depth, arr);
  }
  return map;
}
