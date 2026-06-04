import { ChangeDetectionStrategy, Component, inject, input, OnInit, signal } from '@angular/core';
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

  readonly label = input.required<string>();
  readonly controlName = input.required<string>();
  readonly dictionaryCode = input.required<string>();
  /** Label for the leading null option (e.g. '–'). If null, no null option is rendered. */
  readonly nullOptionLabel = input<string | null>(null);
  readonly multiple = input(false);
  readonly ariaRequired = input(false);
  readonly subscriptSizing = input<'fixed' | 'dynamic'>('fixed');

  protected readonly entries = signal<DictionaryEntryDto[]>([]);

  ngOnInit(): void {
    this.entryService.findByTypeCode(this.dictionaryCode()).subscribe(e => this.entries.set(e));
  }
}
