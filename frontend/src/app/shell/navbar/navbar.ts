import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit, output } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { AuthService } from '../../core/auth/auth.service';
import { ThemeService } from '../../shared/services/theme.service';
import { ApiService } from '../../api/service/api.service';
import { GovernancePendingDialog } from '@shared/governance/governance-pending.dialog';

@Component({
  selector: 'app-navbar',
  imports: [
    MatBadgeModule,
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
export class Navbar implements OnInit {
  readonly menuToggle = output<void>();

  protected readonly auth = inject(AuthService);
  protected readonly theme = inject(ThemeService);
  protected readonly router = inject(Router);
  protected readonly user = this.auth.currentUser;
  protected readonly isDark = this.theme.isDark;

  private readonly t = inject(TranslocoService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly apiService = inject(ApiService);
  private readonly matDialog = inject(MatDialog);
  protected readonly lang = toSignal(this.t.langChanges$, { initialValue: this.t.getActiveLang() });

  constructor() {
    this.t.langChanges$.pipe(takeUntilDestroyed()).subscribe(() => this.cdr.markForCheck());
  }

  ngOnInit(): void {
    this.checkGovernancePending();
  }

  private checkGovernancePending(): void {
    this.apiService.getGovernancePendingCount().subscribe({
      next: (result) => {
        if (result.count > 0) {
          this.matDialog.open(GovernancePendingDialog, {
            width: '480px',
            maxWidth: '95vw',
            data: { count: result.count },
          }).afterClosed().subscribe(action => {
            if (action === 'navigate') {
              this.router.navigate(['/apis'], { queryParams: { pendingVerificationOnly: true } });
            }
          });
        }
      },
      error: () => { /* silently ignore — governance may not be configured */ },
    });
  }
}
