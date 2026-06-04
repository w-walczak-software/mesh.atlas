import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import {
  AbstractControl,
  ControlContainer,
  FormGroupDirective,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'atlas-text-input',
  templateUrl: './text-input.html',
  styleUrl: './text-input.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatIconModule],
  viewProviders: [{
    provide: ControlContainer,
    useFactory: () => inject(ControlContainer, { optional: true, skipSelf: true }),
  }],
})
export class AtlasTextInput {
  readonly label = input.required<string>();
  /** For reactive forms inside a formGroup — pass the control name as a string. */
  readonly controlName = input<string>();
  /** For standalone reactive controls — pass the FormControl instance directly. */
  readonly control = input<AbstractControl | null>();
  /** Material icon name. */
  readonly icon = input<string>();
  readonly iconPosition = input<'prefix' | 'suffix'>('suffix');
  readonly type = input('text');
  readonly placeholder = input('');
  readonly hint = input<string>();
  readonly autocomplete = input<string>();
  readonly ariaRequired = input(false);
  readonly ariaLabel = input<string>();
  readonly subscriptSizing = input<'fixed' | 'dynamic'>('fixed');
  readonly min = input<string>();
  readonly max = input<string>();
}
