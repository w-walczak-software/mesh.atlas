import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'atlas-tag-chips',
  templateUrl: './tag-chips.html',
  styleUrl: './tag-chips.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatChipsModule, MatIconModule],
})
export class AtlasTagChips<T = string> {
  readonly tags = input.required<T[]>();
  readonly readonly = input(false);
  readonly removeLabel = input('');
  readonly noTagsLabel = input('');
  readonly displayFn = input<(tag: T) => string>(t => String(t));
  readonly removed = output<T>();
}
