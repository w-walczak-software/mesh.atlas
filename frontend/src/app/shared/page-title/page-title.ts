import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'atlas-page-title',
  templateUrl: './page-title.html',
  styleUrl: './page-title.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AtlasPageTitle {
  readonly title = input.required<string>();
  readonly subtitle = input<string>();
}
