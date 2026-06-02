import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoDirective, TranslocoService, provideTranslocoScope } from '@jsverse/transloco';
import { toSignal } from '@angular/core/rxjs-interop';
import { DataTable } from '@shared/data-table/data-table';
import { ColumnDef, PageEvent, TableConfig } from '@shared/data-table/data-table.models';
import { AuthService } from '@core/auth/auth.service';
import { HistoryDialog, HistoryDialogData } from '@shared/history/history.dialog';
import { HistoryService } from '@shared/history/history.service';
import { ToastService } from '@shared/toast/toast.service';
import { EmailTemplateSummaryDto } from '../model/admin.model';
import { EmailTemplateService } from './email-template.service';
import {
  EmailTemplateEditDialog,
  EmailTemplateEditDialogData,
} from './email-template-edit-dialog';

@Component({
  selector: 'app-email-templates',
  imports: [DataTable, TranslocoDirective, MatButtonModule, MatIconModule],
  providers: [provideTranslocoScope('admin')],
  templateUrl: './email-templates.html',
  styleUrl: './email-templates.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmailTemplates {
  private readonly service = inject(EmailTemplateService);
  private readonly matDialog = inject(MatDialog);
  private readonly historyService = inject(HistoryService);
  private readonly toast = inject(ToastService);
  private readonly t = inject(TranslocoService);
  private readonly auth = inject(AuthService);

  protected readonly lang = toSignal(this.t.langChanges$, { initialValue: this.t.getActiveLang() });
  protected readonly data = signal<EmailTemplateSummaryDto[]>([]);
  protected readonly loading = signal(false);
  protected readonly pageIndex = signal(0);
  private readonly totalItems = signal(0);
  private readonly pageSize = signal(25);

  protected readonly isAdmin = computed(() => this.auth.roles().includes('atlas_admin'));

  protected readonly tableConfig = computed<TableConfig<EmailTemplateSummaryDto>>(() => {
    const _lang = this.lang();
    const columns: ColumnDef<EmailTemplateSummaryDto>[] = [
      {
        key: 'code',
        label: this.t.translate('admin.emailTemplate.field.code'),
        sortable: true,
        width: '260px',
      },
      {
        key: 'title',
        label: this.t.translate('admin.emailTemplate.field.title'),
        sortable: true,
      },
      {
        key: 'tags',
        label: this.t.translate('admin.emailTemplate.field.tags'),
        sortable: false,
        width: '120px',
        cellRender: (row: EmailTemplateSummaryDto) => ({
          text: row.tags.length ? String(row.tags.length) : '—',
        }),
      },
      {
        key: 'active',
        label: this.t.translate('admin.emailTemplate.field.active'),
        sortable: true,
        width: '100px',
        badges: {
          'true': { label: this.t.translate('admin.badge.enabled'), color: 'success' },
          'false': { label: this.t.translate('admin.badge.disabled'), color: 'neutral' },
        },
      },
      {
        key: 'updatedBy',
        label: this.t.translate('admin.emailTemplate.field.updatedBy'),
        sortable: false,
        width: '200px',
      },
    ];

    const actions = [
      {
        label: this.t.translate('admin.emailTemplate.action.history'),
        icon: 'history',
        action: (row: EmailTemplateSummaryDto) => this.openHistory(row),
      },
    ];

    if (this.isAdmin()) {
      actions.unshift({
        label: this.t.translate('admin.emailTemplate.action.edit'),
        icon: 'edit',
        action: (row: EmailTemplateSummaryDto) => this.openEditDialog(row),
      });
    }

    return {
      tableId: 'email-templates',
      columns,
      pagination: {
        mode: 'backend',
        totalItems: this.totalItems(),
        pageSize: this.pageSize(),
        pageSizeOptions: [25, 50, 100],
      },
      showFilter: false,
      actions,
      rowDblClick: this.isAdmin() ? row => this.openEditDialog(row) : undefined,
    };
  });

  constructor() {
    this.load();
  }

  protected onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.service.findAll(this.pageIndex(), this.pageSize()).subscribe({
      next: page => {
        this.data.set(page.content);
        this.totalItems.set(page.totalElements);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private openEditDialog(row: EmailTemplateSummaryDto): void {
    this.service.findById(row.id).subscribe(template => {
      this.matDialog
        .open(EmailTemplateEditDialog, {
          width: '95vw',
          maxWidth: '1400px',
          maxHeight: '92vh',
          disableClose: false,
          data: { template } satisfies EmailTemplateEditDialogData,
        })
        .afterClosed()
        .subscribe(saved => {
          if (saved) {
            this.data.update(list =>
              list.map(item =>
                item.id === saved.id
                  ? { ...item, title: saved.title, tags: saved.tags, updatedAt: saved.updatedAt, updatedBy: saved.updatedBy }
                  : item,
              ),
            );
          }
        });
    });
  }

  private openHistory(row: EmailTemplateSummaryDto): void {
    this.historyService.getEmailTemplateRevisions(row.id).subscribe(entries => {
      this.matDialog.open(HistoryDialog, {
        data: {
          title: `${row.code} – ${row.title}`,
          entries,
          fieldLabels: this.buildFieldLabels(),
        } satisfies HistoryDialogData,
        maxWidth: '800px',
        width: '95vw',
      });
    });
  }

  private buildFieldLabels(): Record<string, string> {
    const tr = (k: string) => this.t.translate<string>('history.fields.' + k);
    return {
      id: tr('id'),
      code: this.t.translate('admin.emailTemplate.field.code'),
      title: this.t.translate('admin.emailTemplate.field.title'),
      body: this.t.translate('admin.emailTemplate.field.body'),
      description: tr('description'),
      tags: this.t.translate('admin.emailTemplate.field.tags'),
      active: tr('active'),
      createdAt: tr('createdAt'),
      createdBy: tr('createdBy'),
      updatedAt: tr('updatedAt'),
      updatedBy: tr('updatedBy'),
    };
  }
}
