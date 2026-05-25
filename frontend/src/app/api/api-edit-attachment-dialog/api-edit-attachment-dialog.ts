import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoDirective, TranslocoService, provideTranslocoScope } from '@jsverse/transloco';
import { toSignal } from '@angular/core/rxjs-interop';
import { DictionaryEntryDto } from '../../dictionary/model/dictionary.model';

export interface ApiEditAttachmentDialogData {
  fileName: string;
  currentDescription: string | null;
  currentContractTypeId: string | null;
  contractTypes: DictionaryEntryDto[];
}

export interface ApiEditAttachmentDialogResult {
  description: string | null;
  contractTypeId: string | null;
}

@Component({
  selector: 'app-api-edit-attachment-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    TranslocoDirective,
  ],
  providers: [provideTranslocoScope('api')],
  template: `
    <ng-container *transloco="let t; scope: 'api'; lang: lang()">
      <h2 mat-dialog-title>
        <mat-icon style="vertical-align:middle;margin-right:8px;">edit_note</mat-icon>
        {{ t('api.attachment.editAttachment') }}
      </h2>

      <mat-dialog-content>
        <p class="file-name-preview">
          <mat-icon aria-hidden="true">description</mat-icon>
          {{ data.fileName }}
        </p>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>{{ t('api.attachment.contractType') }}</mat-label>
          <mat-select [formControl]="form.controls.contractTypeId">
            <mat-option [value]="null">–</mat-option>
            @for (ct of data.contractTypes; track ct.id) {
              <mat-option [value]="ct.id">{{ ct.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>{{ t('api.attachment.description') }}</mat-label>
          <textarea matInput [formControl]="form.controls.description" rows="4"
                    [placeholder]="t('api.attachment.descriptionPlaceholder')"></textarea>
          <mat-hint>{{ t('api.attachment.descriptionHint') }}</mat-hint>
        </mat-form-field>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-stroked-button (click)="cancel()">{{ t('api.action.cancel') }}</button>
        <button mat-flat-button (click)="confirm()">
          <mat-icon>save</mat-icon>
          {{ t('api.action.save') }}
        </button>
      </mat-dialog-actions>
    </ng-container>
  `,
  styles: [`
    .file-name-preview {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: var(--mat-sys-on-surface-variant);
      background: var(--mat-sys-surface-container);
      border-radius: 8px;
      padding: 10px 14px;
      margin: 0 0 16px;
    }
    .full-width { width: 100%; }
    mat-dialog-content { min-width: 400px; max-width: 560px; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApiEditAttachmentDialog implements OnInit {
  protected readonly data = inject<ApiEditAttachmentDialogData>(MAT_DIALOG_DATA);
  protected readonly ref = inject(MatDialogRef<ApiEditAttachmentDialog>);
  private readonly t = inject(TranslocoService);
  private readonly fb = inject(FormBuilder);

  protected readonly lang = toSignal(this.t.langChanges$, { initialValue: this.t.getActiveLang() });
  protected readonly form = this.fb.group({
    description: [''],
    contractTypeId: [null as string | null],
  });

  ngOnInit(): void {
    this.form.patchValue({
      description: this.data.currentDescription ?? '',
      contractTypeId: this.data.currentContractTypeId ?? null,
    });
  }

  protected confirm(): void {
    const v = this.form.getRawValue();
    this.ref.close({
      description: v.description?.trim() || null,
      contractTypeId: v.contractTypeId || null,
    } satisfies ApiEditAttachmentDialogResult);
  }

  protected cancel(): void {
    this.ref.close(null);
  }
}
