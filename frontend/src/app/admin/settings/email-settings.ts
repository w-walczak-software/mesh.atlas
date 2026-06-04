import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslocoDirective, TranslocoService, provideTranslocoScope } from '@jsverse/transloco';
import { toSignal } from '@angular/core/rxjs-interop';
import { DataTable } from '@shared/data-table/data-table';
import { AtlasTextInput } from '@shared/text-input/text-input';
import { AtlasPageTitle } from '@shared/page-title/page-title';
import { ColumnDef, PageEvent, TableConfig } from '@shared/data-table/data-table.models';
import { ToastService } from '@shared/toast/toast.service';
import { EmailConfigDto, EmailConfigSaveRequest, EmailLogDto } from '../model/admin.model';
import { EmailConfigService } from './email-config.service';

@Component({
  selector: 'app-email-settings',
  imports: [
    AtlasPageTitle,
    AtlasTextInput,
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatTooltipModule,
    ReactiveFormsModule,
    TranslocoDirective,
    DataTable,
  ],
  providers: [provideTranslocoScope('admin')],
  templateUrl: './email-settings.html',
  styleUrl: './email-settings.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmailSettings {
  private readonly service = inject(EmailConfigService);
  private readonly toast = inject(ToastService);
  private readonly t = inject(TranslocoService);
  private readonly fb = inject(FormBuilder);

  protected readonly lang = toSignal(this.t.langChanges$, { initialValue: this.t.getActiveLang() });
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly testSending = signal(false);
  protected readonly showPassword = signal(false);
  protected readonly config = signal<EmailConfigDto | null>(null);

  protected readonly logData = signal<EmailLogDto[]>([]);
  protected readonly logLoading = signal(false);
  protected readonly logPageIndex = signal(0);
  private readonly logTotalItems = signal(0);
  private readonly logPageSize = signal(20);

  protected readonly form = this.fb.group({
    provider:        ['CUSTOM', Validators.required],
    host:            ['', [Validators.required, Validators.maxLength(255)]],
    port:            [587, [Validators.required, Validators.min(1), Validators.max(65535)]],
    username:        ['', Validators.maxLength(255)],
    password:        [''],
    fromAddress:     ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
    fromDisplayName: ['', Validators.maxLength(200)],
    encryption:      ['TLS', Validators.required],
    enabled:         [false],
  });

  protected readonly testForm = this.fb.group({
    recipient: ['', [Validators.required, Validators.email, Validators.maxLength(500)]],
  });

  protected readonly providers = [
    { value: 'GMAIL',    labelKey: 'admin.emailSettings.provider.GMAIL'    },
    { value: 'EXCHANGE', labelKey: 'admin.emailSettings.provider.EXCHANGE' },
    { value: 'CUSTOM',   labelKey: 'admin.emailSettings.provider.CUSTOM'   },
  ];

  protected readonly encryptions = [
    { value: 'TLS',  labelKey: 'admin.emailSettings.encryption.TLS'  },
    { value: 'SSL',  labelKey: 'admin.emailSettings.encryption.SSL'  },
    { value: 'NONE', labelKey: 'admin.emailSettings.encryption.NONE' },
  ];

  protected readonly logTableConfig = computed<TableConfig<EmailLogDto>>(() => {
    const _lang = this.lang();
    const columns: ColumnDef<EmailLogDto>[] = [
      {
        key: 'sentAt',
        label: this.t.translate('admin.emailSettings.log.field.sentAt'),
        sortable: true,
        width: '200px',
        cellRender: (row) => ({ text: row.sentAt ? row.sentAt.replace('T', ' ') : '—' }),
      },
      {
        key: 'recipient',
        label: this.t.translate('admin.emailSettings.log.field.recipient'),
        sortable: true,
      },
      {
        key: 'subject',
        label: this.t.translate('admin.emailSettings.log.field.subject'),
        sortable: false,
      },
      {
        key: 'status',
        label: this.t.translate('admin.emailSettings.log.field.status'),
        sortable: true,
        width: '110px',
        badges: {
          'SENT':   { label: this.t.translate('admin.emailSettings.log.status.SENT'),   color: 'success' },
          'FAILED': { label: this.t.translate('admin.emailSettings.log.status.FAILED'), color: 'error'   },
        },
      },
      {
        key: 'sentBy',
        label: this.t.translate('admin.emailSettings.log.field.sentBy'),
        sortable: false,
        width: '180px',
      },
      {
        key: 'test',
        label: this.t.translate('admin.emailSettings.log.field.isTest'),
        sortable: false,
        width: '80px',
        cellRender: (row) => row.test
          ? { icon: { name: 'science', label: this.t.translate('common.yes') } }
          : { text: '' },
      },
    ];

    return {
      tableId: 'email-log',
      columns,
      pagination: {
        mode: 'backend',
        totalItems: this.logTotalItems(),
        pageSize: this.logPageSize(),
        pageSizeOptions: [20, 50, 100],
      },
      showFilter: false,
    };
  });

  constructor() {
    this.loadConfig();
    this.loadLog();
  }

  protected saveConfig(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    const v = this.form.getRawValue();
    const request: EmailConfigSaveRequest = {
      provider:        v.provider as 'GMAIL' | 'EXCHANGE' | 'CUSTOM',
      host:            v.host ?? '',
      port:            v.port ?? 587,
      username:        v.username || null,
      password:        v.password || null,
      fromAddress:     v.fromAddress ?? '',
      fromDisplayName: v.fromDisplayName || null,
      encryption:      v.encryption as 'NONE' | 'TLS' | 'SSL',
      enabled:         v.enabled ?? false,
    };

    this.service.save(request).subscribe({
      next: (saved) => {
        this.saving.set(false);
        this.config.set(saved);
        this.toast.success(this.t.translate('admin.emailSettings.toast.saved'));
      },
      error: () => {
        this.saving.set(false);
        this.toast.error(this.t.translate('common.error.save'));
      },
    });
  }

  protected sendTestEmail(): void {
    if (this.testForm.invalid) return;
    this.testSending.set(true);
    this.service.sendTest(this.testForm.getRawValue().recipient!).subscribe({
      next: () => {
        this.testSending.set(false);
        this.toast.success(this.t.translate('admin.emailSettings.toast.testSent'));
        this.loadLog();
      },
      error: () => {
        this.testSending.set(false);
        this.toast.error(this.t.translate('admin.emailSettings.toast.testFailed'));
        this.loadLog();
      },
    });
  }

  protected onLogPageChange(event: PageEvent): void {
    this.logPageIndex.set(event.pageIndex);
    this.logPageSize.set(event.pageSize);
    this.loadLog();
  }

  private loadConfig(): void {
    this.loading.set(true);
    this.service.get().subscribe({
      next: (cfg) => {
        this.config.set(cfg);
        this.form.patchValue({
          provider:        cfg.provider,
          host:            cfg.host ?? '',
          port:            cfg.port,
          username:        cfg.username ?? '',
          fromAddress:     cfg.fromAddress ?? '',
          fromDisplayName: cfg.fromDisplayName ?? '',
          encryption:      cfg.encryption,
          enabled:         cfg.enabled,
        });
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private loadLog(): void {
    this.logLoading.set(true);
    this.service.getLog(this.logPageIndex(), this.logPageSize()).subscribe({
      next: (page) => {
        this.logData.set(page.content);
        this.logTotalItems.set(page.totalElements);
        this.logLoading.set(false);
      },
      error: () => this.logLoading.set(false),
    });
  }
}
