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
import { MatChipsModule } from '@angular/material/chips';
import { TranslocoDirective, TranslocoService, provideTranslocoScope } from '@jsverse/transloco';
import { DataTable } from '@shared/data-table/data-table';
import { AtlasPageTitle } from '@shared/page-title/page-title';
import { DialogService } from '@shared/dialogs/dialog.service';
import { ToastService } from '@shared/toast/toast.service';
import { PageEvent, TableConfig } from '@shared/data-table/data-table.models';
import { toSignal } from '@angular/core/rxjs-interop';
import { SubscriptionService } from '../service/subscription.service';
import { ApiSubscriptionSummaryDto } from '../model/subscription.model';

@Component({
  selector: 'app-my-subscriptions',
  imports: [
    AtlasPageTitle,
    DataTable,
    TranslocoDirective,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
  ],
  providers: [provideTranslocoScope('subscription')],
  templateUrl: './my-subscriptions.html',
  styleUrl: './my-subscriptions.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MySubscriptions implements OnInit {
  private readonly service = inject(SubscriptionService);
  private readonly dialogs = inject(DialogService);
  private readonly toast = inject(ToastService);
  private readonly t = inject(TranslocoService);

  protected readonly lang = toSignal(this.t.langChanges$, { initialValue: this.t.getActiveLang() });
  protected readonly data = signal<ApiSubscriptionSummaryDto[]>([]);
  protected readonly loading = signal(false);
  private readonly totalItems = signal(0);
  private readonly pageIndex = signal(0);
  private readonly pageSize = signal(20);

  protected readonly tableConfig = computed<TableConfig<ApiSubscriptionSummaryDto>>(() => {
    this.lang();
    return {
      tableId: 'my-subscriptions',
      showCheckboxes: false,
      rowId: (row) => row.id,
      columns: [
        {
          key: 'apiName',
          label: this.t.translate('subscription.field.apiName'),
          sortable: true,
          cellRender: (row) => ({ text: row.apiName }),
        },
        {
          key: 'apiCode',
          label: this.t.translate('subscription.field.apiCode'),
          width: '140px',
          cellRender: (row) => ({ text: row.apiCode }),
        },
        {
          key: 'apiVersion',
          label: this.t.translate('subscription.field.apiVersion'),
          width: '120px',
          cellRender: (row) => ({ text: row.apiVersion ?? '—' }),
        },
        {
          key: 'producerSystemName',
          label: this.t.translate('subscription.field.producerSystem'),
          cellRender: (row) => ({ text: row.producerSystemName ?? '—' }),
        },
        {
          key: 'notificationsEnabled',
          label: this.t.translate('subscription.field.notifications'),
          width: '130px',
          badges: {
            'true':  { label: this.t.translate('subscription.badge.enabled'),  color: 'success' },
            'false': { label: this.t.translate('subscription.badge.disabled'), color: 'neutral' },
          },
        },
        {
          key: 'subscribedAt',
          label: this.t.translate('subscription.field.subscribedAt'),
          width: '160px',
          sortable: true,
          cellRender: (row) => ({ text: row.subscribedAt ? new Date(row.subscribedAt).toLocaleDateString() : '—' }),
        },
      ],
      toolbar: [
        {
          label: this.t.translate('subscription.action.unsubscribe'),
          icon: 'unsubscribe',
          disabled: !this._selectedRow(),
          action: () => this.onUnsubscribe(),
        },
      ],
      pagination: {
        mode: 'backend',
        totalItems: this.totalItems(),
        pageSize: this.pageSize(),
        pageSizeOptions: [10, 20, 50],
      },
      rowClick: (row) => this._selectedRow.set(row),
    };
  });

  protected readonly _selectedRow = signal<ApiSubscriptionSummaryDto | null>(null);

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.service.getMySubscriptions(this.pageIndex(), this.pageSize()).subscribe({
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

  protected onUnsubscribe(): void {
    const row = this._selectedRow();
    if (!row) return;
    this.dialogs.question(
      this.t.translate('subscription.confirm.unsubscribe.title'),
      this.t.translate('subscription.confirm.unsubscribe.message', { api: row.apiName }),
      () => {
        this.service.unsubscribe(row.id).subscribe({
          next: () => {
            this.toast.success(this.t.translate('subscription.toast.unsubscribed'));
            this._selectedRow.set(null);
            this.load();
          },
          error: () => this.toast.error(this.t.translate('subscription.toast.error')),
        });
      },
    );
  }
}
