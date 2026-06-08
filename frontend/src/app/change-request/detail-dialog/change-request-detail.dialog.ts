import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslocoDirective, TranslocoService, provideTranslocoScope } from '@jsverse/transloco';
import { toSignal } from '@angular/core/rxjs-interop';
import { ChangeRequestService } from '../service/change-request.service';
import {
  ChangeRequestDto,
  ChangeRequestReviewDto,
  ChangeRequestStatus,
  ReviewDecision,
} from '../model/change-request.model';
import { DatePipe } from '@angular/common';

export interface ChangeRequestDetailDialogData {
  id: string;
}

@Component({
  selector: 'app-change-request-detail-dialog',
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    TranslocoDirective,
    DatePipe,
  ],
  providers: [provideTranslocoScope('changeRequest')],
  templateUrl: './change-request-detail.dialog.html',
  styleUrl: './change-request-detail.dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChangeRequestDetailDialog implements OnInit {
  private readonly ref = inject(MatDialogRef<ChangeRequestDetailDialog>);
  readonly data = inject<ChangeRequestDetailDialogData>(MAT_DIALOG_DATA);
  private readonly crService = inject(ChangeRequestService);
  private readonly t = inject(TranslocoService);

  protected readonly lang = toSignal(this.t.langChanges$, { initialValue: this.t.getActiveLang() });
  protected readonly loading = signal(true);
  protected readonly cr = signal<ChangeRequestDto | null>(null);

  ngOnInit(): void {
    this.crService.findById(this.data.id).subscribe({
      next: (dto) => {
        this.cr.set(dto);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  protected statusBadgeStyle(status: ChangeRequestStatus): { background: string; color: string } {
    const map: Record<ChangeRequestStatus, { background: string; color: string }> = {
      SUBMITTED:    { background: '#E3F2FD', color: '#1565C0' },
      UNDER_REVIEW: { background: '#FFF3E0', color: '#E65100' },
      APPROVED:     { background: '#E8F5E9', color: '#2E7D32' },
      REJECTED:     { background: '#FFEBEE', color: '#C62828' },
      DEFERRED:     { background: '#F3E5F5', color: '#6A1B9A' },
      IMPLEMENTED:  { background: '#E0F2F1', color: '#00695C' },
      CANCELLED:    { background: '#F5F5F5', color: '#616161' },
    };
    return map[status] ?? { background: '#EEE', color: '#333' };
  }

  protected decisionIcon(decision: ReviewDecision): string {
    const map: Record<ReviewDecision, string> = {
      APPROVED:            'check_circle',
      REJECTED:            'cancel',
      DEFERRED:            'schedule',
      NEEDS_CLARIFICATION: 'help',
    };
    return map[decision] ?? 'radio_button_unchecked';
  }

  protected decisionStyle(decision: ReviewDecision): { background: string; color: string } {
    const map: Record<ReviewDecision, { background: string; color: string }> = {
      APPROVED:            { background: '#E8F5E9', color: '#2E7D32' },
      REJECTED:            { background: '#FFEBEE', color: '#C62828' },
      DEFERRED:            { background: '#F3E5F5', color: '#6A1B9A' },
      NEEDS_CLARIFICATION: { background: '#FFF3E0', color: '#E65100' },
    };
    return map[decision] ?? { background: '#EEE', color: '#333' };
  }

  protected close(): void {
    this.ref.close();
  }
}
