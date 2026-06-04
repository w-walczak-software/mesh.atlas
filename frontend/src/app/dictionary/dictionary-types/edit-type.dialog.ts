import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoDirective, TranslocoService, provideTranslocoScope } from '@jsverse/transloco';
import { toSignal } from '@angular/core/rxjs-interop';
import { AtlasTextInput } from '@shared/text-input/text-input';
import { DictionaryTypeDto, DictionaryTypeUpdateRequest } from '../model/dictionary.model';
import { DictionaryTypeService } from '../service/dictionary-type.service';

@Component({
  selector: 'app-edit-type-dialog',
  imports: [
    AtlasTextInput,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatIconModule,
    ReactiveFormsModule,
    TranslocoDirective,
  ],
  providers: [provideTranslocoScope('dictionary')],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-container *transloco="let t; scope: 'dictionary'; lang: lang()">
      <div class="dlg-header">
        <div class="dlg-icon" aria-hidden="true"><mat-icon>edit_note</mat-icon></div>
        <h2 mat-dialog-title>{{ t('dictionary.dialog.editType.title') }}</h2>
      </div>
      <mat-dialog-content>
        <div class="dlg-readonly-row">
          <span class="dlg-readonly-label">{{ t('dictionary.type.code') }}</span>
          <code class="dlg-readonly-value">{{ data.code }}</code>
        </div>
        <p class="dlg-hint">{{ t('dictionary.dialog.editType.readonlyHint') }}</p>
        <form [formGroup]="form" class="dlg-form">
          <atlas-text-input class="dlg-form-field" controlName="name" [label]="t('dictionary.type.name')" [ariaRequired]="true">
            @if (form.controls.name.errors?.['required']) {
              <mat-error>{{ t('common.validation.required') }}</mat-error>
            }
            @if (form.controls.name.errors?.['maxlength']) {
              <mat-error>{{ t('common.validation.maxlength', { max: 200 }) }}</mat-error>
            }
          </atlas-text-input>
          <mat-form-field appearance="outline" class="dlg-form-field">
            <mat-label>{{ t('dictionary.type.description') }}</mat-label>
            <textarea matInput formControlName="description" rows="3"></textarea>
          </mat-form-field>
          @if (!data.systemDefined) {
            <mat-checkbox formControlName="active">
              {{ t('dictionary.type.active') }}
            </mat-checkbox>
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
      display: flex; align-items: center; gap: 12px; margin-bottom: 8px;
    }
    .dlg-readonly-label {
      font-size: 12px; color: var(--mat-sys-on-surface-variant); white-space: nowrap;
    }
    .dlg-readonly-value {
      font-size: 13px; font-weight: 500; font-family: monospace;
      background: var(--mat-sys-surface-container); padding: 2px 8px; border-radius: 4px;
    }
    .dlg-hint {
      font-size: 12px; color: var(--mat-sys-on-surface-variant); margin: 0 0 16px;
    }
    .dlg-form { display: flex; flex-direction: column; gap: 4px; }
    .dlg-form-field { width: 100%; }
  `],
})
export class EditTypeDialog {
  protected readonly data = inject<DictionaryTypeDto>(MAT_DIALOG_DATA);
  private readonly ref = inject(MatDialogRef<EditTypeDialog>);
  private readonly service = inject(DictionaryTypeService);
  private readonly t = inject(TranslocoService);
  private readonly fb = inject(FormBuilder);

  protected readonly lang = toSignal(this.t.langChanges$, { initialValue: this.t.getActiveLang() });
  protected readonly saving = signal(false);

  protected readonly form = this.fb.group({
    name: [this.data.name, [Validators.required, Validators.maxLength(200)]],
    description: [this.data.description ?? ''],
    active: [{ value: this.data.active, disabled: this.data.systemDefined }],
  });

  protected save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    const raw = this.form.getRawValue();
    const request: DictionaryTypeUpdateRequest = {
      name: raw.name!,
      description: raw.description || null,
      active: raw.active ?? this.data.active,
    };
    this.service.update(this.data.id, request).subscribe({
      next: (updated) => {
        this.saving.set(false);
        this.ref.close(updated);
      },
      error: () => this.saving.set(false),
    });
  }

  protected cancel(): void {
    this.ref.close();
  }
}
