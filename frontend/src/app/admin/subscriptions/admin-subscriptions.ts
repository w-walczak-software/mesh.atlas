import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { TranslocoDirective, TranslocoService, provideTranslocoScope } from '@jsverse/transloco';
import { toSignal } from '@angular/core/rxjs-interop';
import { DataTable } from '@shared/data-table/data-table';
import { AtlasPageTitle } from '@shared/page-title/page-title';
import { DialogService } from '@shared/dialogs/dialog.service';
import { ToastService } from '@shared/toast/toast.service';
import { BadgeConfig, PageEvent, TableConfig } from '@shared/data-table/data-table.models';
import { SubscriptionService } from '../../subscription/service/subscription.service';
import { ApiSubscriptionDto } from '../../subscription/model/subscription.model';
import {
  AdminSubscriptionFormDialog,
  AdminSubscriptionFormDialogData,
} from './admin-subscription-form-dialog';

@Component({
  selector: 'app-admin-subscriptions',
  imports: [AtlasPageTitle, DataTable, TranslocoDirective, MatButtonModule, MatIconModule],
  providers: [provideTranslocoScope('admin')],
  templateUrl: './admin-subscriptions.html',
  styleUrl: './admin-subscriptions.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminSubscriptions implements OnInit {
  private readonly service = inject(SubscriptionService);
  private readonly matDialog = inject(MatDialog);
  private readonly dialogs = inject(DialogService);
  private readonly toast = inject(ToastService);
  private readonly t = inject(TranslocoService);

  protected readonly lang = toSignal(this.t.langChanges$, { initialValue: this.t.getActiveLang() });
  protected readonly data = signal<ApiSubscriptionDto[]>([]);
  protected readonly loading = signal(false);
  protected readonly selectedRow = signal<ApiSubscriptionDto | null>(null);
  private readonly totalItems = signal(0);
  private readonly pageIndex = signal(0);
  private readonly pageSize = signal(25);

  protected readonly tableConfig = computed<TableConfig<ApiSubscriptionDto>>(() => {
    this.lang();
    const selected = this.selectedRow();
    return {
      tableId: 'admin-subscriptions',
      showCheckboxes: false,
      rowId: (row) => row.id,
      columns: [
        {
          key: 'apiName',
          label: this.t.translate('admin.subscription.field.apiName'),
          sortable: true,
          cellRender: (row) => ({ text: row.apiName }),
        },
        {
          key: 'apiCode',
          label: this.t.translate('admin.subscription.field.apiCode'),
          width: '140px',
          cellRender: (row) => ({ text: row.apiCode }),
        },
        {
          key: 'subscriberEmail',
          label: this.t.translate('admin.subscription.field.subscriberEmail'),
          cellRender: (row) => ({ text: row.subscriberEmail }),
        },
        {
          key: 'subscriberName',
          label: this.t.translate('admin.subscription.field.subscriberName'),
          cellRender: (row) => ({ text: row.subscriberName ?? '—' }),
        },
        {
          key: 'subscriberType',
          label: this.t.translate('admin.subscription.field.subscriberType'),
          width: '120px',
          badges: {
            INTERNAL: { label: this.t.translate('admin.subscription.type.internal'), color: 'primary' },
            EXTERNAL: { label: this.t.translate('admin.subscription.type.external'), color: 'neutral' },
          } as Record<string, BadgeConfig>,
        },
        {
          key: 'status',
          label: this.t.translate('admin.subscription.field.status'),
          width: '160px',
          badges: {
            ACTIVE:               { label: this.t.translate('admin.subscription.status.active'),              color: 'success' },
            INACTIVE:             { label: this.t.translate('admin.subscription.status.inactive'),            color: 'neutral' },
            PENDING_CONFIRMATION: { label: this.t.translate('admin.subscription.status.pendingConfirmation'), color: 'warning' },
          } as Record<string, BadgeConfig>,
        },
        {
          key: 'source',
          label: this.t.translate('admin.subscription.field.source'),
          width: '160px',
          badges: {
            INTERNAL_PORTAL:  { label: this.t.translate('admin.subscription.source.internalPortal'),  color: 'primary' },
            DEVELOPER_PORTAL: { label: this.t.translate('admin.subscription.source.developerPortal'), color: 'neutral' },
          } as Record<string, BadgeConfig>,
        },
        {
          key: 'subscribedAt',
          label: this.t.translate('admin.subscription.field.subscribedAt'),
          width: '160px',
          sortable: true,
          cellRender: (row) => ({ text: row.subscribedAt ? new Date(row.subscribedAt).toLocaleDateString() : '—' }),
        },
      ],
      toolbar: [
        {
          label: this.t.translate('admin.subscription.action.add'),
          icon: 'add',
          color: 'primary',
          action: () => this.openForm(null),
        },
        {
          label: this.t.translate('admin.subscription.action.edit'),
          icon: 'edit',
          disabled: !selected,
          action: () => this.openForm(selected!),
        },
        {
          label: this.t.translate('admin.subscription.action.delete'),
          icon: 'delete',
          disabled: !selected,
          action: () => this.onDelete(),
        },
      ],
      pagination: {
        mode: 'backend',
        totalItems: this.totalItems(),
        pageSize: this.pageSize(),
        pageSizeOptions: [10, 25, 50],
      },
      rowClick: (row) => this.selectedRow.set(row),
    };
  });

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.service.adminGetAll(this.pageIndex(), this.pageSize()).subscribe({
      next: (page) => {
        this.data.set(page.content);
        this.totalItems.set(page.totalElements);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  protected onPage(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.load();
  }

  private openForm(sub: ApiSubscriptionDto | null): void {
    const data: AdminSubscriptionFormDialogData = { subscription: sub };
    this.matDialog.open(AdminSubscriptionFormDialog, { data, width: '540px' })
      .afterClosed()
      .subscribe(saved => {
        if (saved) {
          this.selectedRow.set(null);
          this.load();
        }
      });
  }

  private onDelete(): void {
    const row = this.selectedRow();
    if (!row) return;
    this.dialogs.question(
      this.t.translate('admin.subscription.confirm.delete.title'),
      this.t.translate('admin.subscription.confirm.delete.message', { email: row.subscriberEmail }),
      () => {
        this.service.adminDelete(row.id).subscribe({
          next: () => {
            this.toast.success(this.t.translate('admin.subscription.toast.deleted'));
            this.selectedRow.set(null);
            this.load();
          },
          error: () => this.toast.error(this.t.translate('admin.subscription.toast.error')),
        });
      },
    );
  }
}
