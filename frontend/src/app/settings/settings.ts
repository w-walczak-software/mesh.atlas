import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { AtlasPageTitle } from '@shared/page-title/page-title';
import { provideTranslocoScope } from '@jsverse/transloco';
import { toSignal } from '@angular/core/rxjs-interop';

interface Language {
  code: string;
  label: string;
  nativeLabel: string;
  flag: string;
}

@Component({
  selector: 'app-settings',
  imports: [AtlasPageTitle, NgOptimizedImage, MatCardModule, MatIconModule, MatRippleModule, TranslocoDirective],
  providers: [provideTranslocoScope('settings')],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Settings {
  private readonly t = inject(TranslocoService);

  protected readonly activeLang = toSignal(this.t.langChanges$, {
    initialValue: this.t.getActiveLang(),
  });

  protected readonly languages: Language[] = [
    { code: 'en', label: 'English', nativeLabel: 'English', flag: '/flags/gb.svg' },
    { code: 'pl', label: 'Polish',  nativeLabel: 'Polski',  flag: '/flags/pl.svg' },
  ];

  protected setLanguage(code: string): void {
    this.t.setActiveLang(code);
    try { localStorage.setItem('lang', code); } catch { /* storage unavailable */ }
  }
}
