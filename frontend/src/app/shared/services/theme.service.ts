import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';

export type ColorScheme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly _scheme = signal<ColorScheme>(this.detectPreference());

  readonly scheme = this._scheme.asReadonly();
  readonly isDark = computed(() => this._scheme() === 'dark');

  constructor() {
    effect(() => {
      const scheme = this._scheme();
      this.document.documentElement.setAttribute('data-theme', scheme);
      try {
        localStorage.setItem('color-scheme', scheme);
      } catch {}
    });
  }

  toggle(): void {
    this._scheme.update(s => (s === 'light' ? 'dark' : 'light'));
  }

  private detectPreference(): ColorScheme {
    try {
      const saved = localStorage.getItem('color-scheme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {}
    return typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }
}
