import { ChangeDetectionStrategy, Component, inject, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ErrorDialogData {
  title: string;
  message: string;
}

@Component({
  selector: 'app-error-dialog',
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styles: [`
    app-error-dialog .dlg-header { border-top: 3px solid var(--mat-sys-error); }
    app-error-dialog .dlg-icon   { background: var(--mat-sys-error-container); color: var(--mat-sys-on-error-container); }
    app-error-dialog .dlg-btn-confirm.mdc-button--unelevated {
      background: var(--mat-sys-error);
      color: var(--mat-sys-on-error);
    }
  `],
  template: `
    <div class="dlg-header">
      <div class="dlg-icon" aria-hidden="true"><mat-icon>error</mat-icon></div>
      <h2 mat-dialog-title>{{ data.title }}</h2>
    </div>
    <mat-dialog-content class="dlg-body">
      <p class="dlg-message">{{ data.message }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end" class="dlg-actions">
      <button mat-flat-button class="dlg-btn-confirm" [mat-dialog-close]="true">Zamknij</button>
    </mat-dialog-actions>
  `,
})
export class ErrorDialog {
  protected readonly data = inject<ErrorDialogData>(MAT_DIALOG_DATA);
}
