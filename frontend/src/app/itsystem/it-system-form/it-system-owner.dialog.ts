import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { TranslocoDirective, TranslocoService, provideTranslocoScope } from '@jsverse/transloco';
import { toSignal } from '@angular/core/rxjs-interop';
import { DictionaryEntryDto } from '../../dictionary/model/dictionary.model';
import { ItSystemOwnerDto } from '../model/itsystem.model';
import { ItSystemService } from '../service/itsystem.service';
import { ToastService } from '@shared/toast/toast.service';

export interface ItSystemOwnerDialogData {
  systemId: string | null;
  roles: DictionaryEntryDto[];
  owner: ItSystemOwnerDto | null;
}

@Component({
  selector: 'app-it-system-owner-dialog',
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatDatepickerModule,
    ReactiveFormsModule,
    TranslocoDirective,
  ],
  providers: [provideTranslocoScope('itsystem')],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-container *transloco="let t; scope: 'itsystem'; lang: lang()">
      <div class="dlg-header">
        <div class="dlg-icon" aria-hidden="true">
          <mat-icon>{{ data.owner ? 'edit' : 'person_add' }}</mat-icon>
        </div>
        <h2 mat-dialog-title>
          {{ data.owner ? t('itsystem.owner.edit') : t('itsystem.owner.add') }}
        </h2>
      </div>

      <mat-dialog-content>
        <form [formGroup]="form" class="dlg-form">
          <div class="dlg-row">
            <mat-form-field appearance="outline" class="dlg-field">
              <mat-label>{{ t('itsystem.owner.firstName') }}</mat-label>
              <input matInput formControlName="firstName" [attr.aria-required]="true" />
              @if (form.controls.firstName.errors?.['required']) {
                <mat-error>{{ t('common.validation.required') }}</mat-error>
              }
            </mat-form-field>
            <mat-form-field appearance="outline" class="dlg-field">
              <mat-label>{{ t('itsystem.owner.lastName') }}</mat-label>
              <input matInput formControlName="lastName" [attr.aria-required]="true" />
              @if (form.controls.lastName.errors?.['required']) {
                <mat-error>{{ t('common.validation.required') }}</mat-error>
              }
            </mat-form-field>
          </div>

          <mat-form-field appearance="outline" class="dlg-field dlg-field--full">
            <mat-label>{{ t('itsystem.owner.email') }}</mat-label>
            <input matInput formControlName="email" type="email" [attr.aria-required]="true" />
            @if (form.controls.email.errors?.['required']) {
              <mat-error>{{ t('common.validation.required') }}</mat-error>
            }
            @if (form.controls.email.errors?.['email']) {
              <mat-error>{{ t('itsystem.error.invalidEmail') }}</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" class="dlg-field dlg-field--full">
            <mat-label>{{ t('itsystem.owner.role') }}</mat-label>
            <mat-select formControlName="roleId" [attr.aria-required]="true">
              @for (role of data.roles; track role.id) {
                <mat-option [value]="role.id">{{ role.name }}</mat-option>
              }
            </mat-select>
            @if (form.controls.roleId.errors?.['required']) {
              <mat-error>{{ t('common.validation.required') }}</mat-error>
            }
          </mat-form-field>

          <div class="dlg-row">
            <mat-form-field appearance="outline" class="dlg-field">
              <mat-label>{{ t('itsystem.owner.validFrom') }}</mat-label>
              <input matInput [matDatepicker]="pickerFrom" formControlName="validFrom" [attr.aria-required]="true" />
              <mat-datepicker-toggle matIconSuffix [for]="pickerFrom" />
              <mat-datepicker #pickerFrom />
              @if (form.controls.validFrom.errors?.['required']) {
                <mat-error>{{ t('common.validation.required') }}</mat-error>
              }
            </mat-form-field>
            <mat-form-field appearance="outline" class="dlg-field">
              <mat-label>{{ t('itsystem.owner.validTo') }}</mat-label>
              <input matInput [matDatepicker]="pickerTo" formControlName="validTo" />
              <mat-datepicker-toggle matIconSuffix [for]="pickerTo" />
              <mat-datepicker #pickerTo />
            </mat-form-field>
          </div>
        </form>
      </mat-dialog-content>

      <mat-dialog-actions align="end" class="dlg-actions">
        <button mat-button type="button" (click)="cancel()">{{ t('itsystem.action.cancel') }}</button>
        <button mat-flat-button type="button" [disabled]="form.invalid || saving()" (click)="save()">
          {{ t('itsystem.action.save') }}
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
export class ItSystemOwnerDialog {
  protected readonly data = inject<ItSystemOwnerDialogData>(MAT_DIALOG_DATA);
  private readonly ref = inject(MatDialogRef<ItSystemOwnerDialog>);
  private readonly service = inject(ItSystemService);
  private readonly toast = inject(ToastService);
  private readonly t = inject(TranslocoService);
  private readonly fb = inject(FormBuilder);

  protected readonly lang = toSignal(this.t.langChanges$, { initialValue: this.t.getActiveLang() });
  protected readonly saving = signal(false);

  protected readonly form = this.fb.group({
    firstName: [this.data.owner?.firstName ?? '', [Validators.required, Validators.maxLength(100)]],
    lastName: [this.data.owner?.lastName ?? '', [Validators.required, Validators.maxLength(100)]],
    email: [this.data.owner?.email ?? '', [Validators.required, Validators.email, Validators.maxLength(200)]],
    roleId: [this.data.owner?.role?.id ?? null as string | null, Validators.required],
    validFrom: [this.data.owner?.validFrom ? new Date(this.data.owner.validFrom) : null as Date | null, Validators.required],
    validTo: [this.data.owner?.validTo ? new Date(this.data.owner.validTo) : null as Date | null],
  });

  protected save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    const v = this.form.getRawValue();
    const request = {
      roleId: v.roleId!,
      firstName: v.firstName!,
      lastName: v.lastName!,
      email: v.email!,
      validFrom: this.formatDate(v.validFrom!),
      validTo: v.validTo ? this.formatDate(v.validTo) : null,
    };

    if (!this.data.systemId) {
      const role = this.data.roles.find(r => r.id === v.roleId);
      const deferred: ItSystemOwnerDto = {
        id: this.data.owner?.id ?? crypto.randomUUID(),
        role: role ? { id: role.id, code: (role as any).code ?? '', name: role.name } : null as any,
        firstName: request.firstName,
        lastName: request.lastName,
        email: request.email,
        validFrom: request.validFrom,
        validTo: request.validTo,
        createdAt: '', createdBy: '', updatedAt: '', updatedBy: '',
      };
      this.saving.set(false);
      this.ref.close(deferred);
      return;
    }

    const obs = this.data.owner
      ? this.service.updateOwner(this.data.systemId, this.data.owner.id, request)
      : this.service.createOwner(this.data.systemId, request);

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

  private formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
