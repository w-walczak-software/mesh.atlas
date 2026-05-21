import { inject, Injectable } from '@angular/core';
import { TRANSLOCO_CONFIG, TranslocoFallbackStrategy } from '@jsverse/transloco';

@Injectable({ providedIn: 'root' })
export class ScopeSafeFallbackStrategy implements TranslocoFallbackStrategy {
  private readonly config = inject(TRANSLOCO_CONFIG);

  getNextLangs(failedLang: string): string[] {
    // Scope translation paths (e.g. 'dictionary/pl') contain a slash.
    // Returning [] for them prevents Transloco from loading the fallback scope
    // file and subsequently calling setActiveLang() with the fallback lang,
    // which would silently reset the user's language preference.
    if (failedLang.includes('/')) return [];

    const fallback = this.config.fallbackLang;
    if (!fallback) return [];
    return Array.isArray(fallback) ? fallback : [fallback];
  }
}
