import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { SlicePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { TranslocoDirective, TranslocoService, provideTranslocoScope } from '@jsverse/transloco';
import { toSignal } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { ToastService } from '@shared/toast/toast.service';
import { DialogService } from '@shared/dialogs/dialog.service';
import { AuthService } from '@core/auth/auth.service';
import { HistoryDialog, HistoryDialogData } from '@shared/history/history.dialog';
import { HistoryService } from '@shared/history/history.service';
import { RevisionEntryDto, RevisionType } from '@shared/history/history.model';
import { DataDomainService } from '../service/data-domain.service';
import { DataDomainAttachmentDto, DataDomainDto } from '../model/data-domain.model';
import {
  DataDomainUploadDialog,
  DataDomainUploadDialogResult,
} from '../data-domain-upload-dialog/data-domain-upload-dialog';
import {
  DataDomainEditDescriptionDialog,
  DataDomainEditDescriptionDialogResult,
} from '../data-domain-edit-description-dialog/data-domain-edit-description-dialog';

@Component({
  selector: 'app-data-domain-form',
  imports: [
    SlicePipe,
    TranslocoDirective,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatChipsModule,
    MatTableModule,
    MatTooltipModule,
    MatProgressBarModule,
    MatDialogModule,
  ],
  providers: [provideTranslocoScope('datadomain')],
  templateUrl: './data-domain-form.html',
  styleUrl: './data-domain-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataDomainForm implements OnInit {
  private readonly service = inject(DataDomainService);
  private readonly historyService = inject(HistoryService);
  private readonly matDialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);
  private readonly dialogs = inject(DialogService);
  private readonly auth = inject(AuthService);
  private readonly t = inject(TranslocoService);
  private readonly fb = inject(FormBuilder);

  protected readonly lang = toSignal(this.t.langChanges$, { initialValue: this.t.getActiveLang() });
  protected readonly canWrite = computed(() =>
    this.auth.hasAnyRole(['atlas_admin', 'atlas_system'])
  );

  private readonly domainId = signal<string | null>(null);
  protected readonly isEditMode = computed(() => this.domainId() !== null);
  protected readonly saving = signal(false);
  protected readonly loading = signal(false);
  protected readonly uploading = signal(false);
  protected readonly domain = signal<DataDomainDto | null>(null);
  protected readonly attachments = signal<DataDomainAttachmentDto[]>([]);

  protected readonly tags = signal<string[]>([]);

  protected readonly form = this.fb.group({
    code: ['', [Validators.required, Validators.maxLength(100),
      Validators.pattern('^[A-Z][A-Z0-9_-]*$')]],
    name: ['', [Validators.required, Validators.maxLength(300)]],
    description: ['', Validators.maxLength(4000)],
    documentationUrl: ['', Validators.maxLength(2000)],
    newTag: [''],
  });

  protected readonly attachmentColumns = ['fileName', 'description', 'fileSize', 'createdAt', 'actions'];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.domainId.set(id);
      this.loadDomain(id);
      this.loadAttachments(id);
    } else {
      this.form.controls.code.enable();
    }
  }

  protected addTag(): void {
    const val = (this.form.controls.newTag.value ?? '').trim();
    if (val && !this.tags().includes(val)) {
      this.tags.update(t => [...t, val]);
    }
    this.form.controls.newTag.reset();
  }

  protected removeTag(tag: string): void {
    this.tags.update(t => t.filter(x => x !== tag));
  }

  protected onTagKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.addTag();
    }
  }

  protected triggerFileUpload(input: HTMLInputElement): void {
    input.click();
  }

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    input.value = '';

    const dialogRef = this.matDialog.open(DataDomainUploadDialog, {
      width: '560px',
      maxWidth: '95vw',
      data: { fileName: file.name },
    });

    dialogRef.afterClosed().subscribe((result: DataDomainUploadDialogResult | null) => {
      if (result === null || result === undefined) return;
      this.uploadFile(file, result.description);
    });
  }

  private uploadFile(file: File, description: string | null): void {
    const id = this.domainId();
    if (!id) return;
    this.uploading.set(true);
    this.service.uploadAttachment(id, file, description).subscribe({
      next: () => {
        this.uploading.set(false);
        this.toast.success(this.t.translate('datadomain.toast.attachmentUploaded'));
        this.loadAttachments(id);
      },
      error: () => {
        this.uploading.set(false);
        this.toast.error(this.t.translate('common.error.unexpected'));
      },
    });
  }

  protected downloadAttachment(attachment: DataDomainAttachmentDto): void {
    const id = this.domainId();
    if (!id) return;
    this.service.downloadAttachment(id, attachment.id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = attachment.fileName;
        a.click();
        URL.revokeObjectURL(url);
      },
    });
  }

  protected editAttachmentDescription(attachment: DataDomainAttachmentDto): void {
    const id = this.domainId();
    if (!id) return;
    const dialogRef = this.matDialog.open(DataDomainEditDescriptionDialog, {
      width: '560px',
      maxWidth: '95vw',
      data: { fileName: attachment.fileName, currentDescription: attachment.description },
    });
    dialogRef.afterClosed().subscribe((result: DataDomainEditDescriptionDialogResult | null) => {
      if (result === null || result === undefined) return;
      this.service.updateAttachmentDescription(id, attachment.id, result.description).subscribe({
        next: () => {
          this.toast.success(this.t.translate('datadomain.toast.attachmentUpdated'));
          this.loadAttachments(id);
        },
        error: () => this.toast.error(this.t.translate('common.error.unexpected')),
      });
    });
  }

  protected confirmDeleteAttachment(attachment: DataDomainAttachmentDto): void {
    const id = this.domainId();
    if (!id) return;
    this.dialogs.question(
      this.t.translate('datadomain.attachment.delete'),
      this.t.translate('datadomain.confirm.deleteAttachment'),
      () => {
        this.service.deleteAttachment(id, attachment.id).subscribe({
          next: () => {
            this.toast.success(this.t.translate('datadomain.toast.attachmentDeleted'));
            this.loadAttachments(id);
          },
        });
      },
    );
  }

  protected openHistory(): void {
    const id = this.domainId();
    if (!id) return;
    const domainName = this.domain()?.name ?? id;
    forkJoin({
      domain: this.historyService.getDataDomainRevisions(id),
      attachments: this.historyService.getDataDomainAttachmentHistory(id),
    }).subscribe(({ domain, attachments }) => {
      const attachmentEntries: RevisionEntryDto<unknown>[] = attachments.map(a => ({
        revisionNumber: a.revisionNumber,
        revisionType: a.revisionType as RevisionType,
        revisionTimestamp: a.revisionTimestamp,
        username: a.username,
        userId: a.userId,
        snapshot: { _kind: 'attachment', fileName: a.fileName, description: a.description },
      }));
      const allEntries = [...domain, ...attachmentEntries]
        .sort((a, b) => b.revisionNumber - a.revisionNumber);
      this.matDialog.open(HistoryDialog, {
        data: {
          title: domainName,
          entries: allEntries,
          fieldLabels: this.buildFieldLabels(),
        } satisfies HistoryDialogData,
        maxWidth: '800px',
        width: '95vw',
      });
    });
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    const v = this.form.getRawValue();
    if (this.isEditMode()) {
      this.service.update(this.domainId()!, {
        name: v.name!,
        description: v.description || null,
        documentationUrl: v.documentationUrl || null,
        tags: this.tags().length ? this.tags() : null,
        metadata: null,
      }).subscribe({
        next: () => {
          this.saving.set(false);
          this.toast.success(this.t.translate('datadomain.toast.updated'));
          this.router.navigate(['/data-domains']);
        },
        error: (err: HttpErrorResponse) => {
          this.saving.set(false);
          this.handleError(err);
        },
      });
    } else {
      this.service.create({
        code: v.code!,
        name: v.name!,
        description: v.description || null,
        documentationUrl: v.documentationUrl || null,
        tags: this.tags().length ? this.tags() : null,
        metadata: null,
      }).subscribe({
        next: (created) => {
          this.saving.set(false);
          this.toast.success(this.t.translate('datadomain.toast.created'));
          this.router.navigate(['/data-domains', created.id, 'edit']);
        },
        error: (err: HttpErrorResponse) => {
          this.saving.set(false);
          this.handleError(err);
        },
      });
    }
  }

  protected cancel(): void {
    this.router.navigate(['/data-domains']);
  }

  protected formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  private loadDomain(id: string): void {
    this.loading.set(true);
    this.service.findById(id).subscribe({
      next: (domain) => {
        this.domain.set(domain);
        this.tags.set(domain.tags ?? []);
        this.form.patchValue({
          code: domain.code,
          name: domain.name,
          description: domain.description ?? '',
          documentationUrl: domain.documentationUrl ?? '',
        });
        this.form.controls.code.disable();
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error(this.t.translate('datadomain.error.notFound'));
        this.router.navigate(['/data-domains']);
      },
    });
  }

  private loadAttachments(id: string): void {
    this.service.findAttachments(id).subscribe(list => this.attachments.set(list));
  }

  private handleError(err: HttpErrorResponse): void {
    const code: string = err.error?.code ?? '';
    if (err.status === 409 || code.includes('duplicate')) {
      const v = this.form.getRawValue();
      this.toast.error(this.t.translate('datadomain.error.duplicateCode', { code: v.code }));
    } else {
      this.toast.error(this.t.translate('common.error.unexpected'));
    }
  }

  private buildFieldLabels(): Record<string, string> {
    const tr = (k: string) => this.t.translate<string>('history.fields.' + k);
    return {
      id: tr('id'), code: tr('code'), name: tr('name'), description: tr('description'),
      documentationUrl: tr('documentationUrl'), tags: tr('tags'), active: tr('active'),
      attachments: tr('attachments'), fileName: tr('fileName'),
      createdAt: tr('createdAt'), createdBy: tr('createdBy'),
      updatedAt: tr('updatedAt'), updatedBy: tr('updatedBy'),
    };
  }
}
