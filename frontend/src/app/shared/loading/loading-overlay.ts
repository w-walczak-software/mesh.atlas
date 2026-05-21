import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { of, switchMap, timer } from 'rxjs';
import { map } from 'rxjs/operators';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { LoadingService } from './loading.service';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';

@Component({
  selector: 'app-loading-overlay',
  imports: [MatProgressSpinner, TranslocoDirective],
  template: `
    @if (visible()) {
      <ng-container *transloco="let t; lang: lang()">
        <div class="overlay" role="status" [attr.aria-label]="t('common.loading')">
          <div class="card">
            <div class="brand">
              <span class="material-symbols-outlined brand-icon">hub</span>
              <span class="brand-name">Mesh Atlas</span>
            </div>
            <mat-progress-spinner mode="indeterminate" [diameter]="52" />
            <span class="label">{{ t('common.loading') }}</span>
          </div>
        </div>
      </ng-container>
    }
  `,
  styles: [
    `
      .overlay {
        position: fixed;
        inset: 0;
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.45);
        backdrop-filter: blur(4px) saturate(0.75);
      }

      .card {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 20px;
        padding: 36px 48px;
        background: var(--mat-sys-surface-container-high);
        color: var(--mat-sys-on-surface);
        border-radius: 20px;
        box-shadow:
          0 8px 24px rgba(0, 0, 0, 0.18),
          0 2px 6px rgba(0, 0, 0, 0.1);
        min-width: 220px;
      }

      .brand {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .brand-icon {
        font-size: 28px;
        line-height: 1;
        color: var(--mat-sys-primary);
      }

      .brand-name {
        font-size: 18px;
        font-weight: 600;
        letter-spacing: -0.01em;
      }

      .brand-dot {
        color: var(--mat-sys-primary);
      }

      .label {
        font-size: 13px;
        color: var(--mat-sys-on-surface-variant);
        letter-spacing: 0.015em;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingOverlay {
  private readonly loading = inject(LoadingService);
  private readonly t = inject(TranslocoService);

  protected readonly lang = toSignal(this.t.langChanges$, { initialValue: this.t.getActiveLang() });

  readonly visible = toSignal(
    toObservable(this.loading.isLoading).pipe(
      switchMap((active) => (active ? timer(500).pipe(map(() => true)) : of(false))),
    ),
    { initialValue: false },
  );
}
