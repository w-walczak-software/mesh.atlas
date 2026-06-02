import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '@core/auth/auth.service';
import { ProfileService } from './profile.service';
import { UserProfileDto } from './profile.model';

@Component({
  selector: 'app-profile',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatDividerModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    TranslocoDirective,
  ],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Profile implements OnInit {
  private readonly profileService = inject(ProfileService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly t = inject(TranslocoService);

  protected readonly lang = toSignal(this.t.langChanges$, { initialValue: this.t.getActiveLang() });
  protected readonly user = this.auth.currentUser;

  protected readonly profile = signal<UserProfileDto | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal(false);

  protected readonly activeSystemOwnerships = computed(() =>
    this.profile()?.systemOwnerships.filter(o => o.active) ?? []
  );
  protected readonly expiredSystemOwnerships = computed(() =>
    this.profile()?.systemOwnerships.filter(o => !o.active) ?? []
  );
  protected readonly activeApiOwnerships = computed(() =>
    this.profile()?.apiOwnerships.filter(o => o.active) ?? []
  );
  protected readonly expiredApiOwnerships = computed(() =>
    this.profile()?.apiOwnerships.filter(o => !o.active) ?? []
  );

  protected readonly systemVerifierCount = computed(() =>
    new Set(this.activeSystemOwnerships().filter(o => o.canVerifyApi).map(o => o.systemId)).size
  );
  protected readonly systemOwnerCount = computed(() =>
    new Set(this.activeSystemOwnerships().map(o => o.systemId)).size
  );
  protected readonly apiOwnerCount = computed(() =>
    new Set(this.activeApiOwnerships().map(o => o.apiId)).size
  );

  protected readonly isAdmin = computed(() =>
    this.auth.hasAnyRole(['atlas_admin', 'ATLAS_ADMIN'])
  );

  ngOnInit(): void {
    this.profileService.getMyProfile().subscribe({
      next: (p) => {
        this.profile.set(p);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set(true);
      },
    });
  }

  protected goToSystem(id: string): void {
    this.router.navigate(['/it-systems', id, 'edit']);
  }

  protected goToApi(id: string): void {
    this.router.navigate(['/apis', id, 'edit']);
  }

  protected roleChipColor(role: string): string {
    const r = role.toLowerCase();
    if (r.includes('admin')) return 'warn';
    if (r.includes('atlas_system')) return 'primary';
    return 'primary';
  }

  protected formatDate(d: string | null): string {
    if (!d) return '–';
    return new Date(d).toLocaleDateString();
  }
}
