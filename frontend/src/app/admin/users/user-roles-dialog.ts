import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoDirective, TranslocoService, provideTranslocoScope } from '@jsverse/transloco';
import { toSignal } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { AdminRoleDto, AdminUserDto } from '../model/admin.model';
import { AdminUserService } from '../service/admin-user.service';
import { AdminRoleService } from '../service/admin-role.service';

export interface UserRolesDialogData {
  user: AdminUserDto;
}

@Component({
  selector: 'app-user-roles-dialog',
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatIconModule,
    TranslocoDirective,
  ],
  providers: [provideTranslocoScope('admin')],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-container *transloco="let t; scope: 'admin'; lang: lang()">
      <div class="dlg-header">
        <div class="dlg-icon" aria-hidden="true"><mat-icon>manage_accounts</mat-icon></div>
        <h2 mat-dialog-title>{{ t('admin.dialog.manageRoles.title') }}</h2>
      </div>

      <mat-dialog-content>
        <p class="dlg-subtitle">
          <strong>{{ data.user.username }}</strong>
          @if (data.user.email) { · {{ data.user.email }} }
        </p>
        <p class="dlg-hint">{{ t('admin.dialog.manageRoles.subtitle') }}</p>

        @if (loading()) {
          <div class="dlg-spinner"><mat-spinner diameter="40" /></div>
        } @else if (allRoles().length === 0) {
          <p class="dlg-empty">{{ t('admin.dialog.manageRoles.noRoles') }}</p>
        } @else {
          <div class="role-list" role="group" [attr.aria-label]="t('admin.dialog.manageRoles.subtitle')">
            @for (role of allRoles(); track role.id) {
              <div class="role-item">
                <mat-checkbox
                  [checked]="isAssigned(role)"
                  (change)="toggle(role, $event.checked)"
                  [attr.aria-label]="role.name">
                  <span class="role-name">{{ role.name }}</span>
                  @if (role.description) {
                    <span class="role-desc">{{ role.description }}</span>
                  }
                </mat-checkbox>
              </div>
            }
          </div>
        }
      </mat-dialog-content>

      <mat-dialog-actions align="end" class="dlg-actions">
        <button mat-button type="button" (click)="cancel()">{{ t('common.cancel') }}</button>
        <button mat-flat-button type="button"
                [disabled]="loading() || saving()"
                (click)="save()">
          {{ t('common.save') }}
        </button>
      </mat-dialog-actions>
    </ng-container>
  `,
  styles: [`
    .dlg-header {
      display: flex; align-items: center; gap: 12px; padding: 20px 24px 0;
    }
    .dlg-icon {
      display: flex; align-items: center; justify-content: center;
      width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0;
      background: var(--mat-sys-primary-container); color: var(--mat-sys-on-primary-container);
    }
    .dlg-subtitle {
      font-size: 13px; color: var(--mat-sys-on-surface); margin: 0 0 4px;
    }
    .dlg-hint {
      font-size: 12px; color: var(--mat-sys-on-surface-variant); margin: 0 0 16px;
    }
    .dlg-spinner {
      display: flex; justify-content: center; padding: 24px 0;
    }
    .dlg-empty {
      font-size: 13px; color: var(--mat-sys-on-surface-variant); text-align: center;
      padding: 24px 0;
    }
    .role-list {
      display: flex; flex-direction: column; gap: 4px;
    }
    .role-item {
      padding: 4px 0;
    }
    .role-name {
      font-size: 14px; font-weight: 500;
    }
    .role-desc {
      display: block; font-size: 12px; color: var(--mat-sys-on-surface-variant);
      margin-top: 2px;
    }
  `],
})
export class UserRolesDialog implements OnInit {
  protected readonly data = inject<UserRolesDialogData>(MAT_DIALOG_DATA);
  private readonly ref = inject(MatDialogRef<UserRolesDialog>);
  private readonly userService = inject(AdminUserService);
  private readonly roleService = inject(AdminRoleService);
  private readonly t = inject(TranslocoService);

  protected readonly lang = toSignal(this.t.langChanges$, { initialValue: this.t.getActiveLang() });
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly allRoles = signal<AdminRoleDto[]>([]);
  private readonly assignedRoleIds = signal<Set<string>>(new Set());

  ngOnInit(): void {
    forkJoin({
      all: this.roleService.findAll(),
      assigned: this.userService.getUserRoles(this.data.user.id),
    }).subscribe({
      next: ({ all, assigned }) => {
        this.allRoles.set(all);
        this.assignedRoleIds.set(new Set(assigned.map(r => r.id)));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  protected isAssigned(role: AdminRoleDto): boolean {
    return this.assignedRoleIds().has(role.id);
  }

  protected toggle(role: AdminRoleDto, checked: boolean): void {
    this.assignedRoleIds.update(ids => {
      const next = new Set(ids);
      if (checked) {
        next.add(role.id);
      } else {
        next.delete(role.id);
      }
      return next;
    });
  }

  protected save(): void {
    this.saving.set(true);
    const assignedIds = this.assignedRoleIds();
    const roleNames = this.allRoles()
      .filter(r => assignedIds.has(r.id))
      .map(r => r.name);

    this.userService.setUserRoles(this.data.user.id, { roleNames }).subscribe({
      next: () => {
        this.saving.set(false);
        this.ref.close(true);
      },
      error: () => this.saving.set(false),
    });
  }

  protected cancel(): void {
    this.ref.close(false);
  }
}
