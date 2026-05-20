import { inject, Injectable } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly t = inject(TranslocoService);

  /**
   * Translates a backend error code to a localized message.
   * Backend responses should include an `errorCode` string (e.g. 'notFound', 'unauthorized').
   * Falls back to `errors.default` when the code has no translation.
   *
   * Usage: this.i18n.error(err.error.errorCode)
   */
  error(code: string): string {
    const key = `errors.${code}`;
    const translated = this.t.translate<string>(key);
    return translated === key ? this.t.translate('errors.default') : translated;
  }

  /**
   * Translates any key in the active language.
   * Falls back to English automatically via Transloco's fallbackLang.
   */
  translate(key: string, params?: Record<string, unknown>): string {
    return this.t.translate<string>(key, params);
  }
}
