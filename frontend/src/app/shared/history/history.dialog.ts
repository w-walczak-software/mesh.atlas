import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DatePipe } from '@angular/common';
import { TranslocoDirective, TranslocoService, provideTranslocoScope } from '@jsverse/transloco';
import { RevisionEntryDto, RevisionType } from './history.model';

export interface HistoryDialogData {
  title: string;
  entries: RevisionEntryDto<unknown>[];
  fieldLabels?: Record<string, string>;
}

@Component({
  selector: 'app-history-dialog',
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    DatePipe,
    TranslocoDirective,
  ],
  providers: [provideTranslocoScope('history')],
  templateUrl: './history.dialog.html',
  styleUrl: './history.dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistoryDialog {
  protected readonly data = inject<HistoryDialogData>(MAT_DIALOG_DATA);
  protected readonly ref = inject(MatDialogRef<HistoryDialog>);
  private readonly t = inject(TranslocoService);

  protected readonly expandedRev = signal<number | null>(null);

  protected readonly entries = computed(() => {
    const all = this.data.entries;
    return all.map((entry, idx) => {
      const prev = all[idx + 1];
      const snap = this.asRecord(entry.snapshot);
      const prevSnap = prev ? this.asRecord(prev.snapshot) : null;
      const changed = prevSnap ? this.diffSnapshot(snap, prevSnap) : null;
      return { entry, snap, changed };
    });
  });

  protected toggle(rev: number): void {
    this.expandedRev.update(cur => (cur === rev ? null : rev));
  }

  protected revIcon(type: RevisionType): string {
    switch (type) {
      case 'ADDED': return 'add_circle';
      case 'MODIFIED': return 'edit';
      case 'DELETED': return 'remove_circle';
    }
  }

  protected revClass(type: RevisionType): string {
    switch (type) {
      case 'ADDED': return 'rev-added';
      case 'MODIFIED': return 'rev-modified';
      case 'DELETED': return 'rev-deleted';
    }
  }

  protected displayValue(value: unknown): string {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'boolean') return value ? this.t.translate('history.yes') : this.t.translate('history.no');
    if (typeof value === 'object') {
      if (Array.isArray(value)) return value.length ? value.join(', ') : '—';
      const obj = value as Record<string, unknown>;
      return obj['name'] as string ?? obj['code'] as string ?? JSON.stringify(value);
    }
    return String(value);
  }

  protected fieldLabel(key: string): string {
    return this.data.fieldLabels?.[key] ?? key;
  }

  protected snapshotEntries(snapshot: Record<string, unknown>): [string, unknown][] {
    return Object.entries(snapshot).filter(([, v]) => !Array.isArray(v) || (v as unknown[]).length > 0);
  }

  private asRecord(value: unknown): Record<string, unknown> {
    return (value != null && typeof value === 'object') ? (value as Record<string, unknown>) : {};
  }

  private diffSnapshot(
    current: Record<string, unknown>,
    previous: Record<string, unknown>,
  ): Set<string> {
    const changed = new Set<string>();
    const allKeys = new Set([...Object.keys(current), ...Object.keys(previous)]);
    for (const key of allKeys) {
      if (JSON.stringify(current[key]) !== JSON.stringify(previous[key])) {
        changed.add(key);
      }
    }
    return changed;
  }
}
