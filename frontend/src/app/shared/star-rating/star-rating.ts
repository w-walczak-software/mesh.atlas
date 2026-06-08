import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-star-rating',
  imports: [MatIconModule, MatTooltipModule],
  templateUrl: './star-rating.html',
  styleUrl: './star-rating.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StarRating {
  /** Current score value (1-5). Null means no rating. */
  readonly value = input<number | null>(null);
  /** When true, hovering/clicking the stars emits a score. */
  readonly interactive = input(false);
  /** Size variant */
  readonly size = input<'sm' | 'md' | 'lg'>('md');

  readonly rateChange = output<number>();

  protected readonly hovered = signal<number | null>(null);

  protected readonly stars = [1, 2, 3, 4, 5];

  protected readonly displayScore = computed(() => this.hovered() ?? this.value());

  protected starIcon(star: number): string {
    const score = this.displayScore();
    if (score === null) return 'star_border';
    if (star <= Math.floor(score)) return 'star';
    if (star === Math.ceil(score) && score % 1 >= 0.5) return 'star_half';
    return 'star_border';
  }

  protected onHover(star: number): void {
    if (this.interactive()) this.hovered.set(star);
  }

  protected onLeave(): void {
    if (this.interactive()) this.hovered.set(null);
  }

  protected onClick(star: number): void {
    if (this.interactive()) this.rateChange.emit(star);
  }
}
