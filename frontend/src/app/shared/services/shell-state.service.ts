import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ShellStateService {
  readonly collapsed = signal(false);
  readonly mobileOpen = signal(false);

  expand(): void {
    this.collapsed.set(false);
  }

  toggleDesktop(): void {
    this.collapsed.update(v => !v);
  }

  toggleMobile(): void {
    this.mobileOpen.update(v => !v);
  }

  closeMobile(): void {
    this.mobileOpen.set(false);
  }
}
