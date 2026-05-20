import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { InfoDialog } from './info.dialog';
import { ErrorDialog } from './error.dialog';
import { QuestionDialog } from './question.dialog';

const DIALOG_CONFIG = {
  width: '440px',
  maxWidth: '95vw',
  autoFocus: true,
  disableClose: true,
} as const;

@Injectable({ providedIn: 'root' })
export class DialogService {
  private readonly matDialog = inject(MatDialog);

  info(title: string, message: string, onConfirm?: () => void): void {
    const ref = this.matDialog.open(InfoDialog, { ...DIALOG_CONFIG, data: { title, message } });
    if (onConfirm) {
      ref.afterClosed().subscribe((ok: boolean) => { if (ok) onConfirm(); });
    }
  }

  error(title: string, message: string, onConfirm?: () => void): void {
    const ref = this.matDialog.open(ErrorDialog, { ...DIALOG_CONFIG, data: { title, message } });
    if (onConfirm) {
      ref.afterClosed().subscribe((ok: boolean) => { if (ok) onConfirm(); });
    }
  }

  question(
    title: string,
    message: string,
    onConfirm: () => void,
    onReject?: () => void,
  ): void {
    this.matDialog
      .open(QuestionDialog, { ...DIALOG_CONFIG, data: { title, message } })
      .afterClosed()
      .subscribe((result: boolean) => {
        if (result) {
          onConfirm();
        } else {
          onReject?.();
        }
      });
  }
}
