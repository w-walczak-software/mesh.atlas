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
import { DictionaryEntryDto, DictionaryEntryUpdateRequest } from '../model/dictionary.model';
import { DictionaryEntryService } from '../service/dictionary-entry.service';

@Component({
  selector: 'app-edit-entry-dialog',
  imports: [
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
        <h2 mat-dialog-title>{{ t('dictionary.dialog.editEntry.title') }}</h2>
      </div>
      <mat-dialog-content>
        <div class="dlg-readonly-row">
          <span class="dlg-readonly-label">{{ t('dictionary.entry.typeCode') }}</span>
          <code class="dlg-readonly-value">{{ data.typeCode }}</code>
          <span class="dlg-readonly-label">{{ t('dictionary.entry.code') }}</span>
          <code class="dlg-readonly-value">{{ data.code }}</code>
        </div>
        <p class="dlg-hint">{{ t('dictionary.dialog.editEntry.readonlyHint') }}</p>
        <form [formGroup]="form" class="dlg-form">
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
          @if (!data.systemDefined) {
            <mat-checkbox formControlName="active">
              {{ t('dictionary.entry.active') }}
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
      display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 8px;
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
    .dlg-form-field--narrow { max-width: 160px; }
  `],
})
export class EditEntryDialog {
  protected readonly data = inject<DictionaryEntryDto>(MAT_DIALOG_DATA);
  private readonly ref = inject(MatDialogRef<EditEntryDialog>);
  private readonly service = inject(DictionaryEntryService);
  private readonly t = inject(TranslocoService);
  private readonly fb = inject(FormBuilder);

  protected readonly lang = toSignal(this.t.langChanges$, { initialValue: this.t.getActiveLang() });
  protected readonly saving = signal(false);

  protected readonly form = this.fb.group({
    name: [this.data.name, [Validators.required, Validators.maxLength(200)]],
    description: [this.data.description ?? ''],
    displayOrder: [this.data.displayOrder, [Validators.required, Validators.min(0)]],
    active: [{ value: this.data.active, disabled: this.data.systemDefined }],
  });

  protected save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    const raw = this.form.getRawValue();
    const request: DictionaryEntryUpdateRequest = {
      name: raw.name!,
      description: raw.description || null,
      displayOrder: raw.displayOrder ?? 0,
      active: raw.active ?? this.data.active,
      metadata: this.data.metadata,
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
