import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { TranslocoDirective, TranslocoService, provideTranslocoScope } from '@jsverse/transloco';
import { toSignal } from '@angular/core/rxjs-interop';
import { DataTable } from '@shared/data-table/data-table';
import { AtlasPageTitle } from '@shared/page-title/page-title';
import { TableConfig } from '@shared/data-table/data-table.models';
import { AdminRoleDto } from '../model/admin.model';
import { AdminRoleService } from '../service/admin-role.service';

@Component({
  selector: 'app-admin-roles',
  imports: [AtlasPageTitle, DataTable, TranslocoDirective],
  providers: [provideTranslocoScope('admin')],
  templateUrl: './admin-roles.html',
  styleUrl: './admin-roles.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminRoles {
  private readonly service = inject(AdminRoleService);
  private readonly t = inject(TranslocoService);

  protected readonly lang = toSignal(this.t.langChanges$, { initialValue: this.t.getActiveLang() });
  protected readonly data = signal<AdminRoleDto[]>([]);
  protected readonly loading = signal(false);

  protected readonly tableConfig = computed<TableConfig<AdminRoleDto>>(() => {
    const _lang = this.lang();
    return {
      tableId: 'admin-roles',
      columns: [
        { key: 'name', label: this.t.translate('admin.role.name'), sortable: true, width: '220px' },
        { key: 'description', label: this.t.translate('admin.role.description'), sortable: true },
        {
          key: 'clientRole',
          label: this.t.translate('admin.role.type'),
          width: '120px',
          sortable: true,
          badges: {
            'true': { label: this.t.translate('admin.badge.clientRole'), color: 'secondary' },
            'false': { label: this.t.translate('admin.badge.realmRole'), color: 'neutral' },
          },
        },
        {
          key: 'composite',
          label: this.t.translate('admin.role.composite'),
          width: '120px',
          sortable: true,
          badges: {
            'true': { label: this.t.translate('common.yes'), color: 'warn' },
            'false': { label: this.t.translate('common.no'), color: 'neutral' },
          },
        },
      ],
      pagination: {
        mode: 'frontend',
        pageSize: 20,
        pageSizeOptions: [10, 20, 50],
      },
      showFilter: true,
    };
  });

  constructor() {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.service.findAll().subscribe({
      next: (roles) => {
        this.data.set(roles);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
