import { ChangeDetectionStrategy, Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { ControlContainer, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { DataDomainService } from '../../datadomain/service/data-domain.service';
import { DataDomainSummaryDto } from '../../datadomain/model/data-domain.model';

@Component({
  selector: 'atlas-select-data-domains',
  templateUrl: './select-data-domains.html',
  styleUrl: './select.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatSelectModule],
  viewProviders: [{
    provide: ControlContainer,
    useFactory: () => inject(ControlContainer, { optional: true, skipSelf: true }),
  }],
})
export class AtlasSelectDataDomains implements OnInit {
  private readonly service = inject(DataDomainService);

  readonly label = input.required<string>();
  readonly controlName = input.required<string>();
  /** Optional group filter: null = all, '__NO_GROUP__' = ungrouped, UUID = specific group. */
  readonly groupId = input<string | null>(null);
  readonly subscriptSizing = input<'fixed' | 'dynamic'>('fixed');

  private readonly allDomains = signal<DataDomainSummaryDto[]>([]);

  protected readonly filteredDomains = computed(() => {
    const g = this.groupId();
    const all = this.allDomains();
    if (!g) return all;
    if (g === '__NO_GROUP__') return all.filter(d => !d.group);
    return all.filter(d => d.group?.id === g);
  });

  ngOnInit(): void {
    this.service.findAll({ active: true, size: 500, sort: 'name' })
      .subscribe(p => this.allDomains.set(p.content));
  }
}
