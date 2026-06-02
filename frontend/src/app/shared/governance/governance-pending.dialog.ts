import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoDirective, TranslocoService, provideTranslocoScope } from '@jsverse/transloco';
import { toSignal } from '@angular/core/rxjs-interop';

export interface GovernancePendingDialogData {
  count: number;
}

@Component({
  selector: 'app-governance-pending-dialog',
  imports: [MatDialogModule, MatButtonModule, MatIconModule, TranslocoDirective],
  providers: [provideTranslocoScope('api')],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-container *transloco="let t; scope: 'api'; lang: lang()">
      <div class="dlg-header">
        <mat-icon class="dlg-icon" aria-hidden="true">pending_actions</mat-icon>
        <h2 mat-dialog-title>{{ t('api.governance.pendingTitle') }}</h2>
      </div>
      <mat-dialog-content>
        <p>{{ t('api.governance.pendingMessage', { count: data.count }) }}</p>
      </mat-dialog-content>
      <mat-dialog-actions align="end" class="dlg-actions">
        <button mat-button type="button" (click)="close()">{{ t('api.governance.pendingLater') }}</button>
        <button mat-flat-button type="button" (click)="goToQueue()">{{ t('api.governance.pendingGoTo') }}</button>
      </mat-dialog-actions>
    </ng-container>
  `,
  styles: [`
    .dlg-header { display: flex; align-items: center; gap: 12px; padding: 20px 24px 0; }
    .dlg-icon { font-size: 32px; width: 32px; height: 32px; color: var(--mat-sys-primary); }
    .dlg-actions { padding: 8px 24px 16px; }
  `],
})
export class GovernancePendingDialog {
  protected readonly data = inject<GovernancePendingDialogData>(MAT_DIALOG_DATA);
  private readonly ref = inject(MatDialogRef<GovernancePendingDialog>);
  private readonly t = inject(TranslocoService);
  protected readonly lang = toSignal(this.t.langChanges$, { initialValue: this.t.getActiveLang() });

  protected goToQueue(): void {
    this.ref.close('navigate');
  }

  protected close(): void {
    this.ref.close();
  }
}
