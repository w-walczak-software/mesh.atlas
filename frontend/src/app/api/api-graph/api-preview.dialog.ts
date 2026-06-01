import { ChangeDetectionStrategy, Component, inject, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { provideTranslocoScope, TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { toSignal } from '@angular/core/rxjs-interop';
import { ApiGraphEdgeDto } from '../model/api.model';
import { ApiDocumentationDialog, ApiDocumentationDialogData } from '../api-documentation-dialog/api-documentation-dialog';

export interface ApiPreviewDialogData {
  api:             ApiGraphEdgeDto;
  edgeColor:       string;
  /** id → name look-up built from the full systems list */
  systemNamesById: Map<string, string>;
}

export type ApiPreviewDialogResult = 'details' | undefined;

@Component({
  selector: 'app-api-preview-dialog',
  imports: [MatDialogModule, MatButtonModule, MatIconModule, TranslocoDirective],
  providers: [provideTranslocoScope('api')],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <ng-container *transloco="let t; scope: 'api'; lang: lang()">

      <!-- ── Header ───────────────────────────────────────────────────── -->
      <div class="prev-dlg-header" [style.--acc]="data.edgeColor">
        <div class="prev-dlg-header__icon-wrap">
          <mat-icon class="prev-dlg-header__icon">
            {{ data.api.transportLayer?.icon ?? 'swap_horiz' }}
          </mat-icon>
        </div>
        <div class="prev-dlg-header__text">
          <span class="prev-dlg-header__code">{{ data.api.code }}</span>
          <span class="prev-dlg-header__name">
            {{ data.api.name }}
            @if (data.api.apiVersion) {
              <span class="prev-dlg-header__version">v{{ data.api.apiVersion }}</span>
            }
          </span>
        </div>
        <button mat-icon-button class="prev-dlg-close" mat-dialog-close>
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- ── Body ─────────────────────────────────────────────────────── -->
      <mat-dialog-content class="prev-dlg-body">

        @if (data.api.type) {
          <div class="prev-dlg-row">
            <span class="prev-dlg-row__label">{{ t('api.preview.type') }}</span>
            <span class="prev-dlg-row__value">{{ data.api.type.name }}</span>
          </div>
        }

        <div class="prev-dlg-row">
          <span class="prev-dlg-row__label">{{ t('api.preview.status') }}</span>
          <span class="prev-dlg-row__value">{{ data.api.status.name }}</span>
        </div>

        @if (data.api.apiVersion) {
          <div class="prev-dlg-row">
            <span class="prev-dlg-row__label">{{ t('api.preview.version') }}</span>
            <span class="prev-dlg-row__value">{{ data.api.apiVersion }}</span>
          </div>
        }

        @if (data.api.transportLayer) {
          <div class="prev-dlg-row">
            <span class="prev-dlg-row__label">{{ t('api.preview.transport') }}</span>
            <span class="prev-dlg-row__value prev-dlg-row__value--icon">
              @if (data.api.transportLayer.icon) {
                <mat-icon class="prev-dlg-inline-icon">{{ data.api.transportLayer.icon }}</mat-icon>
              }
              {{ data.api.transportLayer.name }}
            </span>
          </div>
        }

        @if (producerName()) {
          <div class="prev-dlg-row">
            <span class="prev-dlg-row__label">{{ t('api.preview.producer') }}</span>
            <span class="prev-dlg-row__value">{{ producerName() }}</span>
          </div>
        }

        @if (consumerNames().length) {
          <div class="prev-dlg-row prev-dlg-row--desc">
            <span class="prev-dlg-row__label">{{ t('api.preview.consumers') }}</span>
            <span class="prev-dlg-row__value">{{ consumerNames().join(', ') }}</span>
          </div>
        }

        @if (data.api.environments.length) {
          <div class="prev-dlg-row prev-dlg-row--chips">
            <span class="prev-dlg-row__label">{{ t('api.preview.environments') }}</span>
            <span class="prev-dlg-row__chips">
              @for (env of data.api.environments; track env) {
                <span class="prev-dlg-chip">{{ env }}</span>
              }
            </span>
          </div>
        }

        @if (data.api.dataDomains.length) {
          <div class="prev-dlg-row prev-dlg-row--chips">
            <span class="prev-dlg-row__label">{{ t('api.preview.dataDomains') }}</span>
            <span class="prev-dlg-row__chips">
              @for (dd of data.api.dataDomains; track dd) {
                <span class="prev-dlg-chip">{{ dd }}</span>
              }
            </span>
          </div>
        }

      </mat-dialog-content>

      <!-- ── Actions ───────────────────────────────────────────────────── -->
      <mat-dialog-actions align="end" class="prev-dlg-actions">
        <button mat-stroked-button (click)="close()">
          <mat-icon>arrow_back</mat-icon>
          {{ t('api.preview.close') }}
        </button>
        <button mat-stroked-button (click)="openDocumentation()">
          <mat-icon>description</mat-icon>
          {{ t('api.preview.documentation') }}
        </button>
        <button mat-flat-button (click)="showDetails()">
          <mat-icon>open_in_new</mat-icon>
          {{ t('api.preview.showDetails') }}
        </button>
      </mat-dialog-actions>

    </ng-container>
  `,
  styles: [`
    .prev-dlg-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 20px 20px 16px 24px;
      border-bottom: 1px solid var(--mat-sys-outline-variant);
      background: color-mix(in srgb, var(--acc, #6366f1) 8%, transparent);
    }
    .prev-dlg-header__icon-wrap {
      width: 40px; height: 40px; border-radius: 10px; flex-shrink: 0;
      background: var(--acc, #6366f1);
      display: flex; align-items: center; justify-content: center;
    }
    .prev-dlg-header__icon {
      font-size: 20px !important; width: 20px !important; height: 20px !important; color: #fff;
    }
    .prev-dlg-header__text {
      flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0;
    }
    .prev-dlg-header__code {
      font-size: 10px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase;
      color: var(--acc, #6366f1);
    }
    .prev-dlg-header__name {
      font-size: 15px; font-weight: 600; color: var(--mat-sys-on-surface);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      display: flex; align-items: baseline; gap: 6px;
    }
    .prev-dlg-header__version {
      font-size: 11px; font-weight: 500; color: var(--mat-sys-on-surface-variant);
    }
    .prev-dlg-close { color: var(--mat-sys-on-surface-variant); flex-shrink: 0; }

    .prev-dlg-body {
      display: flex; flex-direction: column; gap: 0;
      padding: 4px 24px 8px !important; max-height: 50vh;
    }
    .prev-dlg-row {
      display: flex; gap: 12px; padding: 10px 0;
      border-bottom: 1px solid var(--mat-sys-outline-variant);
      &:last-child { border-bottom: none; }
    }
    .prev-dlg-row--desc  { flex-direction: column; gap: 4px; }
    .prev-dlg-row--chips { flex-direction: column; gap: 5px; }
    .prev-dlg-row__chips {
      display: flex; flex-wrap: wrap; gap: 4px;
    }
    .prev-dlg-chip {
      font-size: 11px; font-weight: 500;
      padding: 2px 8px; border-radius: 20px;
      background: color-mix(in srgb, var(--mat-sys-primary) 10%, transparent);
      color: var(--mat-sys-primary);
      border: 1px solid color-mix(in srgb, var(--mat-sys-primary) 28%, transparent);
      white-space: nowrap;
    }
    .prev-dlg-row__label {
      font-size: 11px; font-weight: 600; color: var(--mat-sys-on-surface-variant);
      text-transform: uppercase; letter-spacing: .04em;
      min-width: 80px; flex-shrink: 0; padding-top: 1px;
    }
    .prev-dlg-row--desc .prev-dlg-row__label { min-width: unset; }
    .prev-dlg-row__value {
      font-size: 13px; color: var(--mat-sys-on-surface); line-height: 1.5;
    }
    .prev-dlg-row__value--icon {
      display: flex; align-items: center; gap: 5px;
    }
    .prev-dlg-inline-icon {
      font-size: 14px !important; width: 14px !important; height: 14px !important;
      color: var(--mat-sys-on-surface-variant);
    }

    .prev-dlg-actions {
      padding: 12px 20px 16px !important; gap: 8px;
    }
  `],
})
export class ApiPreviewDialog {
  protected readonly data    = inject<ApiPreviewDialogData>(MAT_DIALOG_DATA);
  private   readonly ref     = inject(MatDialogRef<ApiPreviewDialog, ApiPreviewDialogResult>);
  private   readonly ts      = inject(TranslocoService);
  private   readonly dialog  = inject(MatDialog);
  protected readonly lang    = toSignal(this.ts.langChanges$, { initialValue: this.ts.getActiveLang() });

  protected producerName(): string | null {
    const id = this.data.api.producerSystemId;
    return id ? (this.data.systemNamesById.get(id) ?? null) : null;
  }

  protected consumerNames(): string[] {
    return this.data.api.consumerSystemIds
      .map(id => this.data.systemNamesById.get(id))
      .filter((n): n is string => !!n);
  }

  protected openDocumentation(): void {
    this.dialog.open(ApiDocumentationDialog, {
      data: {
        apiId:   this.data.api.id,
        apiCode: this.data.api.code,
        apiName: this.data.api.name,
      } satisfies ApiDocumentationDialogData,
      width:     '680px',
      autoFocus: false,
    });
  }

  protected showDetails(): void { this.ref.close('details'); }
  protected close(): void        { this.ref.close(undefined); }
}
