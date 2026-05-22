import { inject, Injectable } from '@angular/core';
import { DateAdapter } from '@angular/material/core';
import { TranslocoService } from '@jsverse/transloco';

@Injectable({ providedIn: 'root' })
export class DateLocaleService {
  private readonly adapter = inject(DateAdapter);
  private readonly t = inject(TranslocoService);

  constructor() {
    this.adapter.setLocale(this.t.getActiveLang());
    this.t.langChanges$.subscribe(lang => this.adapter.setLocale(lang));
  }
}
