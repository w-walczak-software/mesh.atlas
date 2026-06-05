/**
 * Thin convenience wrappers around AtlasSelectDictionary with preset dictionary codes
 * and sensible defaults for each domain concept.
 *
 * Multi-level content projection works: mat-error from the parent flows through
 * ng-content into AtlasSelectDictionary and then into mat-form-field.
 */
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { AtlasSelectDictionary } from './select-dictionary';

// ── Shared template fragment ─────────────────────────────────────────────────

const WRAPPER_STYLES = [':host { display: block; }'];

// ── atlas-select-status ──────────────────────────────────────────────────────

@Component({
  selector: 'atlas-select-status',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AtlasSelectDictionary],
  styles: WRAPPER_STYLES,
  template: `
    <atlas-select-dictionary
      [controlName]="controlName()"
      [label]="label()"
      [dictionaryCode]="dictionaryCode()"
      [ariaRequired]="ariaRequired()"
      [subscriptSizing]="subscriptSizing()"
      [errorMessages]="errorMessages()">
      <ng-content />
    </atlas-select-dictionary>
  `,
})
export class AtlasSelectStatus {
  readonly controlName = input.required<string>();
  readonly label = input.required<string>();
  readonly dictionaryCode = input('API_STATUS');
  readonly ariaRequired = input(false);
  readonly subscriptSizing = input<'fixed' | 'dynamic'>('fixed');
  readonly errorMessages = input<Record<string, string>>({});
}

// ── atlas-select-type ────────────────────────────────────────────────────────

@Component({
  selector: 'atlas-select-type',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AtlasSelectDictionary],
  styles: WRAPPER_STYLES,
  template: `
    <atlas-select-dictionary
      [controlName]="controlName()"
      [label]="label()"
      [dictionaryCode]="dictionaryCode()"
      [nullOptionLabel]="nullOptionLabel()"
      [subscriptSizing]="subscriptSizing()">
      <ng-content />
    </atlas-select-dictionary>
  `,
})
export class AtlasSelectType {
  readonly controlName = input.required<string>();
  readonly label = input.required<string>();
  /** Override to use a different type dictionary. */
  readonly dictionaryCode = input('API_TYPE');
  readonly nullOptionLabel = input('–');
  readonly subscriptSizing = input<'fixed' | 'dynamic'>('fixed');
}

// ── atlas-select-data-flow-direction ─────────────────────────────────────────

@Component({
  selector: 'atlas-select-data-flow-direction',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AtlasSelectDictionary],
  styles: WRAPPER_STYLES,
  template: `
    <atlas-select-dictionary
      [controlName]="controlName()"
      [label]="label()"
      dictionaryCode="DATA_FLOW_DIRECTION"
      nullOptionLabel="–"
      [subscriptSizing]="subscriptSizing()">
      <ng-content />
    </atlas-select-dictionary>
  `,
})
export class AtlasSelectDataFlowDirection {
  readonly controlName = input.required<string>();
  readonly label = input.required<string>();
  readonly subscriptSizing = input<'fixed' | 'dynamic'>('fixed');
}

// ── atlas-select-contract-type ────────────────────────────────────────────────

@Component({
  selector: 'atlas-select-contract-type',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AtlasSelectDictionary],
  styles: WRAPPER_STYLES,
  template: `
    <atlas-select-dictionary
      [controlName]="controlName()"
      [label]="label()"
      dictionaryCode="CONTRACT_TYPE"
      nullOptionLabel="–"
      [subscriptSizing]="subscriptSizing()">
      <ng-content />
    </atlas-select-dictionary>
  `,
})
export class AtlasSelectContractType {
  readonly controlName = input.required<string>();
  readonly label = input.required<string>();
  readonly subscriptSizing = input<'fixed' | 'dynamic'>('fixed');
}
