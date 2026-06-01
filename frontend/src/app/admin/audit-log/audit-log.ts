import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatChipsModule } from '@angular/material/chips';
import { TranslocoDirective, TranslocoService, provideTranslocoScope } from '@jsverse/transloco';
import { toSignal } from '@angular/core/rxjs-interop';
import { DataTable } from '@shared/data-table/data-table';
import { ColumnDef, PageEvent, TableConfig } from '@shared/data-table/data-table.models';
import { AuditLogEntryDto, AuditLogSearchParams } from '../model/admin.model';
import { AuditLogService } from '../service/audit-log.service';

const CATEGORIES = [
  'USER_MANAGEMENT', 'API_REGISTRY', 'INTEGRATION_REGISTRY',
  'DICTIONARY', 'SECURITY', 'ADMINISTRATION', 'DATA_ACCESS',
];

const ACTIONS = [
  'CREATE', 'UPDATE', 'DELETE', 'DEACTIVATE', 'ACTIVATE',
  'ATTACHMENT_UPLOADED', 'ATTACHMENT_UPDATED', 'ATTACHMENT_DELETED', 'ATTACHMENT_DOWNLOADED',
  'USER_ROLE_ASSIGNED', 'USER_ROLE_REVOKED',
  'EXPORT', 'IMPORT', 'LOGIN', 'LOGOUT',
  'APPROVAL_REQUESTED', 'APPROVED', 'REJECTED', 'CONFIGURATION_CHANGED',
];

const RESOURCE_TYPES = [
  'USER', 'ROLE', 'IT_SYSTEM', 'IT_SYSTEM_OWNER',
  'API', 'API_OWNER', 'API_ATTACHMENT',
  'DATA_DOMAIN', 'TRANSPORT_LAYER',
  'DICTIONARY_TYPE', 'DICTIONARY_ENTRY', 'CONFIGURATION',
];

const OUTCOMES = ['SUCCESS', 'FAILURE'];

@Component({
  selector: 'app-audit-log',
  imports: [
    DataTable,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatExpansionModule,
    MatChipsModule,
    TranslocoDirective,
  ],
  providers: [provideTranslocoScope('admin')],
  templateUrl: './audit-log.html',
  styleUrl: './audit-log.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditLog {
  private readonly service = inject(AuditLogService);
  private readonly fb = inject(FormBuilder);
  private readonly t = inject(TranslocoService);

  protected readonly lang = toSignal(this.t.langChanges$, { initialValue: this.t.getActiveLang() });
  protected readonly data = signal<AuditLogEntryDto[]>([]);
  protected readonly loading = signal(false);
  protected readonly pageIndex = signal(0);
  private readonly totalItems = signal(0);
  private readonly pageSize = signal(25);

  protected readonly categories = CATEGORIES;
  protected readonly actions = ACTIONS;
  protected readonly resourceTypes = RESOURCE_TYPES;
  protected readonly outcomes = OUTCOMES;

  protected readonly filterForm = this.fb.group({
    actorUsername: [''],
    category: [''],
    action: [''],
    resourceType: [''],
    outcome: [''],
    startDate: [''],
    endDate: [''],
  });

  protected readonly tableConfig = computed<TableConfig<AuditLogEntryDto>>(() => {
    const _lang = this.lang();
    const columns: ColumnDef<AuditLogEntryDto>[] = [
      {
        key: 'eventTime',
        label: this.t.translate('admin.auditLog.field.eventTime'),
        sortable: true,
        width: '195px',
      },
      {
        key: 'category',
        label: this.t.translate('admin.auditLog.field.category'),
        sortable: true,
        width: '155px',
      },
      {
        key: 'action',
        label: this.t.translate('admin.auditLog.field.action'),
        sortable: true,
        width: '160px',
      },
      {
        key: 'resourceType',
        label: this.t.translate('admin.auditLog.field.resourceType'),
        sortable: true,
        width: '145px',
      },
      {
        key: 'resourceName',
        label: this.t.translate('admin.auditLog.field.resourceName'),
        sortable: false,
      },
      {
        key: 'actorUsername',
        label: this.t.translate('admin.auditLog.field.actor'),
        sortable: true,
        width: '150px',
      },
      {
        key: 'outcome',
        label: this.t.translate('admin.auditLog.field.outcome'),
        sortable: true,
        width: '110px',
        badges: {
          'SUCCESS': { label: this.t.translate('admin.auditLog.outcome.SUCCESS'), color: 'success' },
          'FAILURE': { label: this.t.translate('admin.auditLog.outcome.FAILURE'), color: 'error' },
        },
      },
      {
        key: 'severity',
        label: this.t.translate('admin.auditLog.field.severity'),
        sortable: true,
        width: '100px',
        badges: {
          'INFO':     { label: this.t.translate('admin.auditLog.severity.INFO'),     color: 'neutral' },
          'WARNING':  { label: this.t.translate('admin.auditLog.severity.WARNING'),  color: 'warn' },
          'CRITICAL': { label: this.t.translate('admin.auditLog.severity.CRITICAL'), color: 'error' },
        },
      },
    ];
    return {
      tableId: 'audit-log',
      columns,
      pagination: {
        mode: 'backend',
        totalItems: this.totalItems(),
        pageSize: this.pageSize(),
        pageSizeOptions: [10, 25, 50, 100],
      },
      showFilter: false,
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

  protected applyFilters(): void {
    this.pageIndex.set(0);
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
    const params: AuditLogSearchParams = {
      page: this.pageIndex(),
      size: this.pageSize(),
      actorUsername: v.actorUsername ?? undefined,
      category:      v.category      || undefined,
      action:        v.action        || undefined,
      resourceType:  v.resourceType  || undefined,
      outcome:       v.outcome       || undefined,
      startDate:     v.startDate     ? `${v.startDate}:00` : undefined,
      endDate:       v.endDate       ? `${v.endDate}:00`   : undefined,
    };

    this.service.search(params).subscribe({
      next: (page) => {
        this.data.set(page.content);
        this.totalItems.set(page.totalElements);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
