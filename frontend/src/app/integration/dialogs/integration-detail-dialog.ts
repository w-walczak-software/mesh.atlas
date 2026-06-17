import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoDirective, TranslocoService, provideTranslocoScope } from '@jsverse/transloco';
import { toSignal } from '@angular/core/rxjs-interop';

export interface DetailField {
  label: string;
  value: string | null | undefined;
  fullWidth?: boolean;
  mono?: boolean;
}

export interface IntegrationDetailDialogData {
  title: string;
  subtitle?: string;
  icon?: string;
  fields: DetailField[];
}

@Component({
  selector: 'app-integration-detail-dialog',
  imports: [MatDialogModule, MatButtonModule, MatIconModule, TranslocoDirective],
  providers: [provideTranslocoScope('integration')],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-container *transloco="let t; scope: 'integration'; lang: lang()">
      <div class="dialog-header">
        @if (data.icon) {
          <mat-icon class="dialog-icon">{{ data.icon }}</mat-icon>
        }
        <div>
          <h2 mat-dialog-title>{{ data.title }}</h2>
          @if (data.subtitle) {
            <p class="dialog-subtitle">{{ data.subtitle }}</p>
          }
        </div>
      </div>
      <mat-dialog-content>
        <div class="fields-grid">
          @for (field of data.fields; track field.label) {
            <div class="field-item" [class.full-width]="field.fullWidth">
              <span class="field-label">{{ field.label }}</span>
              @if (field.value != null && field.value !== '') {
                <span class="field-value" [class.mono]="field.mono">{{ field.value }}</span>
              } @else {
                <span class="field-empty">—</span>
              }
            </div>
          }
        </div>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button mat-dialog-close>{{ t('integration.action.cancel') }}</button>
      </mat-dialog-actions>
    </ng-container>
  `,
  styles: [`
    .dialog-header {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 20px 24px 0;
    }
    .dialog-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
      color: var(--mat-sys-primary);
      flex-shrink: 0;
      margin-top: 2px;
    }
    h2[mat-dialog-title] {
      margin: 0;
      padding: 0;
      font-size: 18px;
      font-weight: 500;
    }
    .dialog-subtitle {
      margin: 2px 0 0;
      font-size: 12px;
      color: var(--mat-sys-on-surface-variant);
    }
    mat-dialog-content {
      min-width: 520px;
      max-width: 700px;
      padding-top: 16px !important;
    }
    .fields-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px 24px;
    }
    .field-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .field-item.full-width {
      grid-column: 1 / -1;
    }
    .field-label {
      font-size: 11px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--mat-sys-on-surface-variant);
    }
    .field-value {
      font-size: 13px;
      color: var(--mat-sys-on-surface);
      word-break: break-all;
    }
    .field-value.mono {
      font-family: monospace;
      font-size: 12px;
      background: var(--mat-sys-surface-variant);
      padding: 2px 6px;
      border-radius: 4px;
    }
    .field-empty {
      font-size: 13px;
      color: var(--mat-sys-outline);
    }
  `],
})
export class IntegrationDetailDialog {
  protected readonly data: IntegrationDetailDialogData = inject(MAT_DIALOG_DATA);
  private readonly t = inject(TranslocoService);
  protected readonly lang = toSignal(this.t.langChanges$, { initialValue: this.t.getActiveLang() });
}
