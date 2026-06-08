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
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoDirective, TranslocoService, provideTranslocoScope } from '@jsverse/transloco';
import { ToastService } from '@shared/toast/toast.service';
import { ChangeRequestService } from '../service/change-request.service';
import { ChangeRequestSummaryDto, ReviewDecision } from '../model/change-request.model';

export interface ReviewDialogData {
  changeRequest: ChangeRequestSummaryDto;
  mode: 'review' | 'implement';
}

@Component({
  selector: 'app-review-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    TranslocoDirective,
  ],
  providers: [provideTranslocoScope('changeRequest')],
  templateUrl: './review.dialog.html',
  styleUrl: './review.dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewDialog {
  private readonly dialogRef = inject(MatDialogRef<ReviewDialog>);
  readonly data = inject<ReviewDialogData>(MAT_DIALOG_DATA);
  private readonly crService = inject(ChangeRequestService);
  private readonly toast = inject(ToastService);
  private readonly t = inject(TranslocoService);
  private readonly fb = inject(FormBuilder);

  protected readonly saving = signal(false);

  protected readonly decisions: ReviewDecision[] =
    this.data.mode === 'review'
      ? ['APPROVED', 'REJECTED', 'DEFERRED', 'NEEDS_CLARIFICATION']
      : ['APPROVED'];

  protected readonly form = this.fb.group({
    decision: [
      this.data.mode === 'implement' ? ('APPROVED' as ReviewDecision) : (null as ReviewDecision | null),
      this.data.mode === 'review' ? Validators.required : [],
    ],
    comment: ['', Validators.maxLength(4000)],
    plannedImplementationDate: [null as Date | null],
    plannedVersion: ['', Validators.maxLength(50)],
    implementedVersion: ['', Validators.maxLength(50)],
  });

  protected get showPlannedFields(): boolean {
    const d = this.form.value.decision;
    return d === 'APPROVED' || d === 'DEFERRED';
  }

  protected submit(): void {
    if (this.form.invalid) return;
    this.saving.set(true);

    const v = this.form.getRawValue();
    const obs =
      this.data.mode === 'implement'
        ? this.crService.markImplemented(this.data.changeRequest.id, {
            implementedVersion: v.implementedVersion || null,
            note: v.comment || null,
          })
        : this.crService.review(this.data.changeRequest.id, {
            decision: v.decision!,
            comment: v.comment || null,
            plannedImplementationDate: v.plannedImplementationDate
              ? this.formatDate(v.plannedImplementationDate)
              : null,
            plannedVersion: v.plannedVersion || null,
          });

    obs.subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success(this.t.translate('changeRequest.toast.reviewSaved'));
        this.dialogRef.close(true);
      },
      error: () => this.saving.set(false),
    });
  }

  protected close(): void {
    this.dialogRef.close(false);
  }

  private formatDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
