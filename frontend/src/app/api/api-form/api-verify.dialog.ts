import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoDirective, TranslocoService, provideTranslocoScope } from '@jsverse/transloco';
import { toSignal } from '@angular/core/rxjs-interop';
import { ApiService } from '../service/api.service';
import { ToastService } from '@shared/toast/toast.service';

export interface ApiVerifyDialogData {
  apiId: string;
  action: 'approve' | 'reject';
}

@Component({
  selector: 'app-api-verify-dialog',
  imports: [
    MatDialogModule, MatButtonModule, MatFormFieldModule,
    MatInputModule, MatIconModule, ReactiveFormsModule, TranslocoDirective,
  ],
  providers: [provideTranslocoScope('api')],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-container *transloco="let t; scope: 'api'; lang: lang()">
      <div class="dlg-header">
        <div class="dlg-icon" [class.dlg-icon--approve]="data.action === 'approve'" aria-hidden="true">
          <mat-icon>{{ data.action === 'approve' ? 'check_circle' : 'cancel' }}</mat-icon>
        </div>
        <h2 mat-dialog-title>
          {{ data.action === 'approve' ? t('api.governance.approveTitle') : t('api.governance.rejectTitle') }}
        </h2>
      </div>

      <mat-dialog-content>
        <p class="dlg-hint">{{ data.action === 'approve' ? t('api.governance.approveHint') : t('api.governance.rejectHint') }}</p>
        <form [formGroup]="form">
          <mat-form-field appearance="outline" class="dlg-field">
            <mat-label>{{ t('api.governance.note') }}</mat-label>
            <textarea matInput formControlName="note" rows="4"
                      [attr.aria-required]="data.action === 'reject'"></textarea>
            @if (form.controls.note.errors?.['required']) {
              <mat-error>{{ t('common.validation.required') }}</mat-error>
            }
          </mat-form-field>
        </form>
      </mat-dialog-content>

      <mat-dialog-actions align="end" class="dlg-actions">
        <button mat-button type="button" (click)="cancel()">{{ t('api.action.cancel') }}</button>
        <button mat-flat-button type="button"
                [color]="data.action === 'approve' ? 'primary' : 'warn'"
                [disabled]="form.invalid || saving()"
                (click)="confirm()">
          {{ data.action === 'approve' ? t('api.governance.approve') : t('api.governance.reject') }}
        </button>
      </mat-dialog-actions>
    </ng-container>
  `,
  styles: [`
    .dlg-header { display: flex; align-items: center; gap: 12px; padding: 20px 24px 0; }
    .dlg-icon {
      display: flex; align-items: center; justify-content: center;
      width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0;
      background: var(--mat-sys-secondary-container);
      color: var(--mat-sys-on-secondary-container);
    }
    .dlg-icon--approve { background: var(--mat-sys-primary-container); color: var(--mat-sys-on-primary-container); }
    .dlg-hint { margin: 8px 0 12px; opacity: 0.7; font-size: 0.875rem; }
    .dlg-field { width: 100%; }
    .dlg-actions { padding: 8px 24px 16px; }
  `],
})
export class ApiVerifyDialog {
  protected readonly data = inject<ApiVerifyDialogData>(MAT_DIALOG_DATA);
  private readonly ref = inject(MatDialogRef<ApiVerifyDialog>);
  private readonly service = inject(ApiService);
  private readonly toast = inject(ToastService);
  private readonly t = inject(TranslocoService);
  private readonly fb = inject(FormBuilder);

  protected readonly lang = toSignal(this.t.langChanges$, { initialValue: this.t.getActiveLang() });
  protected readonly saving = signal(false);

  protected readonly form = this.fb.group({
    note: ['', this.data.action === 'reject' ? [Validators.required, Validators.maxLength(2000)] : [Validators.maxLength(2000)]],
  });

  protected confirm(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    const note = this.form.controls.note.value || null;
    const obs = this.data.action === 'approve'
      ? this.service.approve(this.data.apiId, { note })
      : this.service.reject(this.data.apiId, { note });

    obs.subscribe({
      next: () => {
        this.saving.set(false);
        this.ref.close(true);
      },
      error: () => {
        this.saving.set(false);
        this.toast.error(this.t.translate('common.error.unexpected'));
      },
    });
  }

  protected cancel(): void {
    this.ref.close(false);
  }
}
