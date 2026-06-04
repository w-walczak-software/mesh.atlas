import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import {
  AbstractControl,
  ControlContainer,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { SelectOption } from './select.models';

@Component({
  selector: 'atlas-select',
  templateUrl: './select.html',
  styleUrl: './select.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatSelectModule],
  viewProviders: [{
    provide: ControlContainer,
    useFactory: () => inject(ControlContainer, { optional: true, skipSelf: true }),
  }],
})
export class AtlasSelect {
  readonly label = input.required<string>();
  /** Control name string — for use inside a formGroup. */
  readonly controlName = input<string>();
  /** Standalone FormControl — for use outside a formGroup. */
  readonly control = input<AbstractControl | null>();
  readonly options = input<SelectOption[]>([]);
  /** If set, renders a leading option with this label and nullOptionValue as its value. */
  readonly nullOptionLabel = input<string | null>(null);
  /** Value used for the null option (default null, use '' for audit-log string filters). */
  readonly nullOptionValue = input<unknown>(null);
  readonly multiple = input(false);
  readonly ariaRequired = input(false);
  readonly subscriptSizing = input<'fixed' | 'dynamic'>('fixed');
}
