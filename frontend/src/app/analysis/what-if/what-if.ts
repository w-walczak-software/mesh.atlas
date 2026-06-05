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
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { provideTranslocoScope, TranslocoDirective } from '@jsverse/transloco';
import { Subject, switchMap, debounceTime, filter, tap, map, catchError, of } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AnalysisService } from '../service/analysis.service';
import { ItSystemService } from '../../itsystem/service/itsystem.service';
import { ToastService } from '../../shared/toast/toast.service';
import {
  WhatIfAffectedSystemDto,
  WhatIfDataDomainImpactDto,
  WhatIfRecommendationLevel,
  WhatIfRequest,
  WhatIfResultDto,
  WhatIfRisk,
} from '../model/analysis.model';

interface SystemSuggestion {
  id: string;
  code: string;
  name: string;
}

@Component({
  selector: 'app-what-if',
  imports: [
    TranslocoDirective,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatDividerModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  providers: [provideTranslocoScope('analysis')],
  templateUrl: './what-if.html',
  styleUrl: './what-if.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WhatIf implements OnInit, OnDestroy {
  private readonly analysisService = inject(AnalysisService);
  private readonly itSystemService = inject(ItSystemService);
  private readonly toast           = inject(ToastService);
  private readonly router          = inject(Router);
  private readonly destroy$        = new Subject<void>();

  protected readonly searchControl   = new FormControl<string>('', { nonNullable: true });
  protected readonly maxDepthControl = new FormControl<number>(5, {
    nonNullable: true,
    validators: [Validators.min(1), Validators.max(10)],
  });

  protected readonly form = new FormGroup({
    search:   this.searchControl,
    maxDepth: this.maxDepthControl,
  });

  protected readonly selectedId    = signal<string | null>(null);
  protected readonly result        = signal<WhatIfResultDto | null>(null);
  protected readonly loading       = signal(false);
  protected readonly searchLoading = signal(false);
  protected readonly suggestions   = signal<SystemSuggestion[]>([]);

  protected readonly canAnalyze = computed(() => !!this.selectedId() && !this.loading());

  protected readonly systemsByDepth = computed(() => {
    const r = this.result();
    if (!r) return new Map<number, WhatIfAffectedSystemDto[]>();
    return groupByDepth(r.affectedSystems);
  });

  protected readonly sortedDepths = computed(() =>
    [...this.systemsByDepth().keys()].sort((a, b) => a - b),
  );

  protected readonly orphanedDomains = computed(() =>
    this.result()?.affectedDataDomains.filter(d => d.orphaned) ?? [],
  );

  protected readonly coveredDomains = computed(() =>
    this.result()?.affectedDataDomains.filter(d => !d.orphaned) ?? [],
  );

  ngOnInit(): void {
    this.searchControl.valueChanges.pipe(
      takeUntil(this.destroy$),
      tap(() => this.selectedId.set(null)),
      debounceTime(300),
      filter((v): v is string => typeof v === 'string' && v.trim().length >= 2),
      tap(() => this.searchLoading.set(true)),
      switchMap(query =>
        this.itSystemService.findAll({ query, size: 10, active: true }).pipe(
          map(page => page.content.map(s => ({ id: s.id, code: s.code, name: s.name }))),
          catchError(() => { this.searchLoading.set(false); return of<SystemSuggestion[]>([]); }),
        )
      ),
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

  protected onOptionSelected(event: MatAutocompleteSelectedEvent): void {
    const item = event.option.value as SystemSuggestion;
    this.selectedId.set(item.id);
    this.searchControl.setValue(`${item.code} – ${item.name}`, { emitEvent: false });
    this.suggestions.set([]);
  }

  protected analyze(): void {
    const id = this.selectedId();
    if (!id || this.maxDepthControl.invalid) return;

    const request: WhatIfRequest = {
      scenarioType: 'SYSTEM_SHUTDOWN',
      systemId: id,
      maxDepth: this.maxDepthControl.value,
    };

    this.loading.set(true);
    this.result.set(null);

    this.analysisService.analyzeWhatIf(request).pipe(
      takeUntil(this.destroy$),
    ).subscribe({
      next: res => {
        this.result.set(res);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Wystąpił błąd podczas symulacji. Spróbuj ponownie.');
      },
    });
  }

  protected clear(): void {
    this.selectedId.set(null);
    this.result.set(null);
    this.suggestions.set([]);
    this.form.reset({ search: '', maxDepth: 5 });
  }

  protected riskClass(risk: WhatIfRisk): string {
    return `risk-${risk.toLowerCase()}`;
  }

  protected recommendationIcon(level: WhatIfRecommendationLevel): string {
    switch (level) {
      case 'CRITICAL': return 'error';
      case 'WARNING':  return 'warning_amber';
      default:         return 'info';
    }
  }

  protected domainSummary(domain: WhatIfDataDomainImpactDto): string {
    return domain.affectedApiNames.join(', ');
  }

  protected systemConsumedApis(system: WhatIfAffectedSystemDto): string {
    return system.consumedAffectedApiNames.join(', ');
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
