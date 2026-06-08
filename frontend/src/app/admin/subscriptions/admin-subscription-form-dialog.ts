import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoDirective, TranslocoService, provideTranslocoScope } from '@jsverse/transloco';
import { toSignal } from '@angular/core/rxjs-interop';
import { ToastService } from '@shared/toast/toast.service';
import { ApiSubscriptionDto } from '../../subscription/model/subscription.model';
import { SubscriptionService } from '../../subscription/service/subscription.service';

export interface AdminSubscriptionFormDialogData {
  subscription: ApiSubscriptionDto | null;
}

@Component({
  selector: 'app-admin-subscription-form-dialog',
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatIconModule,
    ReactiveFormsModule,
    TranslocoDirective,
  ],
  providers: [provideTranslocoScope('admin')],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-container *transloco="let t; scope: 'admin'; lang: lang()">
      <div class="dlg-header">
        <div class="dlg-icon"><mat-icon>manage_accounts</mat-icon></div>
        <h2 mat-dialog-title>
          {{ sub ? t('admin.subscription.dialog.editTitle') : t('admin.subscription.dialog.addTitle') }}
        </h2>
      </div>

      <mat-dialog-content>
        <form [formGroup]="form" class="sub-form">
          @if (!sub) {
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>{{ t('admin.subscription.field.apiId') }}</mat-label>
              <input matInput formControlName="apiId" placeholder="UUID API" />
              <mat-error>{{ t('admin.subscription.validation.apiIdRequired') }}</mat-error>
            </mat-form-field>
          }

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>{{ t('admin.subscription.field.subscriberEmail') }}</mat-label>
            <input matInput formControlName="subscriberEmail" type="email" />
            <mat-error>{{ t('admin.subscription.validation.emailRequired') }}</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>{{ t('admin.subscription.field.subscriberName') }}</mat-label>
            <input matInput formControlName="subscriberName" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>{{ t('admin.subscription.field.subscriberType') }}</mat-label>
            <mat-select formControlName="subscriberType">
              <mat-option value="INTERNAL">{{ t('admin.subscription.type.internal') }}</mat-option>
              <mat-option value="EXTERNAL">{{ t('admin.subscription.type.external') }}</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>{{ t('admin.subscription.field.status') }}</mat-label>
            <mat-select formControlName="status">
              <mat-option value="ACTIVE">{{ t('admin.subscription.status.active') }}</mat-option>
              <mat-option value="INACTIVE">{{ t('admin.subscription.status.inactive') }}</mat-option>
              <mat-option value="PENDING_CONFIRMATION">{{ t('admin.subscription.status.pendingConfirmation') }}</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>{{ t('admin.subscription.field.source') }}</mat-label>
            <mat-select formControlName="source">
              <mat-option value="INTERNAL_PORTAL">{{ t('admin.subscription.source.internalPortal') }}</mat-option>
              <mat-option value="DEVELOPER_PORTAL">{{ t('admin.subscription.source.developerPortal') }}</mat-option>
            </mat-select>
          </mat-form-field>

          <div class="toggle-row">
            <mat-slide-toggle formControlName="notificationsEnabled" color="primary">
              {{ t('admin.subscription.field.notificationsEnabled') }}
            </mat-slide-toggle>
          </div>
        </form>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-stroked-button mat-dialog-close>{{ t('admin.subscription.action.cancel') }}</button>
        <button mat-flat-button color="primary" [disabled]="saving()" (click)="onSave()">
          {{ saving() ? t('admin.subscription.action.saving') : t('admin.subscription.action.save') }}
        </button>
      </mat-dialog-actions>
    </ng-container>
  `,
  styles: [`
    .dlg-header { display: flex; align-items: center; gap: 12px; padding: 20px 24px 0; }
    .dlg-header mat-icon { font-size: 32px; width: 32px; height: 32px; color: var(--mat-primary-500); }
    .sub-form { display: flex; flex-direction: column; gap: 8px; padding-top: 16px; }
    .full-width { width: 100%; }
    .toggle-row { padding: 8px 0; }
  `],
})
export class AdminSubscriptionFormDialog implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<AdminSubscriptionFormDialog>);
  private readonly data = inject<AdminSubscriptionFormDialogData>(MAT_DIALOG_DATA);
  private readonly service = inject(SubscriptionService);
  private readonly toast = inject(ToastService);
  private readonly t = inject(TranslocoService);
  private readonly fb = inject(FormBuilder);

  protected readonly lang = toSignal(this.t.langChanges$, { initialValue: this.t.getActiveLang() });
  protected readonly saving = signal(false);
  protected readonly sub = this.data.subscription;

  protected readonly form = this.fb.group({
    apiId:              [this.sub?.apiId ?? '', [Validators.required]],
    subscriberEmail:    [this.sub?.subscriberEmail ?? '', [Validators.required, Validators.email]],
    subscriberName:     [this.sub?.subscriberName ?? ''],
    subscriberUserId:   [this.sub?.subscriberUserId ?? ''],
    subscriberType:     [this.sub?.subscriberType ?? 'INTERNAL', [Validators.required]],
    status:             [this.sub?.status ?? 'ACTIVE', [Validators.required]],
    source:             [this.sub?.source ?? 'INTERNAL_PORTAL', [Validators.required]],
    notificationsEnabled: [this.sub?.notificationsEnabled ?? true],
  });

  ngOnInit(): void {
    if (this.sub) {
      this.form.get('apiId')?.disable();
    }
  }

  protected onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    const v = this.form.getRawValue();
    const req = {
      apiId:              v.apiId!,
      subscriberType:     v.subscriberType as any,
      subscriberUserId:   v.subscriberUserId || null,
      subscriberEmail:    v.subscriberEmail!,
      subscriberName:     v.subscriberName || null,
      status:             v.status as any,
      source:             v.source as any,
      notificationsEnabled: v.notificationsEnabled ?? true,
    };

    const op$ = this.sub
      ? this.service.adminUpdate(this.sub.id, req)
      : this.service.adminCreate(req);

    op$.subscribe({
      next: () => {
        this.toast.success(this.t.translate('admin.subscription.toast.saved'));
        this.dialogRef.close(true);
      },
      error: () => {
        this.saving.set(false);
        this.toast.error(this.t.translate('admin.subscription.toast.error'));
      },
    });
  }
}
