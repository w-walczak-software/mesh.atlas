import { ChangeDetectionStrategy, Component, computed, contentChildren, input } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { AppSimpleTableColumn } from './simple-table-column';
@Component({
  selector: 'app-simple-table',
  templateUrl: './simple-table.html',
  styleUrl: './simple-table.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatTableModule, NgTemplateOutlet],
})
export class AppSimpleTable<T = unknown> {
  readonly dataSource = input.required<T[]>();
  protected readonly columns = contentChildren(AppSimpleTableColumn);
  protected readonly columnNames = computed(() => this.columns().map(c => c.name()));
}
