import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, input, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ControlContainer, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { DictionaryEntryDto } from '../../dictionary/model/dictionary.model';
import { DictionaryEntryService } from '../../dictionary/service/dictionary-entry.service';

@Component({
  selector: 'atlas-select-dictionary',
  templateUrl: './select-dictionary.html',
  styleUrl: './select.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatSelectModule],
  viewProviders: [{
    provide: ControlContainer,
    useFactory: () => inject(ControlContainer, { optional: true, skipSelf: true }),
  }],
})
export class AtlasSelectDictionary implements OnInit {
  private readonly entryService = inject(DictionaryEntryService);
  private readonly container = inject(ControlContainer, { optional: true, skipSelf: true });
  private readonly destroyRef = inject(DestroyRef);
  private readonly _tick = signal(0);

  readonly label = input.required<string>();
  readonly controlName = input.required<string>();
  readonly dictionaryCode = input.required<string>();
  readonly nullOptionLabel = input<string | null>(null);
  readonly multiple = input(false);
  readonly ariaRequired = input(false);
  readonly subscriptSizing = input<'fixed' | 'dynamic'>('fixed');
  readonly errorMessages = input<Record<string, string>>({});

  protected readonly entries = signal<DictionaryEntryDto[]>([]);

  ngOnInit(): void {
    this.entryService.findByTypeCode(this.dictionaryCode()).subscribe(e => this.entries.set(e));
    this.container?.control?.get(this.controlName())?.statusChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this._tick.update(n => n + 1));
  }

  protected readonly errorsToShow = computed((): string[] => {
    this._tick();
    const msgs = this.errorMessages();
    const entries = Object.entries(msgs);
    if (!entries.length) return [];
    const errors = this.container?.control?.get(this.controlName())?.errors;
    if (!errors) return [];
    const seen = new Set<string>();
    return entries.reduce<string[]>((acc, [key, msg]) => {
      if (key in errors && !seen.has(msg)) { seen.add(msg); acc.push(msg); }
      return acc;
    }, []);
  });
}
