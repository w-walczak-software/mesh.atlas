import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, output } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { AuthService } from '../../core/auth/auth.service';
import { ThemeService } from '../../shared/services/theme.service';

@Component({
  selector: 'app-navbar',
  imports: [
    MatButtonModule,
    MatDividerModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    TranslocoDirective,
  ],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Navbar {
  readonly menuToggle = output<void>();

  protected readonly auth = inject(AuthService);
  protected readonly theme = inject(ThemeService);
  protected readonly router = inject(Router);
  protected readonly user = this.auth.currentUser;
  protected readonly isDark = this.theme.isDark;

  private readonly t = inject(TranslocoService);
  private readonly cdr = inject(ChangeDetectorRef);
  protected readonly lang = toSignal(this.t.langChanges$, { initialValue: this.t.getActiveLang() });

  constructor() {
    this.t.langChanges$.pipe(takeUntilDestroyed()).subscribe(() => this.cdr.markForCheck());
  }
}
