import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { TranslocoDirective, TranslocoService, provideTranslocoScope } from '@jsverse/transloco';
import { toSignal } from '@angular/core/rxjs-interop';
import { ApiGraphEdgeDto } from '../model/api.model';

export interface ApiSelectDialogData {
  apis: ApiGraphEdgeDto[];
}

@Component({
  selector: 'app-api-select-dialog',
  imports: [MatDialogModule, MatButtonModule, MatIconModule, TranslocoDirective],
  providers: [provideTranslocoScope('api')],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-container *transloco="let t; scope: 'api'; lang: lang()">
      <div class="dlg-header">
        <div class="dlg-icon" style="background: var(--mat-sys-secondary-container); color: var(--mat-sys-on-secondary-container);">
          <mat-icon>api</mat-icon>
        </div>
        <h2 class="mat-mdc-dialog-title">{{ t('api.graph.selectApi') }}</h2>
        <button mat-icon-button class="dlg-close" mat-dialog-close>
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-dialog-content class="dlg-body api-select-list">
        <p class="api-select-list__hint">{{ t('api.graph.selectApiHint') }}</p>
        @for (api of data.apis; track api.id) {
          <button class="api-select-item" (click)="select(api.id)" type="button">
            <div class="api-select-item__main">
              <span class="api-select-item__code">{{ api.code }}</span>
              <span class="api-select-item__name">{{ api.name }}</span>
            </div>
            <div class="api-select-item__meta">
              @if (api.transportLayer) {
                <span class="api-select-item__transport">
                  @if (api.transportLayer.icon) {
                    <mat-icon class="api-select-item__transport-icon">{{ api.transportLayer.icon }}</mat-icon>
                  }
                  {{ api.transportLayer.name }}
                </span>
              }
              <span class="api-select-item__status">{{ api.status.name }}</span>
            </div>
            <mat-icon class="api-select-item__arrow">chevron_right</mat-icon>
          </button>
        }
      </mat-dialog-content>

      <mat-dialog-actions class="dlg-actions">
        <button mat-stroked-button mat-dialog-close>{{ t('api.action.cancel') }}</button>
      </mat-dialog-actions>
    </ng-container>
  `,
  styles: [`
    .api-select-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 12px 24px 16px;
      max-height: 60vh;
      overflow-y: auto;
    }

    .api-select-list__hint {
      margin: 0 0 8px;
      font-size: 13px;
      color: var(--mat-sys-on-surface-variant);
    }

    .api-select-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 14px;
      border-radius: 10px;
      border: 1px solid var(--mat-sys-outline-variant);
      background: var(--mat-sys-surface-container-low);
      cursor: pointer;
      text-align: left;
      width: 100%;
      transition: background 140ms ease, border-color 140ms ease;

      &:hover {
        background: var(--mat-sys-surface-container);
        border-color: var(--mat-sys-primary);
      }
    }

    .api-select-item__main {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .api-select-item__code {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: .04em;
      text-transform: uppercase;
      color: var(--mat-sys-primary);
    }

    .api-select-item__name {
      font-size: 13px;
      font-weight: 500;
      color: var(--mat-sys-on-surface);
    }

    .api-select-item__meta {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 3px;
    }

    .api-select-item__transport {
      display: flex;
      align-items: center;
      gap: 3px;
      font-size: 11px;
      color: var(--mat-sys-on-surface-variant);
    }

    .api-select-item__transport-icon {
      font-size: 12px;
      width: 12px;
      height: 12px;
    }

    .api-select-item__status {
      font-size: 11px;
      color: var(--mat-sys-on-surface-variant);
    }

    .api-select-item__arrow {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: var(--mat-sys-on-surface-variant);
      flex-shrink: 0;
    }
  `],
})
export class ApiSelectDialog {
  protected readonly data = inject<ApiSelectDialogData>(MAT_DIALOG_DATA);
  private readonly ref = inject(MatDialogRef<ApiSelectDialog>);
  private readonly t = inject(TranslocoService);

  protected readonly lang = toSignal(this.t.langChanges$, { initialValue: this.t.getActiveLang() });

  protected select(apiId: string): void {
    this.ref.close(apiId);
  }
}
