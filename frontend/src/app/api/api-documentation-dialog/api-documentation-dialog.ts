import { ChangeDetectionStrategy, Component, inject, OnInit, signal, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslocoDirective, TranslocoService, provideTranslocoScope } from '@jsverse/transloco';
import { toSignal } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { ApiAttachmentDto, ApiDto } from '../model/api.model';
import { ApiService } from '../service/api.service';
import { ApiFileViewerDialog, ApiFileViewerDialogData } from '../api-file-viewer/api-file-viewer-dialog';
import { canPreview } from '../api-file-viewer/doc-viewer.utils';

export interface ApiDocumentationDialogData {
  apiId: string;
  apiCode?: string;
  apiName?: string;
}

@Component({
  selector: 'app-api-documentation-dialog',
  imports: [MatDialogModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, TranslocoDirective],
  providers: [provideTranslocoScope('api')],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <ng-container *transloco="let t; scope: 'api'; lang: lang()">

      <!-- ── Header ─────────────────────────────────────────────────────── -->
      <div class="doc-dlg-header">
        <div class="doc-dlg-header__icon-wrap">
          <mat-icon class="doc-dlg-header__icon">description</mat-icon>
        </div>
        <div class="doc-dlg-header__text">
          @if (data.apiCode) {
            <span class="doc-dlg-header__code">{{ data.apiCode }}</span>
          }
          <span class="doc-dlg-header__name">
            {{ data.apiName ?? t('api.docs.title') }}
          </span>
        </div>
        <button mat-icon-button class="doc-dlg-close" mat-dialog-close aria-label="Close">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- ── Body ───────────────────────────────────────────────────────── -->
      <mat-dialog-content class="doc-dlg-body">

        @if (loading()) {
          <div class="doc-dlg-spinner">
            <mat-spinner diameter="36"></mat-spinner>
          </div>
        } @else {
          @let apiData = api();

          <!-- Contract & Documentation section -->
          <div class="doc-dlg-section">
            <div class="doc-dlg-section__title">
              <mat-icon class="doc-dlg-section__icon">article</mat-icon>
              {{ t('api.docs.contractSection') }}
            </div>

            @if (apiData && hasContractInfo(apiData)) {
              @if (apiData.contractType) {
                <div class="doc-dlg-row">
                  <span class="doc-dlg-row__label">{{ t('api.field.contractType') }}</span>
                  <span class="doc-dlg-row__value">{{ apiData.contractType.name }}</span>
                </div>
              }
              @if (apiData.contractVersion) {
                <div class="doc-dlg-row">
                  <span class="doc-dlg-row__label">{{ t('api.field.contractVersion') }}</span>
                  <span class="doc-dlg-row__value">{{ apiData.contractVersion }}</span>
                </div>
              }
              @if (apiData.contractUrl) {
                <div class="doc-dlg-row">
                  <span class="doc-dlg-row__label">{{ t('api.field.contractUrl') }}</span>
                  <span class="doc-dlg-row__value">
                    <button mat-button class="doc-dlg-link-btn" (click)="openUrl(apiData.contractUrl!)">
                      <mat-icon>open_in_new</mat-icon>
                      {{ apiData.contractUrl }}
                    </button>
                  </span>
                </div>
              }
              @if (apiData.documentationUrl) {
                <div class="doc-dlg-row">
                  <span class="doc-dlg-row__label">{{ t('api.field.documentationUrl') }}</span>
                  <span class="doc-dlg-row__value">
                    <button mat-button class="doc-dlg-link-btn" (click)="openUrl(apiData.documentationUrl!)">
                      <mat-icon>open_in_new</mat-icon>
                      {{ apiData.documentationUrl }}
                    </button>
                  </span>
                </div>
              }
            } @else {
              <p class="doc-dlg-empty">{{ t('api.docs.noContractInfo') }}</p>
            }
          </div>

          <!-- Attachments section -->
          <div class="doc-dlg-section">
            <div class="doc-dlg-section__title">
              <mat-icon class="doc-dlg-section__icon">attach_file</mat-icon>
              {{ t('api.docs.attachmentsSection') }}
            </div>

            @if (attachments().length) {
              <div class="doc-dlg-attachments">
                @for (att of attachments(); track att.id) {
                  <div class="doc-dlg-attachment">
                    <mat-icon class="doc-dlg-attachment__icon">insert_drive_file</mat-icon>
                    <div class="doc-dlg-attachment__info">
                      <span class="doc-dlg-attachment__name">{{ att.fileName }}</span>
                      <div class="doc-dlg-attachment__meta">
                        @if (att.contractType) {
                          <span class="doc-dlg-chip">{{ att.contractType.name }}</span>
                        }
                        @if (att.attachmentStatus) {
                          <span class="doc-dlg-chip">{{ att.attachmentStatus.name }}</span>
                        }
                        @if (att.attachmentVersion) {
                          <span class="doc-dlg-chip">v{{ att.attachmentVersion }}</span>
                        }
                        <span class="doc-dlg-attachment__size">{{ formatSize(att.fileSize) }}</span>
                      </div>
                      @if (att.description) {
                        <span class="doc-dlg-attachment__desc">{{ att.description }}</span>
                      }
                    </div>
                    @if (canPreview(att.fileName)) {
                      <button mat-icon-button
                              (click)="preview(att)"
                              [attr.aria-label]="t('api.attachment.preview')">
                        <mat-icon>visibility</mat-icon>
                      </button>
                    }
                    <button mat-icon-button
                            [disabled]="downloading() === att.id"
                            (click)="download(att)"
                            [attr.aria-label]="t('api.attachment.download')">
                      @if (downloading() === att.id) {
                        <mat-spinner diameter="20"></mat-spinner>
                      } @else {
                        <mat-icon>download</mat-icon>
                      }
                    </button>
                  </div>
                }
              </div>
            } @else {
              <p class="doc-dlg-empty">{{ t('api.attachment.noAttachments') }}</p>
            }
          </div>
        }

      </mat-dialog-content>

      <!-- ── Actions ──────────────────────────────────────────────────────── -->
      <mat-dialog-actions align="end" class="doc-dlg-actions">
        <button mat-stroked-button (click)="close()">
          <mat-icon>close</mat-icon>
          {{ t('api.action.cancel') }}
        </button>
      </mat-dialog-actions>

    </ng-container>
  `,
  styles: [`
    .doc-dlg-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 20px 20px 16px 24px;
      border-bottom: 1px solid var(--mat-sys-outline-variant);
      background: color-mix(in srgb, var(--mat-sys-primary) 6%, transparent);
    }
    .doc-dlg-header__icon-wrap {
      width: 40px; height: 40px; border-radius: 10px; flex-shrink: 0;
      background: var(--mat-sys-primary);
      display: flex; align-items: center; justify-content: center;
    }
    .doc-dlg-header__icon {
      font-size: 20px !important; width: 20px !important; height: 20px !important; color: #fff;
    }
    .doc-dlg-header__text {
      flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0;
    }
    .doc-dlg-header__code {
      font-size: 10px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase;
      color: var(--mat-sys-primary);
    }
    .doc-dlg-header__name {
      font-size: 15px; font-weight: 600; color: var(--mat-sys-on-surface);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .doc-dlg-close { color: var(--mat-sys-on-surface-variant); flex-shrink: 0; }

    .doc-dlg-body {
      display: flex; flex-direction: column; gap: 0;
      padding: 0 0 8px !important;
      min-width: 520px;
      max-width: 680px;
      max-height: 70vh;
    }
    .doc-dlg-spinner {
      display: flex; justify-content: center; align-items: center;
      padding: 48px;
    }

    .doc-dlg-section {
      padding: 16px 24px;
      border-bottom: 1px solid var(--mat-sys-outline-variant);
      &:last-child { border-bottom: none; }
    }
    .doc-dlg-section__title {
      display: flex; align-items: center; gap: 6px;
      font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em;
      color: var(--mat-sys-on-surface-variant);
      margin-bottom: 12px;
    }
    .doc-dlg-section__icon {
      font-size: 15px !important; width: 15px !important; height: 15px !important;
    }

    .doc-dlg-row {
      display: flex; gap: 12px; padding: 8px 0;
      border-bottom: 1px solid var(--mat-sys-outline-variant);
      align-items: flex-start;
      &:last-child { border-bottom: none; }
    }
    .doc-dlg-row__label {
      font-size: 11px; font-weight: 600; color: var(--mat-sys-on-surface-variant);
      text-transform: uppercase; letter-spacing: .04em;
      min-width: 110px; flex-shrink: 0; padding-top: 2px;
    }
    .doc-dlg-row__value {
      font-size: 13px; color: var(--mat-sys-on-surface); line-height: 1.5;
      word-break: break-all; flex: 1; min-width: 0;
    }
    .doc-dlg-link-btn {
      font-size: 12px !important; height: auto !important; padding: 0 4px !important;
      line-height: 1.4 !important; word-break: break-all; text-align: left !important;
      white-space: normal !important;
      mat-icon { font-size: 14px !important; width: 14px !important; height: 14px !important; vertical-align: middle; }
    }

    .doc-dlg-empty {
      font-size: 13px; color: var(--mat-sys-on-surface-variant);
      font-style: italic; margin: 0; padding: 4px 0;
    }

    .doc-dlg-attachments {
      display: flex; flex-direction: column; gap: 4px;
    }
    .doc-dlg-attachment {
      display: flex; align-items: flex-start; gap: 10px;
      padding: 10px 12px; border-radius: 8px;
      background: var(--mat-sys-surface-container);
      &:hover { background: var(--mat-sys-surface-container-high); }
    }
    .doc-dlg-attachment__icon {
      font-size: 20px !important; width: 20px !important; height: 20px !important;
      color: var(--mat-sys-on-surface-variant); margin-top: 2px; flex-shrink: 0;
    }
    .doc-dlg-attachment__info {
      flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px;
    }
    .doc-dlg-attachment__name {
      font-size: 13px; font-weight: 500; color: var(--mat-sys-on-surface);
      word-break: break-all;
    }
    .doc-dlg-attachment__meta {
      display: flex; flex-wrap: wrap; align-items: center; gap: 6px;
    }
    .doc-dlg-attachment__size {
      font-size: 11px; color: var(--mat-sys-on-surface-variant);
    }
    .doc-dlg-attachment__desc {
      font-size: 12px; color: var(--mat-sys-on-surface-variant); font-style: italic;
    }
    .doc-dlg-chip {
      font-size: 11px; font-weight: 500;
      padding: 2px 8px; border-radius: 20px;
      background: color-mix(in srgb, var(--mat-sys-primary) 10%, transparent);
      color: var(--mat-sys-primary);
      border: 1px solid color-mix(in srgb, var(--mat-sys-primary) 28%, transparent);
      white-space: nowrap;
    }

    .doc-dlg-actions {
      padding: 12px 20px 16px !important; gap: 8px;
    }
  `],
})
export class ApiDocumentationDialog implements OnInit {
  protected readonly data        = inject<ApiDocumentationDialogData>(MAT_DIALOG_DATA);
  private   readonly ref         = inject(MatDialogRef<ApiDocumentationDialog>);
  private   readonly apiService  = inject(ApiService);
  private   readonly ts          = inject(TranslocoService);
  private   readonly matDialog   = inject(MatDialog);

  protected readonly canPreview = canPreview;

  protected readonly lang        = toSignal(this.ts.langChanges$, { initialValue: this.ts.getActiveLang() });
  protected readonly loading     = signal(true);
  protected readonly api         = signal<ApiDto | null>(null);
  protected readonly attachments = signal<ApiAttachmentDto[]>([]);
  protected readonly downloading = signal<string | null>(null);

  ngOnInit(): void {
    forkJoin({
      api:         this.apiService.findById(this.data.apiId),
      attachments: this.apiService.findAttachments(this.data.apiId),
    }).subscribe({
      next: ({ api, attachments }) => {
        this.api.set(api);
        this.attachments.set(attachments);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  protected hasContractInfo(api: ApiDto): boolean {
    return !!(api.contractType || api.contractVersion || api.contractUrl || api.documentationUrl);
  }

  protected openUrl(url: string): void {
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  protected download(attachment: ApiAttachmentDto): void {
    this.downloading.set(attachment.id);
    this.apiService.downloadAttachment(this.data.apiId, attachment.id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = attachment.fileName;
        a.click();
        URL.revokeObjectURL(url);
        this.downloading.set(null);
      },
      error: () => this.downloading.set(null),
    });
  }

  protected preview(attachment: ApiAttachmentDto): void {
    this.matDialog.open(ApiFileViewerDialog, {
      data: { apiId: this.data.apiId, attachment } satisfies ApiFileViewerDialogData,
      width: '95vw',
      maxWidth: '95vw',
      panelClass: 'viewer-fullscreen-panel',
    });
  }

  protected formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  protected close(): void { this.ref.close(); }
}
