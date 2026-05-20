import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { NavigationService } from '../../core/navigation/navigation.service';
import { NavItemComponent } from './nav-item/nav-item';

@Component({
  selector: 'app-sidenav',
  imports: [NavItemComponent],
  templateUrl: './sidenav.html',
  styleUrl: './sidenav.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sidenav {
  readonly collapsed = input(false);
  protected readonly items = inject(NavigationService).items;
}
