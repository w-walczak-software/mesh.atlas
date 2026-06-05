import { ChangeDetectionStrategy, Component, inject, input, OnInit, signal } from '@angular/core';
import { ControlContainer, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { DictionaryEntryDto } from '../../dictionary/model/dictionary.model';
import { DictionaryEntryService } from '../../dictionary/service/dictionary-entry.service';

@Component({
  selector: 'atlas-select-datadomain-group',
  template: `
    <mat-form-field appearance="outline" [subscriptSizing]="subscriptSizing()">
      <mat-label>{{ label() }}</mat-label>
      <mat-select [formControlName]="controlName()">
        <mat-option [value]="null">{{ nullOptionLabel() }}</mat-option>
        @for (g of groups(); track g.id) {
          <mat-option [value]="g.id">{{ g.name }}</mat-option>
        }
      </mat-select>
      <ng-content />
    </mat-form-field>
  `,
  styleUrl: './select.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatSelectModule],
  viewProviders: [{
    provide: ControlContainer,
    useFactory: () => inject(ControlContainer, { optional: true, skipSelf: true }),
  }],
})
export class AtlasSelectDatadomainGroup implements OnInit {
  private readonly entryService = inject(DictionaryEntryService);

  readonly label = input.required<string>();
  readonly controlName = input.required<string>();
  readonly nullOptionLabel = input('–');
  readonly subscriptSizing = input<'fixed' | 'dynamic'>('fixed');

  protected readonly groups = signal<DictionaryEntryDto[]>([]);

  ngOnInit(): void {
    this.entryService.findByTypeCode('DATA_DOMAIN_GROUP').subscribe(e => this.groups.set(e));
  }
}
