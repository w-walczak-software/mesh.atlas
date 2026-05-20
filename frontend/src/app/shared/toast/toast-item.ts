import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, inject, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import type { Toast } from './toast.service';
import { ToastService } from './toast.service';

const ICONS: Record<Toast['type'], string> = {
  message: 'notifications',
  success: 'check_circle',
  info:    'info',
  warn:    'warning',
  error:   'error',
};

@Component({
  selector: 'app-toast-item',
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="ti ti--{{ toast().type }}">
      <div class="ti-icon" aria-hidden="true">
        <mat-icon>{{ icon() }}</mat-icon>
      </div>
      <div class="ti-body">
        <span class="ti-title">{{ toast().title }}</span>
        @if (toast().message) {
          <p class="ti-message">{{ toast().message }}</p>
        }
      </div>
      <button type="button" class="ti-close" (click)="onDismiss()" aria-label="Zamknij powiadomienie">
        <mat-icon>close</mat-icon>
      </button>
      <div class="ti-progress" [style.animation-duration.ms]="toast().duration" aria-hidden="true"></div>
    </div>
  `,
})
export class ToastItem {
  readonly toast = input.required<Toast>();
  readonly dismiss = output<void>();

  private readonly toastService = inject(ToastService);

  protected readonly icon = computed(() => ICONS[this.toast().type]);

  protected onDismiss(): void {
    this.dismiss.emit();
  }
}
