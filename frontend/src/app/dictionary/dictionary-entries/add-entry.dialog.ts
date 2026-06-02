import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoDirective, TranslocoService, provideTranslocoScope } from '@jsverse/transloco';
import { toSignal } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { DictionaryEntryCreateRequest, DictionaryEntryDto } from '../model/dictionary.model';
import { DictionaryEntryService } from '../service/dictionary-entry.service';
import { ToastService } from '@shared/toast/toast.service';

export interface AddEntryDialogData {
  typeId: string;
  typeCode: string;
}

@Component({
  selector: 'app-add-entry-dialog',
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    ReactiveFormsModule,
    TranslocoDirective,
  ],
  providers: [provideTranslocoScope('dictionary')],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-container *transloco="let t; scope: 'dictionary'; lang: lang()">
      <div class="dlg-header">
        <div class="dlg-icon" aria-hidden="true"><mat-icon>add_circle</mat-icon></div>
        <h2 mat-dialog-title>{{ t('dictionary.dialog.addEntry.title') }}</h2>
      </div>
      <mat-dialog-content>
        <div class="dlg-readonly-row">
          <span class="dlg-readonly-label">{{ t('dictionary.entry.typeCode') }}</span>
          <code class="dlg-readonly-value">{{ data.typeCode }}</code>
        </div>
        <form [formGroup]="form" class="dlg-form">
          <mat-form-field appearance="outline" class="dlg-form-field">
            <mat-label>{{ t('dictionary.entry.code') }}</mat-label>
            <input matInput formControlName="code" [attr.aria-required]="true" />
            @if (form.controls.code.errors?.['required']) {
              <mat-error>{{ t('common.validation.required') }}</mat-error>
            }
            @if (form.controls.code.errors?.['maxlength']) {
              <mat-error>{{ t('common.validation.maxlength', { max: 100 }) }}</mat-error>
            }
          </mat-form-field>
          <mat-form-field appearance="outline" class="dlg-form-field">
            <mat-label>{{ t('dictionary.entry.name') }}</mat-label>
            <input matInput formControlName="name" [attr.aria-required]="true" />
            @if (form.controls.name.errors?.['required']) {
              <mat-error>{{ t('common.validation.required') }}</mat-error>
            }
            @if (form.controls.name.errors?.['maxlength']) {
              <mat-error>{{ t('common.validation.maxlength', { max: 200 }) }}</mat-error>
            }
          </mat-form-field>
          <mat-form-field appearance="outline" class="dlg-form-field">
            <mat-label>{{ t('dictionary.entry.description') }}</mat-label>
            <textarea matInput formControlName="description" rows="3"></textarea>
          </mat-form-field>
          <mat-form-field appearance="outline" class="dlg-form-field dlg-form-field--narrow">
            <mat-label>{{ t('dictionary.entry.displayOrder') }}</mat-label>
            <input matInput type="number" formControlName="displayOrder" min="0" [attr.aria-required]="true" />
            @if (form.controls.displayOrder.errors?.['required']) {
              <mat-error>{{ t('common.validation.required') }}</mat-error>
            }
            @if (form.controls.displayOrder.errors?.['min']) {
              <mat-error>{{ t('common.validation.min', { min: 0 }) }}</mat-error>
            }
          </mat-form-field>

          @if (isSystemOwnerRole || isApiOwnerRole) {
            <mat-divider class="dlg-divider" />
            <p class="dlg-section-label">{{ t('dictionary.rolePermissions.section') }}</p>
            @if (isSystemOwnerRole) {
              <mat-checkbox formControlName="canDefineApi">
                {{ t('dictionary.rolePermissions.canDefineApi') }}
              </mat-checkbox>
              <mat-checkbox formControlName="canVerifyApi">
                {{ t('dictionary.rolePermissions.canVerifyApi') }}
              </mat-checkbox>
            }
            @if (isApiOwnerRole) {
              <mat-checkbox formControlName="canEditApi">
                {{ t('dictionary.rolePermissions.canEditApi') }}
              </mat-checkbox>
            }
          }
        </form>
      </mat-dialog-content>
      <mat-dialog-actions align="end" class="dlg-actions">
        <button mat-button type="button" (click)="cancel()">{{ t('common.cancel') }}</button>
        <button mat-flat-button type="button" [disabled]="form.invalid || saving()" (click)="save()">
          {{ t('common.save') }}
        </button>
      </mat-dialog-actions>
    </ng-container>
  `,
  styles: [`
    .dlg-header {
      display: flex; align-items: center; gap: 12px; padding: 20px 24px 0;
    }
    .dlg-icon {
      display: flex; align-items: center; justify-content: center;
      width: 40px; height: 40px; border-radius: 50%;
      background: var(--mat-sys-primary-container); color: var(--mat-sys-on-primary-container);
      flex-shrink: 0;
    }
    .dlg-readonly-row {
      display: flex; align-items: center; gap: 12px; margin-bottom: 16px;
    }
    .dlg-readonly-label {
      font-size: 12px; color: var(--mat-sys-on-surface-variant); white-space: nowrap;
    }
    .dlg-readonly-value {
      font-size: 13px; font-weight: 500; font-family: monospace;
      background: var(--mat-sys-surface-container); padding: 2px 8px; border-radius: 4px;
    }
    .dlg-form { display: flex; flex-direction: column; gap: 4px; }
    .dlg-form-field { width: 100%; }
    .dlg-form-field--narrow { max-width: 160px; }
    .dlg-divider { margin: 12px 0 8px; }
    .dlg-section-label {
      font-size: 12px; font-weight: 500; color: var(--mat-sys-on-surface-variant);
      margin: 0 0 4px;
    }
  `],
})
export class AddEntryDialog {
  protected readonly data = inject<AddEntryDialogData>(MAT_DIALOG_DATA);
  private readonly ref = inject(MatDialogRef<AddEntryDialog>);
  private readonly service = inject(DictionaryEntryService);
  private readonly toast = inject(ToastService);
  private readonly t = inject(TranslocoService);
  private readonly fb = inject(FormBuilder);

  protected readonly lang = toSignal(this.t.langChanges$, { initialValue: this.t.getActiveLang() });
  protected readonly saving = signal(false);

  protected readonly isSystemOwnerRole = this.data.typeCode === 'SYSTEM_OWNER_ROLE';
  protected readonly isApiOwnerRole = this.data.typeCode === 'API_OWNER_ROLE';

  protected readonly form = this.fb.group({
    code: ['', [Validators.required, Validators.maxLength(100)]],
    name: ['', [Validators.required, Validators.maxLength(200)]],
    description: [''],
    displayOrder: [0, [Validators.required, Validators.min(0)]],
    canDefineApi: [false],
    canVerifyApi: [false],
    canEditApi: [false],
  });

  protected save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    const v = this.form.getRawValue();
    const request: DictionaryEntryCreateRequest = {
      code: v.code!,
      name: v.name!,
      description: v.description || null,
      displayOrder: v.displayOrder ?? 0,
      metadata: this.buildMetadata(v),
    };
    this.service.create(this.data.typeId, request).subscribe({
      next: (created: DictionaryEntryDto) => {
        this.saving.set(false);
        this.ref.close(created);
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        const code: string = err.error?.code ?? '';
        if (err.status === 409 || code === 'dict.entryDuplicate') {
          this.toast.error(this.t.translate('dictionary.error.duplicateCode', { code: request.code }));
        } else {
          this.toast.error(this.t.translate('common.error.unexpected'));
        }
      },
    });
  }

  private buildMetadata(v: ReturnType<typeof this.form.getRawValue>): Record<string, unknown> | null {
    if (this.isSystemOwnerRole) {
      return { canDefineApi: v.canDefineApi ?? false, canVerifyApi: v.canVerifyApi ?? false };
    }
    if (this.isApiOwnerRole) {
      return { canEditApi: v.canEditApi ?? false };
    }
    return null;
  }

  protected cancel(): void {
    this.ref.close();
  }
}
