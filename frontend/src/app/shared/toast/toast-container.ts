import { ChangeDetectionStrategy, Component, ViewEncapsulation, inject } from '@angular/core';
import { animate, style, transition, trigger } from '@angular/animations';
import { ToastItem } from './toast-item';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toast-container',
  imports: [ToastItem],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  animations: [
    trigger('toast', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(calc(100% + 24px))' }),
        animate('280ms cubic-bezier(0.4, 0, 0.2, 1)',
          style({ opacity: 1, transform: 'translateX(0)' })),
      ]),
      transition(':leave', [
        animate('200ms cubic-bezier(0.4, 0, 0.2, 1)',
          style({ opacity: 0, transform: 'translateX(calc(100% + 24px))' })),
      ]),
    ]),
  ],
  template: `
    <div class="toast-container" role="region" aria-live="polite" aria-label="Powiadomienia">
      @for (t of toasts(); track t.id) {
        <app-toast-item @toast [toast]="t" (dismiss)="remove(t.id)" />
      }
    </div>
  `,
})
export class ToastContainer {
  private readonly svc = inject(ToastService);
  protected readonly toasts = this.svc.toasts;

  protected remove(id: string): void {
    this.svc.remove(id);
  }
}
