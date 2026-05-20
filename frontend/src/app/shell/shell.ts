import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { ShellStateService } from '../shared/services/shell-state.service';
import { Navbar } from './navbar/navbar';
import { Sidenav } from './sidenav/sidenav';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, MatSidenavModule, Navbar, Sidenav],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Shell {
  private readonly breakpoints = inject(BreakpointObserver);
  protected readonly state = inject(ShellStateService);

  readonly isMobile = toSignal(
    this.breakpoints.observe(Breakpoints.Handset).pipe(map(r => r.matches)),
    { initialValue: false }
  );

  onMenuToggle(): void {
    if (this.isMobile()) {
      this.state.toggleMobile();
    } else {
      this.state.toggleDesktop();
    }
  }
}
