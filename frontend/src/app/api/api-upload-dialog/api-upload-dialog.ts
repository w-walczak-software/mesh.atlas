import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
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

export interface ApiUploadDialogData {
  file:              File;
  contractTypes:     DictionaryEntryDto[];
  attachmentStatuses: DictionaryEntryDto[];
}

export interface ApiUploadDialogResult {
  description:        string | null;
  contractTypeId:     string | null;
  attachmentVersion:  string | null;
  attachmentStatusId: string | null;
}

@Component({
  selector: 'app-api-upload-dialog',
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
        <mat-icon style="vertical-align:middle;margin-right:8px;">upload_file</mat-icon>
        {{ t('api.attachment.upload') }}
      </h2>

      <mat-dialog-content>
        <p class="file-name-preview">
          <mat-icon aria-hidden="true">description</mat-icon>
          {{ data.file.name }}
        </p>

        <div class="row-2">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>{{ t('api.attachment.contractType') }}</mat-label>
            <mat-select [formControl]="form.controls.contractTypeId">
              <mat-option [value]="null">–</mat-option>
              @for (ct of data.contractTypes; track ct.id) {
                <mat-option [value]="ct.id">{{ ct.name }}</mat-option>
              }
            </mat-select>
            @if (detectedEntry()) {
              <mat-hint class="upload-hint-detected">
                <mat-icon>auto_fix_high</mat-icon>
                {{ t('api.attachment.autoDetected', { name: detectedEntry()!.name }) }}
              </mat-hint>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>{{ t('api.attachment.attachmentStatus') }}</mat-label>
            <mat-select [formControl]="form.controls.attachmentStatusId">
              <mat-option [value]="null">–</mat-option>
              @for (s of data.attachmentStatuses; track s.id) {
                <mat-option [value]="s.id">{{ s.name }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>{{ t('api.attachment.attachmentVersion') }}</mat-label>
          <mat-icon matPrefix>tag</mat-icon>
          <input matInput [formControl]="form.controls.attachmentVersion"
                 [placeholder]="t('api.attachment.attachmentVersionPlaceholder')" />
          <mat-hint>{{ t('api.attachment.attachmentVersionHint') }}</mat-hint>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>{{ t('api.attachment.description') }}</mat-label>
          <textarea matInput [formControl]="form.controls.description" rows="3"
                    [placeholder]="t('api.attachment.descriptionPlaceholder')"></textarea>
          <mat-hint>{{ t('api.attachment.descriptionHint') }}</mat-hint>
        </mat-form-field>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-stroked-button (click)="cancel()">{{ t('api.action.cancel') }}</button>
        <button mat-flat-button (click)="confirm()">
          <mat-icon>upload</mat-icon>
          {{ t('api.attachment.upload') }}
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
    .row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .full-width { width: 100%; }
    mat-dialog-content { min-width: 480px; max-width: 600px; }
    .upload-hint-detected {
      display: flex !important;
      align-items: center;
      gap: 3px;
      color: var(--mat-sys-primary) !important;
    }
    .upload-hint-detected mat-icon {
      font-size: 12px !important;
      width: 12px !important;
      height: 12px !important;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApiUploadDialog {
  protected readonly data = inject<ApiUploadDialogData>(MAT_DIALOG_DATA);
  protected readonly ref  = inject(MatDialogRef<ApiUploadDialog>);
  private  readonly t   = inject(TranslocoService);
  private  readonly fb  = inject(FormBuilder);

  protected readonly lang          = toSignal(this.t.langChanges$, { initialValue: this.t.getActiveLang() });
  protected readonly detectedEntry = signal<DictionaryEntryDto | null>(null);
  protected readonly form = this.fb.group({
    description:        [''],
    contractTypeId:     [null as string | null],
    attachmentVersion:  [''],
    attachmentStatusId: [null as string | null],
  });

  constructor() {
    this.runAutoDetect();
  }

  private async runAutoDetect(): Promise<void> {
    const code = await detectContractTypeCode(this.data.file);
    if (!code) return;
    const match = this.data.contractTypes.find(ct => ct.code === code);
    if (match) {
      this.form.controls.contractTypeId.setValue(match.id);
      this.detectedEntry.set(match);
    }
  }

  protected confirm(): void {
    const v = this.form.getRawValue();
    this.ref.close({
      description:        v.description?.trim()        || null,
      contractTypeId:     v.contractTypeId             || null,
      attachmentVersion:  v.attachmentVersion?.trim()  || null,
      attachmentStatusId: v.attachmentStatusId         || null,
    } satisfies ApiUploadDialogResult);
  }

  protected cancel(): void {
    this.ref.close(null);
  }
}

// ── Contract type auto-detection ──────────────────────────────────────────────

const EXT_TO_CODE: Record<string, string> = {
  proto:   'PROTOBUF',
  wsdl:    'WSDL',
  xsd:     'XSD',
  graphql: 'GRAPHQL_SCHEMA',
  gql:     'GRAPHQL_SCHEMA',
  raml:    'RAML',
};

async function detectContractTypeCode(file: File): Promise<string | null> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';

  if (ext in EXT_TO_CODE) return EXT_TO_CODE[ext];

  if (['json', 'yaml', 'yml'].includes(ext)) {
    const text = await file.slice(0, 4096).text();
    if (text.includes('"asyncapi"') || /\basyncapi\s*:/m.test(text)) return 'ASYNCAPI';
    if (text.includes('"swagger"')  || /\bswagger\s*:/m.test(text))  return 'SWAGGER_2';
    if (text.includes('"openapi"')  || /\bopenapi\s*:/m.test(text))  return 'OPENAPI_3';
    if (text.includes('"_postman_id"'))                               return 'POSTMAN_COLLECTION';
  }

  return null;
}
