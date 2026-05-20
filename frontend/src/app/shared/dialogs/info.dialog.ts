import { ChangeDetectionStrategy, Component, inject, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface InfoDialogData {
  title: string;
  message: string;
}

@Component({
  selector: 'app-info-dialog',
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styles: [`
    app-info-dialog .dlg-header { border-top: 3px solid var(--mat-sys-primary); }
    app-info-dialog .dlg-icon   { background: var(--mat-sys-primary-container); color: var(--mat-sys-on-primary-container); }
  `],
  template: `
    <div class="dlg-header">
      <div class="dlg-icon" aria-hidden="true"><mat-icon>info</mat-icon></div>
      <h2 mat-dialog-title>{{ data.title }}</h2>
    </div>
    <mat-dialog-content class="dlg-body">
      <p class="dlg-message">{{ data.message }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end" class="dlg-actions">
      <button mat-flat-button [mat-dialog-close]="true">OK</button>
    </mat-dialog-actions>
  `,
})
export class InfoDialog {
  protected readonly data = inject<InfoDialogData>(MAT_DIALOG_DATA);
}
