import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { MatExpansionModule, MatExpansionPanel } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';

/**
 * Wraps mat-expansion-panel-header + mat-panel-title into a single reusable element.
 *
 * viewProviders re-exposes the parent MatExpansionPanel into this component's view,
 * so that MatExpansionPanelHeader (rendered here) can inject it via @Host().
 */
@Component({
  selector: 'atlas-panel-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatExpansionModule, MatIconModule],
  viewProviders: [{
    provide: MatExpansionPanel,
    useFactory: () => inject(MatExpansionPanel, { skipSelf: true }),
  }],
  template: `
    <mat-expansion-panel-header>
      <mat-panel-title>
        <mat-icon>{{ icon() }}</mat-icon>
        {{ title() }}
      </mat-panel-title>
    </mat-expansion-panel-header>
  `,
  styles: [':host { display: contents; }'],
})
export class AtlasPanelHeader {
  readonly title = input.required<string>();
  readonly icon = input.required<string>();
}
