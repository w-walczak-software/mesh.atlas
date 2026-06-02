import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoDirective, TranslocoService, provideTranslocoScope } from '@jsverse/transloco';
import { toSignal } from '@angular/core/rxjs-interop';
import { ToastService } from '@shared/toast/toast.service';
import { SystemParameterDto, SystemParameterUpdateRequest } from '../model/admin.model';
import { SystemParameterService } from './system-parameter.service';

export interface SystemParameterEditDialogData {
  parameter: SystemParameterDto;
}

@Component({
  selector: 'app-system-parameter-edit-dialog',
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
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
        <div class="dlg-icon" aria-hidden="true"><mat-icon>tune</mat-icon></div>
        <div>
          <h2 mat-dialog-title>{{ t('admin.systemParam.dialog.title') }}</h2>
          <p class="dlg-key">{{ param.parameterKey }}</p>
        </div>
      </div>

      <mat-dialog-content>
        <form [formGroup]="form" class="param-form">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>{{ t('admin.systemParam.field.parameterName') }}</mat-label>
            <input matInput formControlName="parameterName" maxlength="200" />
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>{{ t('admin.systemParam.field.description') }}</mat-label>
            <textarea matInput formControlName="description" rows="3" maxlength="4000"></textarea>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>{{ t('admin.systemParam.field.category') }}</mat-label>
            <input matInput formControlName="category" maxlength="100" />
          </mat-form-field>

          <div class="value-section">
            <p class="value-label">{{ t('admin.systemParam.field.value') }}
              <span class="type-badge">{{ param.parameterType }}</span>
            </p>

            @if (param.parameterType === 'STRING') {
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>{{ t('admin.systemParam.field.value') }}</mat-label>
                <textarea matInput formControlName="stringValue" rows="3"></textarea>
              </mat-form-field>
            }
            @if (param.parameterType === 'INTEGER') {
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>{{ t('admin.systemParam.field.value') }}</mat-label>
                <input matInput type="number" step="1" formControlName="integerValue" />
              </mat-form-field>
            }
            @if (param.parameterType === 'DECIMAL') {
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>{{ t('admin.systemParam.field.value') }}</mat-label>
                <input matInput type="number" step="0.0001" formControlName="decimalValue" />
              </mat-form-field>
            }
            @if (param.parameterType === 'BOOLEAN') {
              <div class="toggle-row">
                <mat-slide-toggle formControlName="booleanValue" color="primary">
                  {{ form.get('booleanValue')?.value
                    ? t('admin.systemParam.value.true')
                    : t('admin.systemParam.value.false') }}
                </mat-slide-toggle>
              </div>
            }
            @if (param.parameterType === 'DATE') {
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>{{ t('admin.systemParam.field.value') }}</mat-label>
                <input matInput type="date" formControlName="dateValue" />
              </mat-form-field>
            }
            @if (param.parameterType === 'DATETIME') {
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>{{ t('admin.systemParam.field.value') }}</mat-label>
                <input matInput type="datetime-local" formControlName="datetimeValue" />
              </mat-form-field>
            }
          </div>
        </form>
      </mat-dialog-content>

      <mat-dialog-actions align="end" class="dlg-actions">
        <button mat-button type="button" (click)="cancel()">{{ t('common.cancel') }}</button>
        <button mat-flat-button type="button"
                [disabled]="saving() || form.invalid"
                (click)="save()">
          {{ t('common.save') }}
        </button>
      </mat-dialog-actions>
    </ng-container>
  `,
  styles: [`
    .dlg-header {
      display: flex; align-items: flex-start; gap: 12px; padding: 20px 24px 0;
    }
    .dlg-icon {
      display: flex; align-items: center; justify-content: center;
      width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0; margin-top: 2px;
      background: var(--mat-sys-primary-container); color: var(--mat-sys-on-primary-container);
    }
    .dlg-key {
      font-size: 12px; color: var(--mat-sys-on-surface-variant); margin: 2px 0 0;
      font-family: monospace;
    }
    h2[mat-dialog-title] { margin: 0; font-size: 18px; }
    .param-form { display: flex; flex-direction: column; gap: 4px; padding-top: 8px; }
    .full-width { width: 100%; }
    .value-section { margin-top: 8px; }
    .value-label {
      font-size: 13px; font-weight: 500; color: var(--mat-sys-on-surface-variant);
      margin: 0 0 10px; display: flex; align-items: center; gap: 8px;
    }
    .type-badge {
      font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 12px;
      background: var(--mat-sys-secondary-container); color: var(--mat-sys-on-secondary-container);
      font-family: monospace;
    }
    .toggle-row {
      padding: 8px 0 16px;
    }
  `],
})
export class SystemParameterEditDialog {
  protected readonly param = inject<SystemParameterEditDialogData>(MAT_DIALOG_DATA).parameter;
  private readonly ref = inject(MatDialogRef<SystemParameterEditDialog>);
  private readonly service = inject(SystemParameterService);
  private readonly toast = inject(ToastService);
  private readonly t = inject(TranslocoService);
  private readonly fb = inject(FormBuilder);

  protected readonly lang = toSignal(this.t.langChanges$, { initialValue: this.t.getActiveLang() });
  protected readonly saving = signal(false);

  protected readonly form = this.fb.group({
    parameterName: [this.param.parameterName, [Validators.required, Validators.maxLength(200)]],
    description: [this.param.description],
    category: [this.param.category, Validators.maxLength(100)],
    stringValue: [this.param.stringValue],
    integerValue: [this.param.integerValue],
    decimalValue: [this.param.decimalValue],
    booleanValue: [this.param.booleanValue ?? false],
    dateValue: [this.param.dateValue],
    datetimeValue: [this.param.datetimeValue ? this.param.datetimeValue.substring(0, 16) : null],
  });

  protected save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    const v = this.form.getRawValue();

    const request: SystemParameterUpdateRequest = {
      parameterName: v.parameterName!,
      description: v.description ?? null,
      category: v.category ?? null,
      stringValue: v.stringValue ?? null,
      integerValue: v.integerValue ?? null,
      decimalValue: v.decimalValue ?? null,
      booleanValue: v.booleanValue ?? null,
      dateValue: v.dateValue ?? null,
      datetimeValue: v.datetimeValue ? `${v.datetimeValue}:00` : null,
    };

    this.service.update(this.param.id, request).subscribe({
      next: (updated) => {
        this.saving.set(false);
        this.toast.success(this.t.translate('admin.systemParam.toast.saved'));
        this.ref.close(updated);
      },
      error: () => {
        this.saving.set(false);
        this.toast.error(this.t.translate('common.error.save'));
      },
    });
  }

  protected cancel(): void {
    this.ref.close(null);
  }
}
