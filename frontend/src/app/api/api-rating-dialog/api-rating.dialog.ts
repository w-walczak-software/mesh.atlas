import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoDirective, TranslocoService, provideTranslocoScope } from '@jsverse/transloco';
import { StarRating } from '@shared/star-rating/star-rating';
import { ToastService } from '@shared/toast/toast.service';
import { ApiService } from '../service/api.service';
import { ApiRatingSummaryDto } from '../model/api.model';

export interface ApiRatingDialogData {
  apiId: string;
  apiName: string;
  myRating: number | null;
  summary: ApiRatingSummaryDto | null;
}

@Component({
  selector: 'app-api-rating-dialog',
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    TranslocoDirective,
    StarRating,
  ],
  providers: [provideTranslocoScope('api')],
  templateUrl: './api-rating.dialog.html',
  styleUrl: './api-rating.dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApiRatingDialog implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<ApiRatingDialog>);
  readonly data = inject<ApiRatingDialogData>(MAT_DIALOG_DATA);
  private readonly apiService = inject(ApiService);
  private readonly toast = inject(ToastService);
  private readonly t = inject(TranslocoService);

  protected readonly selectedScore = signal<number | null>(this.data.myRating);
  protected readonly saving = signal(false);

  ngOnInit(): void {
    if (this.data.myRating === null) {
      this.apiService.getMyRating(this.data.apiId).subscribe({
        next: (dto) => {
          if (this.selectedScore() === null) {
            this.selectedScore.set(dto?.score ?? null);
          }
        },
      });
    }
  }

  protected onRate(score: number): void {
    this.selectedScore.set(score);
  }

  protected save(): void {
    const score = this.selectedScore();
    if (score === null) return;
    this.saving.set(true);
    this.apiService.rateApi(this.data.apiId, score).subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success(this.t.translate('api.rating.toastSaved'));
        this.dialogRef.close(true);
      },
      error: () => this.saving.set(false),
    });
  }

  protected remove(): void {
    this.saving.set(true);
    this.apiService.deleteMyRating(this.data.apiId).subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success(this.t.translate('api.rating.toastRemoved'));
        this.dialogRef.close(true);
      },
      error: () => this.saving.set(false),
    });
  }

  protected close(): void {
    this.dialogRef.close(false);
  }

  protected labelFor(score: number): string {
    return this.t.translate(`api.rating.label${score}`);
  }
}
