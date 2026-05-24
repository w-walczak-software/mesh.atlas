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
import { MatIconModule } from '@angular/material/icon';
import { TranslocoDirective, TranslocoService, provideTranslocoScope } from '@jsverse/transloco';
import { toSignal } from '@angular/core/rxjs-interop';

export interface DataDomainEditDescriptionDialogData {
  fileName: string;
  currentDescription: string | null;
}

export interface DataDomainEditDescriptionDialogResult {
  description: string | null;
}

@Component({
  selector: 'app-data-domain-edit-description-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    TranslocoDirective,
  ],
  providers: [provideTranslocoScope('datadomain')],
  template: `
    <ng-container *transloco="let t; scope: 'datadomain'; lang: lang()">
      <h2 mat-dialog-title>
        <mat-icon style="vertical-align:middle;margin-right:8px;">edit_note</mat-icon>
        {{ t('datadomain.attachment.editDescription') }}
      </h2>

      <mat-dialog-content>
        <p class="file-name-preview">
          <mat-icon aria-hidden="true">description</mat-icon>
          {{ data.fileName }}
        </p>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>{{ t('datadomain.attachment.description') }}</mat-label>
          <textarea matInput [formControl]="descriptionCtrl" rows="4"
                    [placeholder]="t('datadomain.attachment.descriptionPlaceholder')"></textarea>
          <mat-hint>{{ t('datadomain.attachment.descriptionHint') }}</mat-hint>
        </mat-form-field>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-stroked-button (click)="cancel()">{{ t('datadomain.action.cancel') }}</button>
        <button mat-flat-button (click)="confirm()">
          <mat-icon>save</mat-icon>
          {{ t('datadomain.action.save') }}
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
export class DataDomainEditDescriptionDialog implements OnInit {
  protected readonly data = inject<DataDomainEditDescriptionDialogData>(MAT_DIALOG_DATA);
  protected readonly ref = inject(MatDialogRef<DataDomainEditDescriptionDialog>);
  private readonly t = inject(TranslocoService);
  private readonly fb = inject(FormBuilder);

  protected readonly lang = toSignal(this.t.langChanges$, { initialValue: this.t.getActiveLang() });
  protected readonly descriptionCtrl = this.fb.control<string>('');

  ngOnInit(): void {
    this.descriptionCtrl.setValue(this.data.currentDescription ?? '');
  }

  protected confirm(): void {
    const desc = this.descriptionCtrl.value?.trim() || null;
    this.ref.close({ description: desc } satisfies DataDomainEditDescriptionDialogResult);
  }

  protected cancel(): void {
    this.ref.close(null);
  }
}
