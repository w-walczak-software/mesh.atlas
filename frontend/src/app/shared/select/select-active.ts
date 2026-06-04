import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { ControlContainer, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { TranslocoService } from '@jsverse/transloco';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'atlas-select-active',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatSelectModule],
  viewProviders: [{
    provide: ControlContainer,
    useFactory: () => inject(ControlContainer, { optional: true, skipSelf: true }),
  }],
  template: `
    <mat-form-field appearance="outline">
      <mat-label>{{ label() }}</mat-label>
      <mat-select [formControlName]="controlName()">
        <mat-option [value]="null">{{ labels().all }}</mat-option>
        <mat-option [value]="true">{{ labels().activeOnly }}</mat-option>
        <mat-option [value]="false">{{ labels().inactiveOnly }}</mat-option>
      </mat-select>
    </mat-form-field>
  `,
  styles: [':host { display: block; } mat-form-field { width: 100%; }'],
})
export class AtlasSelectActive {
  private readonly t = inject(TranslocoService);
  private readonly lang = toSignal(this.t.langChanges$, { initialValue: this.t.getActiveLang() });

  readonly label = input.required<string>();
  readonly controlName = input.required<string>();

  protected readonly labels = computed(() => {
    this.lang();
    return {
      all: this.t.translate('common.select.all'),
      activeOnly: this.t.translate('common.select.activeOnly'),
      inactiveOnly: this.t.translate('common.select.inactiveOnly'),
    };
  });
}
