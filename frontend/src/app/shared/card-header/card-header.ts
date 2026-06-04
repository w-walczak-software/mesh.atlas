import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'atlas-card-header',
  templateUrl: './card-header.html',
  styleUrl: './card-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
})
export class AtlasCardHeader {
  readonly icon = input.required<string>();
  readonly title = input.required<string>();
  readonly subtitle = input<string>();
  /** When true, renders the subtitle in the warn (orange) color. */
  readonly subtitleWarn = input(false);
  /** Icon background color variant: primary | secondary | tertiary | owners | domains | security | sla | contract | environments */
  readonly iconColor = input<string>();

  protected readonly iconClass = computed(() => {
    const c = this.iconColor();
    return c ? `ch-icon ch-icon--${c}` : 'ch-icon';
  });
}
