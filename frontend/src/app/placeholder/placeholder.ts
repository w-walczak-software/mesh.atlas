import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-placeholder',
  imports: [MatIconModule],
  template: `
    <div class="placeholder-page">
      <mat-icon class="placeholder-icon">construction</mat-icon>
      <h2 class="placeholder-title">{{ title() }}</h2>
      <p class="placeholder-text">This section is under construction.</p>
    </div>
  `,
  styles: [`
    .placeholder-page {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 60vh;
      gap: 16px;
      color: var(--mat-sys-on-surface-variant);
    }
    .placeholder-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      opacity: 0.4;
    }
    .placeholder-title {
      font-size: 20px;
      font-weight: 600;
      margin: 0;
      color: var(--mat-sys-on-surface);
    }
    .placeholder-text {
      font-size: 14px;
      margin: 0;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Placeholder {
  private readonly route = inject(ActivatedRoute);
  readonly title = toSignal(
    this.route.data.pipe(map(d => (d['title'] as string) ?? 'Page')),
    { initialValue: 'Page' }
  );
}
