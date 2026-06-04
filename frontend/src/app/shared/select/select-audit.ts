import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { ControlContainer } from '@angular/forms';
import { TranslocoService, provideTranslocoScope } from '@jsverse/transloco';
import { toSignal } from '@angular/core/rxjs-interop';
import { AtlasSelect } from './select';
import { SelectOption } from './select.models';

const AUDIT_VIEW_PROVIDERS = [{
  provide: ControlContainer,
  useFactory: () => inject(ControlContainer, { optional: true, skipSelf: true }),
}];

function buildAuditSelectBase(t: TranslocoService, lang: () => string | undefined) {
  return {
    allLabel: computed(() => { lang(); return t.translate('admin.auditLog.filter.all'); }),
  };
}

// ── Categories ──────────────────────────────────────────────────────────────

const AUDIT_CATEGORIES = [
  'USER_MANAGEMENT', 'API_REGISTRY', 'INTEGRATION_REGISTRY',
  'DICTIONARY', 'SECURITY', 'ADMINISTRATION', 'DATA_ACCESS',
];

@Component({
  selector: 'atlas-select-audit-category',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AtlasSelect],
  providers: [provideTranslocoScope('admin')],
  viewProviders: AUDIT_VIEW_PROVIDERS,
  template: `<atlas-select [controlName]="controlName()" [label]="label()"
    [options]="options()" [nullOptionLabel]="allLabel()" nullOptionValue="" />`,
})
export class AtlasSelectAuditCategory {
  private readonly t = inject(TranslocoService);
  private readonly lang = toSignal(this.t.langChanges$, { initialValue: this.t.getActiveLang() });
  readonly controlName = input.required<string>();
  readonly label = input.required<string>();
  protected readonly allLabel = computed(() => { this.lang(); return this.t.translate('admin.auditLog.filter.all'); });
  protected readonly options = computed<SelectOption[]>(() => {
    this.lang();
    return AUDIT_CATEGORIES.map(v => ({ value: v, label: this.t.translate(`admin.auditLog.category.${v}`) }));
  });
}

// ── Actions ─────────────────────────────────────────────────────────────────

const AUDIT_ACTIONS = [
  'CREATE', 'UPDATE', 'DELETE', 'DEACTIVATE', 'ACTIVATE',
  'ATTACHMENT_UPLOADED', 'ATTACHMENT_UPDATED', 'ATTACHMENT_DELETED', 'ATTACHMENT_DOWNLOADED',
  'USER_ROLE_ASSIGNED', 'USER_ROLE_REVOKED',
  'EXPORT', 'IMPORT', 'LOGIN', 'LOGOUT',
  'APPROVAL_REQUESTED', 'APPROVED', 'REJECTED', 'CONFIGURATION_CHANGED',
];

@Component({
  selector: 'atlas-select-audit-action',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AtlasSelect],
  providers: [provideTranslocoScope('admin')],
  viewProviders: AUDIT_VIEW_PROVIDERS,
  template: `<atlas-select [controlName]="controlName()" [label]="label()"
    [options]="options()" [nullOptionLabel]="allLabel()" nullOptionValue="" />`,
})
export class AtlasSelectAuditAction {
  private readonly t = inject(TranslocoService);
  private readonly lang = toSignal(this.t.langChanges$, { initialValue: this.t.getActiveLang() });
  readonly controlName = input.required<string>();
  readonly label = input.required<string>();
  protected readonly allLabel = computed(() => { this.lang(); return this.t.translate('admin.auditLog.filter.all'); });
  protected readonly options = computed<SelectOption[]>(() => {
    this.lang();
    return AUDIT_ACTIONS.map(v => ({ value: v, label: this.t.translate(`admin.auditLog.action.${v}`) }));
  });
}

// ── Resource Types ───────────────────────────────────────────────────────────

const AUDIT_RESOURCE_TYPES = [
  'USER', 'ROLE', 'IT_SYSTEM', 'IT_SYSTEM_OWNER',
  'API', 'API_OWNER', 'API_ATTACHMENT',
  'DATA_DOMAIN', 'TRANSPORT_LAYER',
  'DICTIONARY_TYPE', 'DICTIONARY_ENTRY', 'CONFIGURATION',
];

@Component({
  selector: 'atlas-select-audit-resource-type',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AtlasSelect],
  providers: [provideTranslocoScope('admin')],
  viewProviders: AUDIT_VIEW_PROVIDERS,
  template: `<atlas-select [controlName]="controlName()" [label]="label()"
    [options]="options()" [nullOptionLabel]="allLabel()" nullOptionValue="" />`,
})
export class AtlasSelectAuditResourceType {
  private readonly t = inject(TranslocoService);
  private readonly lang = toSignal(this.t.langChanges$, { initialValue: this.t.getActiveLang() });
  readonly controlName = input.required<string>();
  readonly label = input.required<string>();
  protected readonly allLabel = computed(() => { this.lang(); return this.t.translate('admin.auditLog.filter.all'); });
  protected readonly options = computed<SelectOption[]>(() => {
    this.lang();
    return AUDIT_RESOURCE_TYPES.map(v => ({ value: v, label: this.t.translate(`admin.auditLog.resourceType.${v}`) }));
  });
}

// ── Outcomes ─────────────────────────────────────────────────────────────────

const AUDIT_OUTCOMES = ['SUCCESS', 'FAILURE'];

@Component({
  selector: 'atlas-select-audit-outcome',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AtlasSelect],
  providers: [provideTranslocoScope('admin')],
  viewProviders: AUDIT_VIEW_PROVIDERS,
  template: `<atlas-select [controlName]="controlName()" [label]="label()"
    [options]="options()" [nullOptionLabel]="allLabel()" nullOptionValue="" />`,
})
export class AtlasSelectAuditOutcome {
  private readonly t = inject(TranslocoService);
  private readonly lang = toSignal(this.t.langChanges$, { initialValue: this.t.getActiveLang() });
  readonly controlName = input.required<string>();
  readonly label = input.required<string>();
  protected readonly allLabel = computed(() => { this.lang(); return this.t.translate('admin.auditLog.filter.all'); });
  protected readonly options = computed<SelectOption[]>(() => {
    this.lang();
    return AUDIT_OUTCOMES.map(v => ({ value: v, label: this.t.translate(`admin.auditLog.outcome.${v}`) }));
  });
}
