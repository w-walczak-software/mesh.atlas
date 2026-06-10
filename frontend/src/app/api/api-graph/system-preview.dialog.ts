import { ChangeDetectionStrategy, Component, inject, ViewEncapsulation } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { provideTranslocoScope, TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { toSignal } from '@angular/core/rxjs-interop';
import { SystemNodeData } from './api-graph.model';

export interface SystemPreviewDialogData {
  system: SystemNodeData;
}

export type SystemPreviewDialogResult = 'details' | undefined;

@Component({
  selector: 'app-system-preview-dialog',
  imports: [MatDialogModule, MatButtonModule, MatIconModule, TranslocoDirective, DatePipe],
  providers: [provideTranslocoScope('api')],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <ng-container *transloco="let t; scope: 'api'; lang: lang()">

      <!-- ── Header ───────────────────────────────────────────────────── -->
      <div class="prev-dlg-header" [style.--acc]="data.system.accentColor">
        <div class="prev-dlg-header__icon-wrap">
          <mat-icon class="prev-dlg-header__icon">{{ data.system.icon ?? 'lan' }}</mat-icon>
        </div>
        <div class="prev-dlg-header__text">
          <span class="prev-dlg-header__code">{{ data.system.code }}</span>
          <span class="prev-dlg-header__name">{{ data.system.name }}</span>
        </div>
        <button mat-icon-button class="prev-dlg-close" mat-dialog-close>
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- ── Body ─────────────────────────────────────────────────────── -->
      <mat-dialog-content class="prev-dlg-body">

        @if (data.system.systemTypeName) {
          <div class="prev-dlg-row">
            <span class="prev-dlg-row__label">{{ t('api.preview.type') }}</span>
            <span class="prev-dlg-row__value">{{ data.system.systemTypeName }}</span>
          </div>
        }

        <div class="prev-dlg-row">
          <span class="prev-dlg-row__label">{{ t('api.preview.status') }}</span>
          <span class="prev-dlg-row__value">{{ data.system.statusName || '—' }}</span>
        </div>

        @if (data.system.lifecycleStageName) {
          <div class="prev-dlg-row">
            <span class="prev-dlg-row__label">{{ t('api.preview.lifecycleStage') }}</span>
            <span class="prev-dlg-row__value">{{ data.system.lifecycleStageName }}</span>
          </div>
        }

        @if (data.system.businessCriticalityName) {
          <div class="prev-dlg-row">
            <span class="prev-dlg-row__label">{{ t('api.preview.businessCriticality') }}</span>
            <span class="prev-dlg-row__value">{{ data.system.businessCriticalityName }}</span>
          </div>
        }

        @if (data.system.dataClassificationName) {
          <div class="prev-dlg-row">
            <span class="prev-dlg-row__label">{{ t('api.preview.dataClassification') }}</span>
            <span class="prev-dlg-row__value">{{ data.system.dataClassificationName }}</span>
          </div>
        }

        @if (data.system.architectureStyleName) {
          <div class="prev-dlg-row">
            <span class="prev-dlg-row__label">{{ t('api.preview.architectureStyle') }}</span>
            <span class="prev-dlg-row__value">{{ data.system.architectureStyleName }}</span>
          </div>
        }

        @if (data.system.description) {
          <div class="prev-dlg-row prev-dlg-row--desc">
            <span class="prev-dlg-row__label">{{ t('api.preview.description') }}</span>
            <span class="prev-dlg-row__value">{{ data.system.description }}</span>
          </div>
        }

        <!-- ── Tags ─────────────────────────────────────────────────── -->
        @if (data.system.tags && data.system.tags.length) {
          <div class="prev-dlg-row prev-dlg-row--tags">
            <span class="prev-dlg-row__label">{{ t('api.preview.tags') }}</span>
            <span class="prev-dlg-tags">
              @for (tag of data.system.tags; track tag) {
                <span class="prev-dlg-tag">{{ tag }}</span>
              }
            </span>
          </div>
        }

        <!-- ── Owners ────────────────────────────────────────────────── -->
        <div class="prev-dlg-section">{{ t('api.preview.sectionOwners') }}</div>

        @if (data.system.owners.length) {
          @for (owner of data.system.owners; track owner.email) {
            <div class="prev-dlg-owner">
              <div class="prev-dlg-owner__main">
                @if (owner.roleName) {
                  <span class="prev-dlg-owner__role">{{ owner.roleName }}</span>
                }
                <span class="prev-dlg-owner__name">{{ owner.firstName }} {{ owner.lastName }}</span>
              </div>
              <a class="prev-dlg-owner__email" [href]="'mailto:' + owner.email">{{ owner.email }}</a>
            </div>
          }
        } @else {
          <div class="prev-dlg-empty">{{ t('api.preview.noOwners') }}</div>
        }

        <!-- ── Audit ─────────────────────────────────────────────────── -->
        <div class="prev-dlg-section">{{ t('api.preview.sectionAudit') }}</div>

        <div class="prev-dlg-row">
          <span class="prev-dlg-row__label">{{ t('api.preview.createdAt') }}</span>
          <span class="prev-dlg-row__value">
            {{ data.system.createdAt | date:'yyyy-MM-dd HH:mm' }}
            <span class="prev-dlg-by">{{ t('api.preview.by') }} {{ data.system.createdBy }}</span>
          </span>
        </div>

        <div class="prev-dlg-row">
          <span class="prev-dlg-row__label">{{ t('api.preview.updatedAt') }}</span>
          <span class="prev-dlg-row__value">
            {{ data.system.updatedAt | date:'yyyy-MM-dd HH:mm' }}
            <span class="prev-dlg-by">{{ t('api.preview.by') }} {{ data.system.updatedBy }}</span>
          </span>
        </div>

      </mat-dialog-content>

      <!-- ── Actions ───────────────────────────────────────────────────── -->
      <mat-dialog-actions align="end" class="prev-dlg-actions">
        <button mat-stroked-button (click)="close()">
          <mat-icon>arrow_back</mat-icon>
          {{ t('api.preview.close') }}
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
    }
    .prev-dlg-close { color: var(--mat-sys-on-surface-variant); flex-shrink: 0; }

    .prev-dlg-body {
      display: flex; flex-direction: column; gap: 0;
      padding: 4px 24px 8px !important; max-height: 60vh;
    }
    .prev-dlg-row {
      display: flex; gap: 12px; padding: 10px 0;
      border-bottom: 1px solid var(--mat-sys-outline-variant);
      &:last-child { border-bottom: none; }
    }
    .prev-dlg-row--desc { flex-direction: column; gap: 4px; }
    .prev-dlg-row--tags { align-items: flex-start; }
    .prev-dlg-row__label {
      font-size: 11px; font-weight: 600; color: var(--mat-sys-on-surface-variant);
      text-transform: uppercase; letter-spacing: .04em;
      min-width: 80px; flex-shrink: 0; padding-top: 2px;
    }
    .prev-dlg-row--desc .prev-dlg-row__label { min-width: unset; }
    .prev-dlg-row__value {
      font-size: 13px; color: var(--mat-sys-on-surface); line-height: 1.5;
    }

    .prev-dlg-tags {
      display: flex; flex-wrap: wrap; gap: 4px;
    }
    .prev-dlg-tag {
      display: inline-flex; align-items: center;
      padding: 2px 8px; border-radius: 20px;
      font-size: 11px; font-weight: 500;
      background: color-mix(in srgb, var(--mat-sys-primary) 12%, transparent);
      color: var(--mat-sys-primary);
    }

    .prev-dlg-section {
      padding: 10px 0 4px;
      margin-top: 4px;
      font-size: 10px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase;
      color: var(--mat-sys-on-surface-variant);
      border-top: 1px dashed var(--mat-sys-outline-variant);
    }

    .prev-dlg-owner {
      display: flex; flex-direction: column; gap: 2px;
      padding: 8px 0;
      border-bottom: 1px solid var(--mat-sys-outline-variant);
      &:last-of-type { border-bottom: none; }
    }
    .prev-dlg-owner__main {
      display: flex; align-items: center; gap: 8px;
    }
    .prev-dlg-owner__role {
      font-size: 10px; font-weight: 600; letter-spacing: .04em; text-transform: uppercase;
      padding: 1px 6px; border-radius: 4px;
      background: color-mix(in srgb, var(--mat-sys-secondary) 14%, transparent);
      color: var(--mat-sys-secondary); flex-shrink: 0;
    }
    .prev-dlg-owner__name {
      font-size: 13px; font-weight: 500; color: var(--mat-sys-on-surface);
    }
    .prev-dlg-owner__email {
      font-size: 11px; color: var(--mat-sys-on-surface-variant);
      text-decoration: none;
      &:hover { text-decoration: underline; color: var(--mat-sys-primary); }
    }

    .prev-dlg-empty {
      padding: 8px 0;
      font-size: 12px; color: var(--mat-sys-on-surface-variant);
      font-style: italic;
    }

    .prev-dlg-by {
      display: inline; margin-left: 6px;
      font-size: 11px; color: var(--mat-sys-on-surface-variant);
    }

    .prev-dlg-actions {
      padding: 12px 20px 16px !important; gap: 8px;
    }
  `],
})
export class SystemPreviewDialog {
  protected readonly data = inject<SystemPreviewDialogData>(MAT_DIALOG_DATA);
  private readonly ref  = inject(MatDialogRef<SystemPreviewDialog, SystemPreviewDialogResult>);
  private readonly ts   = inject(TranslocoService);
  protected readonly lang = toSignal(this.ts.langChanges$, { initialValue: this.ts.getActiveLang() });

  protected showDetails(): void { this.ref.close('details'); }
  protected close(): void        { this.ref.close(undefined); }
}
