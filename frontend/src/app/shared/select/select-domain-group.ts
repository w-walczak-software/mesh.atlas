import { ChangeDetectionStrategy, Component, inject, input, OnInit, output, signal } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { DictionaryEntryDto } from '../../dictionary/model/dictionary.model';
import { DictionaryEntryService } from '../../dictionary/service/dictionary-entry.service';

/**
 * Self-contained domain group filter select.
 * Uses [value]/(selectionChange) pattern — NOT formControlName.
 * Supports an optional "__NO_GROUP__" sentinel option.
 */
@Component({
  selector: 'atlas-select-domain-group',
  templateUrl: './select-domain-group.html',
  styleUrl: './select.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatFormFieldModule, MatSelectModule],
})
export class AtlasSelectDomainGroup implements OnInit {
  private readonly entryService = inject(DictionaryEntryService);

  readonly label = input.required<string>();
  /** Bound value — use with [(value)] two-way binding or [value]+(valueChange). */
  readonly value = input<string | null>(null);
  readonly valueChange = output<string | null>();
  /** Label for the null/"All" option. */
  readonly allOptionLabel = input('–');
  /** If provided, renders a sentinel option with value __NO_GROUP__. */
  readonly noGroupLabel = input<string>();
  readonly subscriptSizing = input<'fixed' | 'dynamic'>('fixed');

  protected readonly groups = signal<DictionaryEntryDto[]>([]);

  ngOnInit(): void {
    this.entryService.findByTypeCode('DATA_DOMAIN_GROUP')
      .subscribe(e => this.groups.set(e));
  }

  protected onChange(v: string | null): void {
    this.valueChange.emit(v);
  }
}
