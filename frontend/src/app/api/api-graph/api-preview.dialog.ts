import { ChangeDetectionStrategy, Component, inject, ViewEncapsulation } from '@angular/core';
import { DatePipe } from '@angular/common';
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
  imports: [MatDialogModule, MatButtonModule, MatIconModule, TranslocoDirective, DatePipe],
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

        <!-- ── Basic ── -->
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

        @if (data.api.dataFlowDirection) {
          <div class="prev-dlg-row">
            <span class="prev-dlg-row__label">{{ t('api.preview.dataFlowDirection') }}</span>
            <span class="prev-dlg-row__value">{{ data.api.dataFlowDirection.name }}</span>
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

        <!-- ── Systems ── -->
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

        <!-- ── Tags ── -->
        @if (data.api.tags && data.api.tags.length) {
          <div class="prev-dlg-row prev-dlg-row--chips">
            <span class="prev-dlg-row__label">{{ t('api.preview.tags') }}</span>
            <span class="prev-dlg-row__chips">
              @for (tag of data.api.tags; track tag) {
                <span class="prev-dlg-chip prev-dlg-chip--tag">{{ tag }}</span>
              }
            </span>
          </div>
        }

        <!-- ── Protocol & Security ── -->
        @if (data.api.protocol || data.api.authenticationMethod || data.api.securityPolicy || data.api.integrationPattern || data.api.messageFormat) {
          <div class="prev-dlg-section">{{ t('api.preview.sectionProtocolSecurity') }}</div>

          @if (data.api.protocol) {
            <div class="prev-dlg-row">
              <span class="prev-dlg-row__label">{{ t('api.preview.protocol') }}</span>
              <span class="prev-dlg-row__value">{{ data.api.protocol.name }}</span>
            </div>
          }
          @if (data.api.authenticationMethod) {
            <div class="prev-dlg-row">
              <span class="prev-dlg-row__label">{{ t('api.preview.authMethod') }}</span>
              <span class="prev-dlg-row__value">{{ data.api.authenticationMethod.name }}</span>
            </div>
          }
          @if (data.api.securityPolicy) {
            <div class="prev-dlg-row">
              <span class="prev-dlg-row__label">{{ t('api.preview.securityPolicy') }}</span>
              <span class="prev-dlg-row__value">{{ data.api.securityPolicy.name }}</span>
            </div>
          }
          @if (data.api.integrationPattern) {
            <div class="prev-dlg-row">
              <span class="prev-dlg-row__label">{{ t('api.preview.integrationPattern') }}</span>
              <span class="prev-dlg-row__value">{{ data.api.integrationPattern.name }}</span>
            </div>
          }
          @if (data.api.messageFormat) {
            <div class="prev-dlg-row">
              <span class="prev-dlg-row__label">{{ t('api.preview.messageFormat') }}</span>
              <span class="prev-dlg-row__value">{{ data.api.messageFormat.name }}</span>
            </div>
          }
        }

        <!-- ── Environments & Data Domains ── -->
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

        <!-- ── SLA ── -->
        @if (data.api.slaResponseTimeMs !== null || data.api.slaUptimePct !== null || data.api.slaTier || data.api.slaDescription) {
          <div class="prev-dlg-section">{{ t('api.preview.sectionSla') }}</div>

          @if (data.api.slaResponseTimeMs !== null) {
            <div class="prev-dlg-row">
              <span class="prev-dlg-row__label">{{ t('api.preview.slaResponseTimeMs') }}</span>
              <span class="prev-dlg-row__value">{{ data.api.slaResponseTimeMs }} ms</span>
            </div>
          }
          @if (data.api.slaUptimePct !== null) {
            <div class="prev-dlg-row">
              <span class="prev-dlg-row__label">{{ t('api.preview.slaUptimePct') }}</span>
              <span class="prev-dlg-row__value">{{ data.api.slaUptimePct }}%</span>
            </div>
          }
          @if (data.api.slaTier) {
            <div class="prev-dlg-row">
              <span class="prev-dlg-row__label">{{ t('api.preview.slaTier') }}</span>
              <span class="prev-dlg-row__value">{{ data.api.slaTier.name }}</span>
            </div>
          }
          @if (data.api.slaDescription) {
            <div class="prev-dlg-row prev-dlg-row--desc">
              <span class="prev-dlg-row__label">{{ t('api.preview.slaDescription') }}</span>
              <span class="prev-dlg-row__value">{{ data.api.slaDescription }}</span>
            </div>
          }
        }

        <!-- ── Owners ── -->
        <div class="prev-dlg-section">{{ t('api.preview.sectionOwners') }}</div>

        @if (data.api.owners.length) {
          @for (owner of data.api.owners; track owner.email) {
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

        <!-- ── Audit ── -->
        <div class="prev-dlg-section">{{ t('api.preview.sectionAudit') }}</div>

        <div class="prev-dlg-row">
          <span class="prev-dlg-row__label">{{ t('api.preview.createdAt') }}</span>
          <span class="prev-dlg-row__value">
            {{ data.api.createdAt | date:'yyyy-MM-dd HH:mm' }}
            <span class="prev-dlg-by">{{ t('api.preview.by') }} {{ data.api.createdBy }}</span>
          </span>
        </div>

        <div class="prev-dlg-row">
          <span class="prev-dlg-row__label">{{ t('api.preview.updatedAt') }}</span>
          <span class="prev-dlg-row__value">
            {{ data.api.updatedAt | date:'yyyy-MM-dd HH:mm' }}
            <span class="prev-dlg-by">{{ t('api.preview.by') }} {{ data.api.updatedBy }}</span>
          </span>
        </div>

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
      padding: 4px 24px 8px !important; max-height: 65vh;
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
    .prev-dlg-chip--tag {
      background: color-mix(in srgb, var(--mat-sys-tertiary, #6366f1) 12%, transparent);
      color: var(--mat-sys-tertiary, #6366f1);
      border-color: color-mix(in srgb, var(--mat-sys-tertiary, #6366f1) 30%, transparent);
    }
    .prev-dlg-row__label {
      font-size: 11px; font-weight: 600; color: var(--mat-sys-on-surface-variant);
      text-transform: uppercase; letter-spacing: .04em;
      min-width: 100px; flex-shrink: 0; padding-top: 1px;
    }
    .prev-dlg-row--desc .prev-dlg-row__label  { min-width: unset; }
    .prev-dlg-row--chips .prev-dlg-row__label { padding-top: 3px; }
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
