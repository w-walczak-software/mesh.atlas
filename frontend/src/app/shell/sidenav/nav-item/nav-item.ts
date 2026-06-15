import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import type { NavItem } from '@core/navigation/navigation.model';
import { ShellStateService } from '@shared/services/shell-state.service';

@Component({
  selector: 'app-nav-item',
  // Self-referential import for recursive two-level rendering
  imports: [RouterLink, MatIconModule, MatRippleModule, MatTooltipModule, TranslocoDirective],
  templateUrl: './nav-item.html',
  styleUrl: './nav-item.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavItemComponent {
  readonly item = input.required<NavItem>();
  readonly collapsed = input(false);
  readonly level = input(0);

  private readonly router = inject(Router);
  private readonly shellState = inject(ShellStateService);
  private readonly transloco = inject(TranslocoService);
  private readonly cdr = inject(ChangeDetectorRef);
  protected readonly lang = toSignal(this.transloco.langChanges$, { initialValue: this.transloco.getActiveLang() });

  private readonly routerUrl = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(() => this.router.url),
      startWith(this.router.url)
    ),
    { initialValue: this.router.url }
  );

  readonly hasChildren = computed(() => (this.item().children?.length ?? 0) > 0);

  readonly isChildActive = computed(() => {
    const url = this.routerUrl();
    return (this.item().children ?? []).some(
      c => c.route != null && url.startsWith(c.route)
    );
  });

  readonly isLeafActive = computed(() => {
    const route = this.item().route;
    if (!route) return false;
    const url = this.routerUrl().split('?')[0].split('#')[0];
    if (this.item().exactMatch) return url === route;
    return url === route || url.startsWith(route + '/');
  });

  readonly expanded = signal(false);

  constructor() {
    effect(() => {
      if (this.isChildActive()) {
        this.expanded.set(true);
      }
    });
    this.transloco.langChanges$.pipe(takeUntilDestroyed()).subscribe(() => this.cdr.markForCheck());
  }

  toggle(): void {
    if (!this.hasChildren()) return;
    if (this.collapsed()) {
      this.shellState.expand();
      this.expanded.set(true);
    } else {
      this.expanded.update(v => !v);
    }
  }
}
