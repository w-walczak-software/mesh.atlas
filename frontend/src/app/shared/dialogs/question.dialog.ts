import { ChangeDetectionStrategy, Component, inject, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface QuestionDialogData {
  title: string;
  message: string;
}

@Component({
  selector: 'app-question-dialog',
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styles: [`
    app-question-dialog .dlg-header { border-top: 3px solid var(--mat-sys-secondary); }
    app-question-dialog .dlg-icon   { background: var(--mat-sys-secondary-container); color: var(--mat-sys-on-secondary-container); }
  `],
  template: `
    <div class="dlg-header">
      <div class="dlg-icon" aria-hidden="true"><mat-icon>help</mat-icon></div>
      <h2 mat-dialog-title>{{ data.title }}</h2>
    </div>
    <mat-dialog-content class="dlg-body">
      <p class="dlg-message">{{ data.message }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end" class="dlg-actions">
      <button mat-button [mat-dialog-close]="false">Nie</button>
      <button mat-flat-button [mat-dialog-close]="true">Tak</button>
    </mat-dialog-actions>
  `,
})
export class QuestionDialog {
  protected readonly data = inject<QuestionDialogData>(MAT_DIALOG_DATA);
}
