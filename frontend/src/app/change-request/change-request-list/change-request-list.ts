import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { TranslocoDirective, TranslocoService, provideTranslocoScope } from '@jsverse/transloco';
import { toSignal } from '@angular/core/rxjs-interop';
import { DataTable } from '@shared/data-table/data-table';
import { AtlasSelectDictionary } from '@shared/select/select-dictionary';
import { AtlasPanelHeader } from '@shared/panel-header/panel-header';
import { PageEvent, TableConfig } from '@shared/data-table/data-table.models';
import { DialogService } from '@shared/dialogs/dialog.service';
import { ToastService } from '@shared/toast/toast.service';
import { ChangeRequestService } from '../service/change-request.service';
import {
  ChangeRequestSearchParams,
  ChangeRequestStatus,
  ChangeRequestSummaryDto,
} from '../model/change-request.model';
import { ReviewDialog, ReviewDialogData } from '../review-dialog/review.dialog';
import { ChangeRequestDetailDialog, ChangeRequestDetailDialogData } from '../detail-dialog/change-request-detail.dialog';

@Component({
  selector: 'app-change-request-list',
  imports: [
    DataTable,
    AtlasSelectDictionary,
    AtlasPanelHeader,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatExpansionModule,
    TranslocoDirective,
  ],
  providers: [provideTranslocoScope('changeRequest')],
  templateUrl: './change-request-list.html',
  styleUrl: './change-request-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChangeRequestList implements OnInit {
  private readonly crService = inject(ChangeRequestService);
  private readonly dialog = inject(MatDialog);
  private readonly dialogService = inject(DialogService);
  private readonly toast = inject(ToastService);
  private readonly t = inject(TranslocoService);
  private readonly fb = inject(FormBuilder);

  protected readonly lang = toSignal(this.t.langChanges$, { initialValue: this.t.getActiveLang() });
  protected readonly data = signal<ChangeRequestSummaryDto[]>([]);
  protected readonly loading = signal(false);
  protected readonly totalItems = signal(0);
  protected readonly pageIndex = signal(0);
  protected readonly pageSize = signal(20);
  protected readonly selectedRow = signal<ChangeRequestSummaryDto | null>(null);

  protected readonly filterForm = this.fb.group({
    status: [''],
    searchText: [''],
    requesterEmail: [''],
    changeTypeId: [null as string | null],
    priorityId: [null as string | null],
  });

  protected readonly tableConfig = computed<TableConfig<ChangeRequestSummaryDto>>(() => {
    this.lang();
    const row = this.selectedRow();
    return {
      tableId: 'change-requests',
      rowId: (r) => r.id,
      columns: [
        {
          key: 'apiName',
          label: this.t.translate('changeRequest.field.api'),
          sortable: true,
          cellRender: (r) => ({ text: `${r.apiName} (${r.apiCode})` }),
        },
        {
          key: 'title',
          label: this.t.translate('changeRequest.field.title'),
          sortable: true,
          cellRender: (r) => ({ text: r.title }),
        },
        {
          key: 'changeType',
          label: this.t.translate('changeRequest.field.changeType'),
          cellRender: (r) => ({ text: r.changeType?.name ?? '—' }),
        },
        {
          key: 'priority',
          label: this.t.translate('changeRequest.field.priority'),
          width: '120px',
          cellRender: (r) => ({
            badge: {
              label: r.priority?.name ?? '—',
              ...this.priorityBadgeStyle(r.priority?.code),
            },
          }),
        },
        {
          key: 'status',
          label: this.t.translate('changeRequest.field.status'),
          width: '140px',
          cellRender: (r) => ({
            badge: {
              label: this.t.translate('changeRequest.status.' + r.status),
              ...this.statusBadgeStyle(r.status),
            },
          }),
        },
        {
          key: 'requesterName',
          label: this.t.translate('changeRequest.field.requester'),
          cellRender: (r) => ({ text: r.requesterName ?? r.requesterEmail }),
        },
        {
          key: 'createdAt',
          label: this.t.translate('changeRequest.field.submittedAt'),
          sortable: true,
          width: '130px',
          cellRender: (r) => ({
            text: r.createdAt ? new Date(r.createdAt).toLocaleDateString('pl-PL') : '—',
          }),
        },
        {
          key: 'plannedVersion',
          label: this.t.translate('changeRequest.field.plannedVersion'),
          width: '110px',
          cellRender: (r) => ({ text: r.plannedVersion ?? '—' }),
        },
      ],
      toolbar: [
        {
          label: this.t.translate('changeRequest.action.details'),
          icon: 'open_in_new',
          disabled: !row,
          action: () => row && this.openDetail(row),
        },
        {
          label: this.t.translate('changeRequest.action.review'),
          icon: 'rate_review',
          disabled: !row || !row.currentUserIsOwner || !['SUBMITTED', 'UNDER_REVIEW'].includes(row.status),
          action: () => row && this.openReview(row, 'review'),
        },
        {
          label: this.t.translate('changeRequest.action.markImplemented'),
          icon: 'check_circle',
          disabled: !row || !row.currentUserIsOwner || row.status !== 'APPROVED',
          action: () => row && this.openReview(row, 'implement'),
        },
        {
          label: this.t.translate('changeRequest.action.cancel'),
          icon: 'cancel',
          disabled: !row || !row.currentUserIsOwner || ['IMPLEMENTED', 'CANCELLED', 'REJECTED'].includes(row.status),
          action: () => row && this.cancelRequest(row),
        },
      ],
      pagination: {
        mode: 'backend',
        totalItems: this.totalItems(),
        pageSize: this.pageSize(),
        pageSizeOptions: [10, 20, 50],
      },
      rowClick: (r) => this.selectedRow.set(r),
    };
  });

  ngOnInit(): void {
    this.load();
  }

  protected onSearch(): void {
    this.pageIndex.set(0);
    this.load();
  }

  protected onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.load();
  }

  protected resetFilters(): void {
    this.filterForm.reset();
    this.pageIndex.set(0);
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    const v = this.filterForm.value;
    const params: ChangeRequestSearchParams = {
      status: (v.status as ChangeRequestStatus) || undefined,
      searchText: v.searchText || undefined,
      requesterEmail: v.requesterEmail || undefined,
      changeTypeId: v.changeTypeId || undefined,
      priorityId: v.priorityId || undefined,
      page: this.pageIndex(),
      size: this.pageSize(),
      sort: 'createdAt,desc',
    };
    this.crService.findAll(params).subscribe({
      next: (page) => {
        this.data.set(page.content);
        this.totalItems.set(page.totalElements);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private openDetail(row: ChangeRequestSummaryDto): void {
    const data: ChangeRequestDetailDialogData = { id: row.id };
    this.dialog.open(ChangeRequestDetailDialog, {
      data,
      width: '720px',
      maxWidth: '95vw',
    });
  }

  private openReview(row: ChangeRequestSummaryDto, mode: 'review' | 'implement'): void {
    const data: ReviewDialogData = { changeRequest: row, mode };
    this.dialog
      .open(ReviewDialog, { data, width: '680px', maxWidth: '95vw', disableClose: true })
      .afterClosed()
      .subscribe((saved) => { if (saved) this.load(); });
  }

  private cancelRequest(row: ChangeRequestSummaryDto): void {
    this.dialogService
      .question(
        this.t.translate('changeRequest.confirm.cancel.title'),
        this.t.translate('changeRequest.confirm.cancel.message', { title: row.title }),
        () => {
          this.crService.cancel(row.id).subscribe({
            next: () => {
              this.toast.success(this.t.translate('changeRequest.toast.cancelled'));
              this.selectedRow.set(null);
              this.load();
            },
          });
        },
      );
  }

  private statusBadgeStyle(status: ChangeRequestStatus): { color: string; textColor?: string } {
    const map: Record<ChangeRequestStatus, { color: string; textColor?: string }> = {
      SUBMITTED:    { color: '#E3F2FD', textColor: '#1565C0' },
      UNDER_REVIEW: { color: '#FFF3E0', textColor: '#E65100' },
      APPROVED:     { color: '#E8F5E9', textColor: '#2E7D32' },
      REJECTED:     { color: '#FFEBEE', textColor: '#C62828' },
      DEFERRED:     { color: '#F3E5F5', textColor: '#6A1B9A' },
      IMPLEMENTED:  { color: '#E0F2F1', textColor: '#00695C' },
      CANCELLED:    { color: '#F5F5F5', textColor: '#616161' },
    };
    return map[status] ?? { color: '#EEE', textColor: '#333' };
  }

  private priorityBadgeStyle(code: string | undefined): { color: string; textColor?: string } {
    const map: Record<string, { color: string; textColor?: string }> = {
      LOW:      { color: '#E8F5E9', textColor: '#2E7D32' },
      MEDIUM:   { color: '#E3F2FD', textColor: '#1565C0' },
      HIGH:     { color: '#FFF3E0', textColor: '#E65100' },
      CRITICAL: { color: '#FFEBEE', textColor: '#C62828' },
    };
    return map[code ?? ''] ?? { color: '#EEE', textColor: '#333' };
  }
}
