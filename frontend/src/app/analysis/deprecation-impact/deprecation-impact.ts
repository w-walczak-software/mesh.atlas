import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule, MatChipListboxChange } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { provideTranslocoScope, TranslocoDirective } from '@jsverse/transloco';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AnalysisService } from '../service/analysis.service';
import { ToastService } from '../../shared/toast/toast.service';
import {
  DeprecatedApiReportItemDto,
  DeprecationImpactResultDto,
  DeprecationRisk,
} from '../model/analysis.model';

interface RiskLevel {
  level: DeprecationRisk | 'ALL';
  count: number;
}

const RISK_ORDER: DeprecationRisk[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'NONE'];

@Component({
  selector: 'app-deprecation-impact',
  imports: [
    TranslocoDirective,
    DatePipe,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatExpansionModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  providers: [provideTranslocoScope('analysis')],
  templateUrl: './deprecation-impact.html',
  styleUrl: './deprecation-impact.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeprecationImpact implements OnInit, OnDestroy {
  private readonly analysisService = inject(AnalysisService);
  private readonly toast           = inject(ToastService);
  private readonly router          = inject(Router);
  private readonly destroy$        = new Subject<void>();

  protected readonly result      = signal<DeprecationImpactResultDto | null>(null);
  protected readonly loading     = signal(false);
  protected readonly activeFilter = signal<DeprecationRisk | 'ALL'>('ALL');

  protected readonly riskLevels = computed<RiskLevel[]>(() => {
    const res = this.result();
    if (!res) return [];
    return RISK_ORDER
      .map(level => ({ level, count: res.riskDistribution[level] ?? 0 }))
      .filter(r => r.count > 0);
  });

  protected readonly filteredApis = computed<DeprecatedApiReportItemDto[]>(() => {
    const res = this.result();
    if (!res) return [];
    const filter = this.activeFilter();
    return filter === 'ALL'
      ? res.deprecatedApis
      : res.deprecatedApis.filter(api => api.risk === filter);
  });

  ngOnInit(): void {
    this.load();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected refresh(): void {
    this.result.set(null);
    this.load();
  }

  protected onFilterChange(event: MatChipListboxChange): void {
    this.activeFilter.set(event.value ?? 'ALL');
  }

  protected riskClass(risk: DeprecationRisk): string {
    return `risk-${risk.toLowerCase()}`;
  }

  protected criticalityClass(name: string | null): string {
    if (!name) return '';
    const u = name.toUpperCase();
    if (u.includes('CRITICAL')) return 'criticality-critical';
    if (u.includes('HIGH'))     return 'criticality-high';
    if (u.includes('MEDIUM'))   return 'criticality-medium';
    return 'criticality-low';
  }

  protected navigateToApi(id: string): void {
    this.router.navigate(['/apis', id, 'edit']);
  }

  protected navigateToSystem(id: string): void {
    this.router.navigate(['/it-systems', id, 'edit']);
  }

  private load(): void {
    this.loading.set(true);
    this.analysisService.getDeprecationImpact().pipe(
      takeUntil(this.destroy$),
    ).subscribe({
      next: res => {
        this.result.set(res);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Nie udało się załadować raportu. Spróbuj ponownie.');
      },
    });
  }
}
