import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslocoDirective, provideTranslocoScope } from '@jsverse/transloco';
import { SYSTEM_ICON_CATEGORIES } from './system-icons.const';

export interface IconPickerDialogData {
  currentIcon: string | null;
}

@Component({
  selector: 'app-it-system-icon-picker',
  imports: [MatDialogModule, MatButtonModule, MatIconModule, MatTooltipModule, TranslocoDirective],
  providers: [provideTranslocoScope('itsystem')],
  templateUrl: './it-system-icon-picker.dialog.html',
  styleUrl: './it-system-icon-picker.dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItSystemIconPickerDialog {
  private readonly data = inject<IconPickerDialogData>(MAT_DIALOG_DATA);
  private readonly ref = inject(MatDialogRef<ItSystemIconPickerDialog>);

  protected readonly categories = SYSTEM_ICON_CATEGORIES;
  protected readonly selected = signal<string | null>(this.data.currentIcon);

  protected select(iconName: string): void {
    this.selected.update(cur => cur === iconName ? null : iconName);
  }

  protected confirm(): void {
    this.ref.close(this.selected());
  }

  protected cancel(): void {
    this.ref.close(undefined);
  }
}
