import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslocoDirective, TranslocoService, provideTranslocoScope } from '@jsverse/transloco';
import { toSignal } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { DictionaryEntryDto, DictionaryEntryTranslationDto, DictionaryEntryTranslationRequest, DictionaryEntryUpdateRequest } from '../model/dictionary.model';
import { DictionaryEntryService } from '../service/dictionary-entry.service';
import { DictionaryEntryTranslationService } from '../service/dictionary-entry-translation.service';

export const SUPPORTED_LANGS: { code: string; label: string }[] = [
  { code: 'pl', label: 'Polski (pl)' },
  { code: 'en', label: 'English (en)' },
];

@Component({
  selector: 'app-edit-entry-dialog',
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatDividerModule,
    MatIconModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
    TranslocoDirective,
  ],
  providers: [provideTranslocoScope('dictionary')],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-container *transloco="let t; scope: 'dictionary'; lang: lang()">
      <div class="dlg-header">
        <div class="dlg-icon" aria-hidden="true"><mat-icon>edit_note</mat-icon></div>
        <h2 mat-dialog-title>{{ t('dictionary.dialog.editEntry.title') }}</h2>
      </div>
      <mat-dialog-content>
        <div class="dlg-readonly-row">
          <span class="dlg-readonly-label">{{ t('dictionary.entry.typeCode') }}</span>
          <code class="dlg-readonly-value">{{ data.typeCode }}</code>
          <span class="dlg-readonly-label">{{ t('dictionary.entry.code') }}</span>
          <code class="dlg-readonly-value">{{ data.code }}</code>
        </div>
        <p class="dlg-hint">{{ t('dictionary.dialog.editEntry.readonlyHint') }}</p>

        <mat-tab-group animationDuration="0">
          <!-- Tab: Basic data -->
          <mat-tab [label]="t('dictionary.dialog.editEntry.tabBasic')">
            <div class="tab-content">
              <form [formGroup]="form" class="dlg-form">
                <mat-form-field appearance="outline" class="dlg-form-field">
                  <mat-label>{{ t('dictionary.entry.name') }}</mat-label>
                  <input matInput formControlName="name" [attr.aria-required]="true" />
                  @if (form.controls.name.errors?.['required']) {
                    <mat-error>{{ t('common.validation.required') }}</mat-error>
                  }
                  @if (form.controls.name.errors?.['maxlength']) {
                    <mat-error>{{ t('common.validation.maxlength', { max: 200 }) }}</mat-error>
                  }
                </mat-form-field>
                <mat-form-field appearance="outline" class="dlg-form-field">
                  <mat-label>{{ t('dictionary.entry.description') }}</mat-label>
                  <textarea matInput formControlName="description" rows="3"></textarea>
                </mat-form-field>
                <mat-form-field appearance="outline" class="dlg-form-field dlg-form-field--narrow">
                  <mat-label>{{ t('dictionary.entry.displayOrder') }}</mat-label>
                  <input matInput type="number" formControlName="displayOrder" min="0" [attr.aria-required]="true" />
                  @if (form.controls.displayOrder.errors?.['required']) {
                    <mat-error>{{ t('common.validation.required') }}</mat-error>
                  }
                  @if (form.controls.displayOrder.errors?.['min']) {
                    <mat-error>{{ t('common.validation.min', { min: 0 }) }}</mat-error>
                  }
                </mat-form-field>
                @if (!data.systemDefined) {
                  <mat-checkbox formControlName="active">
                    {{ t('dictionary.entry.active') }}
                  </mat-checkbox>
                }

                @if (isSystemOwnerRole || isApiOwnerRole) {
                  <mat-divider class="dlg-divider" />
                  <p class="dlg-section-label">{{ t('dictionary.rolePermissions.section') }}</p>
                  @if (isSystemOwnerRole) {
                    <mat-checkbox formControlName="canDefineApi">
                      {{ t('dictionary.rolePermissions.canDefineApi') }}
                    </mat-checkbox>
                    <mat-checkbox formControlName="canVerifyApi">
                      {{ t('dictionary.rolePermissions.canVerifyApi') }}
                    </mat-checkbox>
                  }
                  @if (isApiOwnerRole) {
                    <mat-checkbox formControlName="canEditApi">
                      {{ t('dictionary.rolePermissions.canEditApi') }}
                    </mat-checkbox>
                  }
                }
              </form>
            </div>
          </mat-tab>

          <!-- Tab: Translations -->
          <mat-tab [label]="t('dictionary.dialog.editEntry.tabTranslations')">
            <div class="tab-content">
              @if (translationsLoading()) {
                <div class="translations-loading">
                  <mat-spinner diameter="32" />
                </div>
              } @else {
                @for (lang of supportedLangs; track lang.code) {
                  <div class="translation-block">
                    <p class="translation-lang-label">{{ lang.label }}</p>
                    <form [formGroup]="translationForms[lang.code]" class="dlg-form">
                      <mat-form-field appearance="outline" class="dlg-form-field">
                        <mat-label>{{ t('dictionary.entry.name') }}</mat-label>
                        <input matInput [formControl]="translationForms[lang.code].controls.name" />
                        @if (translationForms[lang.code].controls.name.errors?.['maxlength']) {
                          <mat-error>{{ t('common.validation.maxlength', { max: 200 }) }}</mat-error>
                        }
                        <mat-hint>{{ t('dictionary.dialog.editEntry.translationHint') }}</mat-hint>
                      </mat-form-field>
                      <mat-form-field appearance="outline" class="dlg-form-field">
                        <mat-label>{{ t('dictionary.entry.description') }}</mat-label>
                        <textarea matInput [formControl]="translationForms[lang.code].controls.description" rows="2"></textarea>
                      </mat-form-field>
                    </form>
                  </div>
                  @if (!$last) {
                    <mat-divider class="dlg-divider" />
                  }
                }
              }
            </div>
          </mat-tab>
        </mat-tab-group>
      </mat-dialog-content>

      <mat-dialog-actions align="end" class="dlg-actions">
        <button mat-button type="button" (click)="cancel()">{{ t('common.cancel') }}</button>
        <button mat-flat-button type="button" [disabled]="form.invalid || saving()" (click)="save()">
          {{ t('common.save') }}
        </button>
      </mat-dialog-actions>
    </ng-container>
  `,
  styles: [`
    .dlg-header {
      display: flex; align-items: center; gap: 12px; padding: 20px 24px 0;
    }
    .dlg-icon {
      display: flex; align-items: center; justify-content: center;
      width: 40px; height: 40px; border-radius: 50%;
      background: var(--mat-sys-primary-container); color: var(--mat-sys-on-primary-container);
      flex-shrink: 0;
    }
    .dlg-readonly-row {
      display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 8px;
    }
    .dlg-readonly-label {
      font-size: 12px; color: var(--mat-sys-on-surface-variant); white-space: nowrap;
    }
    .dlg-readonly-value {
      font-size: 13px; font-weight: 500; font-family: monospace;
      background: var(--mat-sys-surface-container); padding: 2px 8px; border-radius: 4px;
    }
    .dlg-hint {
      font-size: 12px; color: var(--mat-sys-on-surface-variant); margin: 0 0 4px;
    }
    .tab-content { padding-top: 16px; }
    .dlg-form { display: flex; flex-direction: column; gap: 4px; }
    .dlg-form-field { width: 100%; }
    .dlg-form-field--narrow { max-width: 160px; }
    .dlg-divider { margin: 12px 0 8px; }
    .dlg-section-label {
      font-size: 12px; font-weight: 500; color: var(--mat-sys-on-surface-variant);
      margin: 0 0 4px;
    }
    .translations-loading {
      display: flex; justify-content: center; align-items: center; padding: 32px;
    }
    .translation-block { margin-bottom: 8px; }
    .translation-lang-label {
      font-size: 13px; font-weight: 600; color: var(--mat-sys-primary);
      margin: 0 0 8px;
    }
  `],
})
export class EditEntryDialog {
  protected readonly data = inject<DictionaryEntryDto>(MAT_DIALOG_DATA);
  private readonly ref = inject(MatDialogRef<EditEntryDialog>);
  private readonly service = inject(DictionaryEntryService);
  private readonly translationService = inject(DictionaryEntryTranslationService);
  private readonly t = inject(TranslocoService);
  private readonly fb = inject(FormBuilder);

  protected readonly lang = toSignal(this.t.langChanges$, { initialValue: this.t.getActiveLang() });
  protected readonly saving = signal(false);
  protected readonly translationsLoading = signal(true);
  protected readonly supportedLangs = SUPPORTED_LANGS;

  protected readonly isSystemOwnerRole = this.data.typeCode === 'SYSTEM_OWNER_ROLE';
  protected readonly isApiOwnerRole = this.data.typeCode === 'API_OWNER_ROLE';

  private readonly meta = (this.data.metadata ?? {}) as Record<string, boolean>;

  protected readonly form = this.fb.group({
    name: [this.data.name, [Validators.required, Validators.maxLength(200)]],
    description: [this.data.description ?? ''],
    displayOrder: [this.data.displayOrder, [Validators.required, Validators.min(0)]],
    active: [{ value: this.data.active, disabled: this.data.systemDefined }],
    canDefineApi: [this.meta['canDefineApi'] ?? false],
    canVerifyApi: [this.meta['canVerifyApi'] ?? false],
    canEditApi: [this.meta['canEditApi'] ?? false],
  });

  protected readonly translationForms: Record<string, ReturnType<typeof this.buildTranslationForm>> = Object.fromEntries(
    SUPPORTED_LANGS.map(l => [l.code, this.buildTranslationForm()])
  );

  constructor() {
    this.translationService.findByEntryId(this.data.id).subscribe({
      next: (translations) => {
        for (const tr of translations) {
          if (this.translationForms[tr.langCode]) {
            this.translationForms[tr.langCode].patchValue({ name: tr.name, description: tr.description ?? '' });
          }
        }
        this.translationsLoading.set(false);
      },
      error: () => this.translationsLoading.set(false),
    });
  }

  protected save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    const raw = this.form.getRawValue();
    const entryRequest: DictionaryEntryUpdateRequest = {
      name: raw.name!,
      description: raw.description || null,
      displayOrder: raw.displayOrder ?? 0,
      active: raw.active ?? this.data.active,
      metadata: this.buildMetadata(raw),
    };

    const translationSaves = SUPPORTED_LANGS
      .filter(l => {
        const name = this.translationForms[l.code].value.name?.trim();
        return name && name.length > 0;
      })
      .map(l => {
        const v = this.translationForms[l.code].value;
        const req: DictionaryEntryTranslationRequest = {
          name: v.name!.trim(),
          description: v.description?.trim() || null,
        };
        return this.translationService.save(this.data.id, l.code, req);
      });

    const updateEntry$ = this.service.update(this.data.id, entryRequest);
    const allOps$ = translationSaves.length > 0
      ? forkJoin([updateEntry$, ...translationSaves])
      : forkJoin([updateEntry$]);

    allOps$.subscribe({
      next: ([updated]) => {
        this.saving.set(false);
        this.ref.close(updated);
      },
      error: () => this.saving.set(false),
    });
  }

  private buildTranslationForm() {
    return this.fb.group({
      name: ['', Validators.maxLength(200)],
      description: [''],
    });
  }

  private buildMetadata(raw: ReturnType<typeof this.form.getRawValue>): Record<string, unknown> | null {
    if (this.isSystemOwnerRole) {
      return { canDefineApi: raw.canDefineApi ?? false, canVerifyApi: raw.canVerifyApi ?? false };
    }
    if (this.isApiOwnerRole) {
      return { canEditApi: raw.canEditApi ?? false };
    }
    return this.data.metadata;
  }

  protected cancel(): void {
    this.ref.close();
  }
}
