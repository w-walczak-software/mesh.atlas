import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoDirective, TranslocoService, provideTranslocoScope } from '@jsverse/transloco';
import { toSignal } from '@angular/core/rxjs-interop';
import { DictionaryEntryDto } from '../../dictionary/model/dictionary.model';
import { ApiMessagingEndpointDto } from '../model/api.model';
import { ApiService } from '../service/api.service';
import { ToastService } from '@shared/toast/toast.service';

export interface ApiMessagingEndpointDialogData {
  apiId: string | null;
  endpointTypes: DictionaryEntryDto[];
  directions: DictionaryEntryDto[];
  messageFormats: DictionaryEntryDto[];
  endpoint: ApiMessagingEndpointDto | null;
  displayOrder: number;
}

@Component({
  selector: 'app-api-messaging-endpoint-dialog',
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    ReactiveFormsModule,
    TranslocoDirective,
  ],
  providers: [provideTranslocoScope('api')],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-container *transloco="let t; scope: 'api'; lang: lang()">
      <div class="dlg-header">
        <div class="dlg-icon" aria-hidden="true">
          <mat-icon>{{ data.endpoint ? 'edit' : 'add_circle' }}</mat-icon>
        </div>
        <h2 mat-dialog-title>
          {{ data.endpoint ? t('api.messagingEndpoint.edit') : t('api.messagingEndpoint.add') }}
        </h2>
      </div>

      <mat-dialog-content>
        <form [formGroup]="form" class="dlg-form">

          <mat-form-field appearance="outline" class="dlg-field dlg-field--full">
            <mat-label>{{ t('api.messagingEndpoint.name') }}</mat-label>
            <input matInput formControlName="name" [attr.aria-required]="true" />
            @if (form.controls.name.errors?.['required']) {
              <mat-error>{{ t('common.validation.required') }}</mat-error>
            }
            @if (form.controls.name.errors?.['maxlength']) {
              <mat-error>{{ t('common.validation.maxlength', { max: 300 }) }}</mat-error>
            }
          </mat-form-field>

          <div class="dlg-row">
            <mat-form-field appearance="outline" class="dlg-field">
              <mat-label>{{ t('api.messagingEndpoint.endpointType') }}</mat-label>
              <mat-select formControlName="endpointTypeId">
                <mat-option [value]="null">–</mat-option>
                @for (item of data.endpointTypes; track item.id) {
                  <mat-option [value]="item.id">{{ item.name }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" class="dlg-field">
              <mat-label>{{ t('api.messagingEndpoint.direction') }}</mat-label>
              <mat-select formControlName="directionId">
                <mat-option [value]="null">–</mat-option>
                @for (item of data.directions; track item.id) {
                  <mat-option [value]="item.id">{{ item.name }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
          </div>

          <mat-form-field appearance="outline" class="dlg-field dlg-field--full">
            <mat-label>{{ t('api.messagingEndpoint.messageFormat') }}</mat-label>
            <mat-select formControlName="messageFormatId">
              <mat-option [value]="null">–</mat-option>
              @for (item of data.messageFormats; track item.id) {
                <mat-option [value]="item.id">{{ item.name }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="dlg-field dlg-field--full">
            <mat-label>{{ t('api.messagingEndpoint.description') }}</mat-label>
            <textarea matInput formControlName="description" rows="2"></textarea>
            @if (form.controls.description.errors?.['maxlength']) {
              <mat-error>{{ t('common.validation.maxlength', { max: 4000 }) }}</mat-error>
            }
          </mat-form-field>

        </form>
      </mat-dialog-content>

      <mat-dialog-actions align="end" class="dlg-actions">
        <button mat-button type="button" (click)="cancel()">{{ t('api.action.cancel') }}</button>
        <button mat-flat-button type="button" [disabled]="form.invalid || saving()" (click)="save()">
          {{ t('api.action.save') }}
        </button>
      </mat-dialog-actions>
    </ng-container>
  `,
  styles: [`
    .dlg-header {
      display: flex; align-items: center; gap: 12px; padding: 20px 24px 0;
    }
    .dlg-icon {
      display: flex; align-items: center; justify-content: center;
      width: 40px; height: 40px; border-radius: 50%;
      background: var(--mat-sys-primary-container); color: var(--mat-sys-on-primary-container);
      flex-shrink: 0;
    }
    .dlg-form { display: flex; flex-direction: column; gap: 4px; padding-top: 4px; }
    .dlg-row { display: flex; gap: 12px; }
    .dlg-field { flex: 1; }
    .dlg-field--full { width: 100%; }
    .dlg-actions { padding: 8px 24px 16px; }
  `],
})
export class ApiMessagingEndpointDialog {
  protected readonly data = inject<ApiMessagingEndpointDialogData>(MAT_DIALOG_DATA);
  private readonly ref = inject(MatDialogRef<ApiMessagingEndpointDialog>);
  private readonly service = inject(ApiService);
  private readonly toast = inject(ToastService);
  private readonly t = inject(TranslocoService);
  private readonly fb = inject(FormBuilder);

  protected readonly lang = toSignal(this.t.langChanges$, { initialValue: this.t.getActiveLang() });
  protected readonly saving = signal(false);

  protected readonly form = this.fb.group({
    name: [this.data.endpoint?.name ?? '', [Validators.required, Validators.maxLength(300)]],
    endpointTypeId: [this.data.endpoint?.endpointType?.id ?? null as string | null],
    directionId: [this.data.endpoint?.direction?.id ?? null as string | null],
    messageFormatId: [this.data.endpoint?.messageFormat?.id ?? null as string | null],
    description: [this.data.endpoint?.description ?? '', Validators.maxLength(4000)],
  });

  protected save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    const v = this.form.getRawValue();
    const request = {
      name: v.name!,
      endpointTypeId: v.endpointTypeId || null,
      directionId: v.directionId || null,
      messageFormatId: v.messageFormatId || null,
      description: v.description || null,
      displayOrder: this.data.endpoint?.displayOrder ?? this.data.displayOrder,
    };

    if (!this.data.apiId) {
      const endpointType = this.data.endpointTypes.find(e => e.id === v.endpointTypeId);
      const direction = this.data.directions.find(d => d.id === v.directionId);
      const messageFormat = this.data.messageFormats.find(m => m.id === v.messageFormatId);
      const deferred: ApiMessagingEndpointDto = {
        id: this.data.endpoint?.id ?? crypto.randomUUID(),
        name: request.name,
        endpointType: endpointType ? { id: endpointType.id, code: endpointType.code, name: endpointType.name } : null,
        direction: direction ? { id: direction.id, code: direction.code, name: direction.name } : null,
        messageFormat: messageFormat ? { id: messageFormat.id, code: messageFormat.code, name: messageFormat.name } : null,
        description: request.description,
        displayOrder: request.displayOrder,
        active: true,
        createdAt: '',
        createdBy: '',
      };
      this.saving.set(false);
      this.ref.close(deferred);
      return;
    }

    const obs = this.data.endpoint
      ? this.service.updateMessagingEndpoint(this.data.apiId, this.data.endpoint.id, request)
      : this.service.createMessagingEndpoint(this.data.apiId, request);

    obs.subscribe({
      next: (result) => {
        this.saving.set(false);
        this.ref.close(result);
      },
      error: () => {
        this.saving.set(false);
        this.toast.error(this.t.translate('common.error.unexpected'));
      },
    });
  }

  protected cancel(): void {
    this.ref.close();
  }
}
