import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoDirective, TranslocoService, provideTranslocoScope } from '@jsverse/transloco';
import { ToastService } from '@shared/toast/toast.service';
import { AtlasSelectDictionary } from '@shared/select/select-dictionary';
import { ChangeRequestService } from '../service/change-request.service';

export interface ChangeRequestFormDialogData {
  apiId: string;
  apiName: string;
}

@Component({
  selector: 'app-change-request-form-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    TranslocoDirective,
    AtlasSelectDictionary,
  ],
  providers: [provideTranslocoScope('changeRequest')],
  templateUrl: './change-request-form.dialog.html',
  styleUrl: './change-request-form.dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChangeRequestFormDialog {
  private readonly dialogRef = inject(MatDialogRef<ChangeRequestFormDialog>);
  readonly data = inject<ChangeRequestFormDialogData>(MAT_DIALOG_DATA);
  private readonly crService = inject(ChangeRequestService);
  private readonly toast = inject(ToastService);
  private readonly t = inject(TranslocoService);
  private readonly fb = inject(FormBuilder);

  protected readonly saving = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(255)]],
    description: ['', [Validators.required, Validators.maxLength(8000)]],
    changeTypeId: ['', Validators.required],
    priorityId: ['', Validators.required],
  });

  protected submit(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    const v = this.form.getRawValue();
    this.crService
      .submit({
        apiId: this.data.apiId,
        title: v.title,
        description: v.description,
        changeTypeId: v.changeTypeId,
        priorityId: v.priorityId,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.toast.success(this.t.translate('changeRequest.toast.submitted'));
          this.dialogRef.close(true);
        },
        error: () => this.saving.set(false),
      });
  }

  protected close(): void {
    this.dialogRef.close(false);
  }
}
