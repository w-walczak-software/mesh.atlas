import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoDirective, TranslocoService, provideTranslocoScope } from '@jsverse/transloco';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { DataTable } from '@shared/data-table/data-table';
import { PageEvent, TableConfig } from '@shared/data-table/data-table.models';
import { ToastService } from '@shared/toast/toast.service';
import { AdminUserDto } from '../model/admin.model';
import { AdminUserService } from '../service/admin-user.service';
import { UserRolesDialog, UserRolesDialogData } from './user-roles-dialog';

@Component({
  selector: 'app-admin-users',
  imports: [
    DataTable,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    TranslocoDirective,
  ],
  providers: [provideTranslocoScope('admin')],
  templateUrl: './admin-users.html',
  styleUrl: './admin-users.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminUsers {
  private readonly service = inject(AdminUserService);
  private readonly matDialog = inject(MatDialog);
  private readonly toast = inject(ToastService);
  private readonly t = inject(TranslocoService);

  protected readonly lang = toSignal(this.t.langChanges$, { initialValue: this.t.getActiveLang() });
  protected readonly data = signal<AdminUserDto[]>([]);
  protected readonly loading = signal(false);
  protected readonly pageIndex = signal(0);
  private readonly totalItems = signal(0);
  private readonly pageSize = signal(20);

  protected readonly searchControl = new FormControl('');

  protected readonly tableConfig = computed<TableConfig<AdminUserDto>>(() => {
    const _lang = this.lang();
    return {
      tableId: 'admin-users',
      columns: [
        { key: 'username', label: this.t.translate('admin.user.username'), sortable: true, width: '200px' },
        { key: 'email', label: this.t.translate('admin.user.email'), sortable: true },
        { key: 'firstName', label: this.t.translate('admin.user.firstName'), sortable: true, width: '160px' },
        { key: 'lastName', label: this.t.translate('admin.user.lastName'), sortable: true, width: '160px' },
        {
          key: 'enabled',
          label: this.t.translate('admin.user.enabled'),
          width: '110px',
          sortable: true,
          badges: {
            'true': { label: this.t.translate('admin.badge.enabled'), color: 'success' },
            'false': { label: this.t.translate('admin.badge.disabled'), color: 'error' },
          },
        },
      ],
      pagination: {
        mode: 'backend',
        totalItems: this.totalItems(),
        pageSize: this.pageSize(),
        pageSizeOptions: [10, 20, 50],
      },
      showFilter: false,
      actions: [
        {
          label: this.t.translate('admin.action.manageRoles'),
          icon: 'manage_accounts',
          action: (row) => this.openRolesDialog(row),
        },
      ],
    };
  });

  constructor() {
    this.load();
    this.searchControl.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe(() => {
        this.pageIndex.set(0);
        this.load();
      });
  }

  protected onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    const search = this.searchControl.value?.trim() || undefined;
    this.service.findAll(search, this.pageIndex(), this.pageSize()).subscribe({
      next: (page) => {
        this.data.set(page.content);
        this.totalItems.set(page.totalElements);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private openRolesDialog(user: AdminUserDto): void {
    this.matDialog
      .open(UserRolesDialog, {
        width: '480px',
        maxWidth: '95vw',
        disableClose: false,
        data: { user } satisfies UserRolesDialogData,
      })
      .afterClosed()
      .subscribe((saved: boolean) => {
        if (saved) {
          this.toast.success(this.t.translate('admin.toast.rolesUpdated'));
        }
      });
  }
}
