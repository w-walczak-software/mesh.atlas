import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.html',
  styleUrl: './toolbar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'form-topbar' },
  imports: [MatButtonModule, MatIconModule, MatTooltipModule],
})
export class AppToolbar {
  readonly title = input.required<string>();
  readonly subtitle = input.required<string>();
  readonly backLabel = input('');
  readonly cancelLabel = input('');
  readonly saveLabel = input('');
  readonly historyLabel = input('');
  readonly readonlyLabel = input('');
  readonly showHistory = input(false);
  readonly readonly = input(false);
  readonly saveDisabled = input(false);

  readonly back = output<void>();
  readonly cancel = output<void>();
  readonly save = output<void>();
  readonly history = output<void>();
}
