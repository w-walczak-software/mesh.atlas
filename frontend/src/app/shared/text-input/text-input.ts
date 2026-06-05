import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, input, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
export class AtlasTextInput implements OnInit {
  private readonly container = inject(ControlContainer, { optional: true, skipSelf: true });
  private readonly destroyRef = inject(DestroyRef);
  private readonly _tick = signal(0);

  readonly label = input.required<string>();
  readonly controlName = input<string>();
  readonly control = input<AbstractControl | null>();
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
  readonly errorMessages = input<Record<string, string>>({});

  ngOnInit(): void {
    const name = this.controlName();
    const ctrl = name ? this.container?.control?.get(name) : this.control();
    ctrl?.statusChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this._tick.update(n => n + 1));
  }

  protected readonly errorsToShow = computed((): string[] => {
    this._tick();
    const msgs = this.errorMessages();
    const entries = Object.entries(msgs);
    if (!entries.length) return [];
    const name = this.controlName();
    const ctrl = name ? this.container?.control?.get(name) : this.control();
    const errors = ctrl?.errors;
    if (!errors) return [];
    const seen = new Set<string>();
    return entries.reduce<string[]>((acc, [key, msg]) => {
      if (key in errors && !seen.has(msg)) { seen.add(msg); acc.push(msg); }
      return acc;
    }, []);
  });
}
