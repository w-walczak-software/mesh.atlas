import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslocoDirective, TranslocoService, provideTranslocoScope } from '@jsverse/transloco';
import { toSignal } from '@angular/core/rxjs-interop';
import { PipelineDictionaryMappingDto } from '../model/integration.model';

export interface MappingValueDialogData {
  mapping: PipelineDictionaryMappingDto;
}

export interface MappingValueDialogResult {
  externalValue: string | null;
}

@Component({
  selector: 'app-mapping-value-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    TranslocoDirective,
  ],
  providers: [provideTranslocoScope('integration')],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-container *transloco="let t; scope: 'integration'; lang: lang()">
      <h2 mat-dialog-title>{{ t('integration.mapping.editValueTitle') }}</h2>
      <mat-dialog-content>
        <p class="mapping-info">
          <strong>{{ t('integration.mapping.atlasEntryCode') }}:</strong> {{ data.mapping.atlasEntry.code }}<br>
          <strong>{{ t('integration.mapping.atlasEntryName') }}:</strong> {{ data.mapping.atlasEntry.name }}<br>
          <strong>{{ t('integration.mapping.dictionaryTypeCode') }}:</strong> {{ data.mapping.dictionaryTypeCode }}
        </p>
        <mat-form-field appearance="outline" style="width:100%">
          <mat-label>{{ t('integration.mapping.externalValue') }}</mat-label>
          <input matInput [formControl]="valueControl" [placeholder]="t('integration.mapping.externalValueHint')" />
          @if (valueControl.hasError('maxlength')) {
            <mat-error>{{ t('integration.error.maxLength500') }}</mat-error>
          }
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button mat-dialog-close>{{ t('integration.action.cancel') }}</button>
        <button mat-flat-button color="primary" [disabled]="valueControl.invalid" (click)="confirm()">
          {{ t('integration.action.save') }}
        </button>
      </mat-dialog-actions>
    </ng-container>
  `,
  styles: [`
    .mapping-info { margin-bottom: 16px; line-height: 1.8; font-size: 13px; color: var(--mat-sys-on-surface-variant); }
    mat-dialog-content { min-width: 400px; }
  `],
})
export class MappingValueDialog {
  protected readonly data: MappingValueDialogData = inject(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<MappingValueDialog, MappingValueDialogResult>);
  private readonly t = inject(TranslocoService);
  protected readonly lang = toSignal(this.t.langChanges$, { initialValue: this.t.getActiveLang() });

  protected readonly valueControl = new FormControl<string | null>(
    this.data.mapping.externalValue ?? '',
    [Validators.maxLength(500)]
  );

  protected confirm(): void {
    if (this.valueControl.invalid) return;
    const raw = this.valueControl.value ?? '';
    this.dialogRef.close({ externalValue: raw.trim() || null });
  }
}
