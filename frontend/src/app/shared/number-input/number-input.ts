import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { ControlContainer, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'atlas-number-input',
  templateUrl: './number-input.html',
  styleUrl: './number-input.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule],
  viewProviders: [{
    provide: ControlContainer,
    useFactory: () => inject(ControlContainer, { optional: true, skipSelf: true }),
  }],
})
export class AtlasNumberInput {
  readonly label = input.required<string>();
  readonly controlName = input.required<string>();
  /** Text appended after the input (matTextSuffix), e.g. "ms", "%". */
  readonly suffix = input<string>();
  readonly min = input<number>();
  readonly max = input<number>();
  readonly step = input<number>();
  readonly ariaRequired = input(false);
  readonly subscriptSizing = input<'fixed' | 'dynamic'>('fixed');
}
