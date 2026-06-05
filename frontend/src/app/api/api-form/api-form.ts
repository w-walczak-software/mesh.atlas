import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { LowerCasePipe, SlicePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { TranslocoDirective, TranslocoService, provideTranslocoScope } from '@jsverse/transloco';
import { toSignal } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastService } from '@shared/toast/toast.service';
import { AtlasTextInput } from '@shared/text-input/text-input';
import { AtlasTextarea } from '@shared/textarea/textarea';
import { AtlasNumberInput } from '@shared/number-input/number-input';
import { AtlasCardHeader } from '@shared/card-header/card-header';
import { AtlasTagInput } from '@shared/tag/tag-input';
import { AtlasTagChips } from '@shared/tag/tag-chips';
import { AppSimpleTable } from '@shared/simple-table/simple-table';
import { AppSimpleTableColumn } from '@shared/simple-table/simple-table-column';
import { AppToolbar } from '@shared/toolbar/toolbar';
import { AtlasSelectDictionary } from '@shared/select/select-dictionary';
import { AtlasSelectStatus, AtlasSelectType, AtlasSelectDataFlowDirection, AtlasSelectContractType } from '@shared/select/select-domain-selects';
import { AtlasSelectTransportLayer } from '@shared/select/select-transport-layer';
import { AtlasSelectDomainGroup } from '@shared/select/select-domain-group';
import { AtlasSelectDataDomains } from '@shared/select/select-data-domains';
import { DialogService } from '@shared/dialogs/dialog.service';
import { AuthService } from '@core/auth/auth.service';
import { HistoryDialog, HistoryDialogData } from '@shared/history/history.dialog';
import { HistoryService } from '@shared/history/history.service';
import { RevisionEntryDto, RevisionType } from '@shared/history/history.model';
import { DictionaryEntryDto } from '../../dictionary/model/dictionary.model';
import { DictionaryEntryService } from '../../dictionary/service/dictionary-entry.service';
import { ItSystemSelectComponent } from '@shared/it-system-select/it-system-select';
import { TransportLayerSummaryDto } from '../../transportlayer/model/transport-layer.model';
import { TransportLayerService } from '../../transportlayer/service/transport-layer.service';
import { DataDomainSummaryDto } from '../../datadomain/model/data-domain.model';
import { DataDomainService } from '../../datadomain/service/data-domain.service';
import { ApiService } from '../service/api.service';
import { ApiAttachmentDto, ApiDto, ApiMessagingEndpointDto, ApiOwnerCreateRequest, ApiOwnerDto } from '../model/api.model';
import { ItSystemSummaryDto } from '../../itsystem/model/itsystem.model';
import { ItSystemService } from '../../itsystem/service/itsystem.service';
import { ApiOwnerDialog, ApiOwnerDialogData } from './api-owner.dialog';
import { ApiVerifyDialog, ApiVerifyDialogData } from './api-verify.dialog';
import { ApiMessagingEndpointDialog, ApiMessagingEndpointDialogData } from './api-messaging-endpoint.dialog';
import { GovernanceService } from '@shared/governance/governance.service';
import { ApiUploadDialog, ApiUploadDialogData, ApiUploadDialogResult } from '../api-upload-dialog/api-upload-dialog';
import { ApiEditAttachmentDialog, ApiEditAttachmentDialogData, ApiEditAttachmentDialogResult } from '../api-edit-attachment-dialog/api-edit-attachment-dialog';

@Component({
  selector: 'app-api-form',
  imports: [
    AtlasCardHeader,
    AtlasTextInput,
    AtlasTextarea,
    AtlasNumberInput,
    AtlasSelectDictionary,
    AtlasSelectStatus,
    AtlasSelectType,
    AtlasSelectDataFlowDirection,
    AtlasSelectContractType,
    AtlasSelectTransportLayer,
    AtlasSelectDomainGroup,
    AtlasSelectDataDomains,
    AtlasTagInput,
    AtlasTagChips,
    AppSimpleTable,
    AppSimpleTableColumn,
    AppToolbar,
    LowerCasePipe,
    SlicePipe,
    TranslocoDirective,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatSelectModule,
    MatIconModule,
    MatDialogModule,
    MatTooltipModule,
    MatProgressBarModule,
    MatDividerModule,
    ItSystemSelectComponent,
  ],
  providers: [provideTranslocoScope('api')],
  templateUrl: './api-form.html',
  styleUrl: './api-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApiForm implements OnInit {
  private readonly service = inject(ApiService);
  private readonly itSystemService = inject(ItSystemService);
  private readonly historyService = inject(HistoryService);
  private readonly entryService = inject(DictionaryEntryService);
  private readonly transportLayerService = inject(TransportLayerService);

  private readonly governanceService = inject(GovernanceService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);
  private readonly dialogs = inject(DialogService);
  private readonly auth = inject(AuthService);
  private readonly matDialog = inject(MatDialog);
  private readonly t = inject(TranslocoService);
  private readonly fb = inject(FormBuilder);

  protected readonly lang = toSignal(this.t.langChanges$, { initialValue: this.t.getActiveLang() });
  protected readonly canWrite = computed(() =>
    this.auth.hasAnyRole(['atlas_admin', 'atlas_system'])
  );
  protected readonly isAdmin = computed(() => this.auth.hasAnyRole(['atlas_admin', 'ATLAS_ADMIN']));
  /** Non-admin: restricted list of producer systems; null means no restriction (admin). */
  protected readonly allowedProducerSystems = signal<ItSystemSummaryDto[] | null>(null);

  private readonly apiId = signal<string | null>(null);
  protected readonly isEditMode = computed(() => this.apiId() !== null);
  protected readonly saving = signal(false);
  protected readonly loading = signal(false);
  protected readonly uploading = signal(false);
  protected readonly api = signal<ApiDto | null>(null);
  protected readonly owners = signal<ApiOwnerDto[]>([]);
  protected readonly attachments = signal<ApiAttachmentDto[]>([]);
  protected readonly governanceEnabled = signal(false);

  protected readonly attachmentStatuses = signal<DictionaryEntryDto[]>([]);
  protected readonly ownerRoles = signal<DictionaryEntryDto[]>([]);
  protected readonly contractTypes = signal<DictionaryEntryDto[]>([]);
  protected readonly selectedGroupId = signal<string | null>(null);
  protected readonly messagingEndpointTypes = signal<DictionaryEntryDto[]>([]);
  protected readonly messagingDirections = signal<DictionaryEntryDto[]>([]);
  protected readonly messageFormats = signal<DictionaryEntryDto[]>([]);
  protected readonly messagingEndpoints = signal<ApiMessagingEndpointDto[]>([]);
  private readonly allTransportLayers = signal<TransportLayerSummaryDto[]>([]);

  protected readonly selectedTransportLayer = computed(() => {
    const id = this.transportLayerId$();
    if (!id) return null;
    return this.allTransportLayers().find(tl => tl.id === id) ?? null;
  });

  protected readonly supportsEndpointRegistration = computed(() => {
    const tl = this.selectedTransportLayer();
    return tl?.metadata?.['supportsEndpointRegistration'] === true;
  });

  protected readonly endpointSectionLabel = computed(() => {
    const tl = this.selectedTransportLayer();
    if (!tl?.metadata) return this.t.translate<string>('api.messagingEndpoint.defaultSectionTitle');
    const lang = this.lang();
    const labelEn = (tl.metadata['endpointLabel'] as string) ?? '';
    const labelPl = (tl.metadata['endpointLabelPl'] as string) ?? labelEn;
    return lang === 'pl' ? labelPl : labelEn;
  });

  protected readonly tags = signal<string[]>([]);

  protected readonly form = this.fb.group({
    code: ['', [Validators.maxLength(100),
      Validators.pattern('^[A-Z][A-Z0-9_-]*$')]],
    name: ['', [Validators.required, Validators.maxLength(300)]],
    externalId: ['', Validators.maxLength(50)],
    description: ['', Validators.maxLength(4000)],
    apiVersion: ['', Validators.maxLength(100)],
    statusId: [null as string | null, Validators.required],
    typeId: [null as string | null],
    producerSystemId: [null as string | null],
    dataFlowDirectionId: [null as string | null],
    consumerSystemIds: [[] as string[]],
    transportLayerId: [null as string | null],
    protocolId: [null as string | null],
    authenticationMethodId: [null as string | null],
    securityPolicyId: [null as string | null],
    integrationPatternId: [null as string | null],
    messageFormatId: [null as string | null],
    slaResponseTimeMs: [null as number | null, Validators.min(0)],
    slaUptimePct: [null as number | null, [Validators.min(0), Validators.max(100)]],
    slaTierId: [null as string | null],
    slaDescription: ['', Validators.maxLength(2000)],
    contractTypeId: [null as string | null],
    contractVersion: ['', Validators.maxLength(100)],
    contractUrl: ['', Validators.maxLength(2000)],
    documentationUrl: ['', Validators.maxLength(2000)],
    dataDomainIds: [[] as string[]],
    environmentIds: [[] as string[]],
    newTag: [''],
  });

  private readonly producerSystemId$ = toSignal(
    this.form.controls.producerSystemId.valueChanges,
    { initialValue: null },
  );

  private readonly transportLayerId$ = toSignal(
    this.form.controls.transportLayerId.valueChanges,
    { initialValue: null },
  );

  protected readonly excludeFromConsumer = computed(() => {
    const id = this.producerSystemId$();
    return id ? [id] : [];
  });


  ngOnInit(): void {
    this.loadDictionaries();
    this.governanceService.isGovernanceEnabledOnApiCreate().subscribe(enabled => this.governanceEnabled.set(enabled));
    if (!this.canWrite()) {
      this.itSystemService.getMyProducerSystems().subscribe(systems =>
        this.allowedProducerSystems.set(systems)
      );
    }
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.apiId.set(id);
      this.loadApi(id);
      this.loadOwners(id);
      this.loadAttachments(id);
      this.loadMessagingEndpoints(id);
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

  protected openAddOwnerDialog(): void {
    this.matDialog
      .open(ApiOwnerDialog, {
        width: '560px',
        maxWidth: '95vw',
        disableClose: true,
        data: { apiId: this.apiId(), roles: this.ownerRoles(), owner: null } satisfies ApiOwnerDialogData,
      })
      .afterClosed()
      .subscribe((result: ApiOwnerDto | undefined) => {
        if (!result) return;
        if (this.isEditMode()) {
          this.toast.success(this.t.translate('api.toast.ownerAdded'));
          this.loadOwners(this.apiId()!);
        } else {
          this.owners.update(list => [...list, result]);
        }
      });
  }

  protected openEditOwnerDialog(owner: ApiOwnerDto): void {
    this.matDialog
      .open(ApiOwnerDialog, {
        width: '560px',
        maxWidth: '95vw',
        disableClose: true,
        data: { apiId: this.apiId(), roles: this.ownerRoles(), owner } satisfies ApiOwnerDialogData,
      })
      .afterClosed()
      .subscribe((result: ApiOwnerDto | undefined) => {
        if (!result) return;
        if (this.isEditMode()) {
          this.toast.success(this.t.translate('api.toast.ownerUpdated'));
          this.loadOwners(this.apiId()!);
        } else {
          this.owners.update(list => list.map(o => o.id === result.id ? result : o));
        }
      });
  }

  protected confirmDeleteOwner(owner: ApiOwnerDto): void {
    this.dialogs.question(
      this.t.translate('api.owner.delete'),
      this.t.translate('api.confirm.deleteOwner'),
      () => {
        if (!this.isEditMode()) {
          this.owners.update(list => list.filter(o => o.id !== owner.id));
          return;
        }
        this.service.deleteOwner(this.apiId()!, owner.id).subscribe({
          next: () => {
            this.toast.success(this.t.translate('api.toast.ownerDeleted'));
            this.loadOwners(this.apiId()!);
          },
        });
      },
    );
  }

  protected triggerFileUpload(input: HTMLInputElement): void {
    input.click();
  }

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    input.value = '';

    this.matDialog.open(ApiUploadDialog, {
      width: '600px',
      maxWidth: '95vw',
      data: {
        file,
        contractTypes:      this.contractTypes(),
        attachmentStatuses: this.attachmentStatuses(),
      } satisfies ApiUploadDialogData,
    }).afterClosed().subscribe((result: ApiUploadDialogResult | null) => {
      if (result === null || result === undefined) return;
      this.uploadFile(file, result.description, result.contractTypeId,
                      result.attachmentVersion, result.attachmentStatusId);
    });
  }

  private uploadFile(
    file: File,
    description: string | null,
    contractTypeId: string | null,
    attachmentVersion: string | null = null,
    attachmentStatusId: string | null = null,
  ): void {
    const id = this.apiId();
    if (!id) return;
    this.uploading.set(true);
    this.service.uploadAttachment(id, file, description, contractTypeId, attachmentVersion, attachmentStatusId).subscribe({
      next: () => {
        this.uploading.set(false);
        this.toast.success(this.t.translate('api.toast.attachmentUploaded'));
        this.loadAttachments(id);
      },
      error: () => {
        this.uploading.set(false);
        this.toast.error(this.t.translate('common.error.unexpected'));
      },
    });
  }

  protected downloadAttachment(attachment: ApiAttachmentDto): void {
    const id = this.apiId();
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

  protected editAttachment(attachment: ApiAttachmentDto): void {
    const id = this.apiId();
    if (!id) return;
    this.matDialog.open(ApiEditAttachmentDialog, {
      width: '600px',
      maxWidth: '95vw',
      data: {
        fileName:                  attachment.fileName,
        currentDescription:        attachment.description,
        currentContractTypeId:     attachment.contractType?.id ?? null,
        currentAttachmentVersion:  attachment.attachmentVersion,
        currentAttachmentStatusId: attachment.attachmentStatus?.id ?? null,
        contractTypes:             this.contractTypes(),
        attachmentStatuses:        this.attachmentStatuses(),
      } satisfies ApiEditAttachmentDialogData,
    }).afterClosed().subscribe((result: ApiEditAttachmentDialogResult | null) => {
      if (result === null || result === undefined) return;
      this.service.updateAttachment(
        id, attachment.id,
        result.description, result.contractTypeId,
        result.attachmentVersion, result.attachmentStatusId,
      ).subscribe({
        next: () => {
          this.toast.success(this.t.translate('api.toast.attachmentUpdated'));
          this.loadAttachments(id);
        },
        error: () => this.toast.error(this.t.translate('common.error.unexpected')),
      });
    });
  }

  protected confirmDeleteAttachment(attachment: ApiAttachmentDto): void {
    const id = this.apiId();
    if (!id) return;
    this.dialogs.question(
      this.t.translate('api.attachment.delete'),
      this.t.translate('api.confirm.deleteAttachment'),
      () => {
        this.service.deleteAttachment(id, attachment.id).subscribe({
          next: () => {
            this.toast.success(this.t.translate('api.toast.attachmentDeleted'));
            this.loadAttachments(id);
          },
        });
      },
    );
  }

  protected formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (!this.isEditMode() && this.governanceEnabled() && !this.owners().length) {
      this.toast.error(this.t.translate('api.error.governanceOwnerRequired'));
      return;
    }
    this.saving.set(true);
    const v = this.form.getRawValue();
    const payload = {
      name: v.name!,
      description: v.description || null,
      apiVersion: v.apiVersion || null,
      statusId: v.statusId!,
      typeId: v.typeId || null,
      producerSystemId: v.producerSystemId || null,
      dataFlowDirectionId: v.dataFlowDirectionId || null,
      consumerSystemIds: (v.consumerSystemIds ?? []).length ? v.consumerSystemIds : null,
      transportLayerId: v.transportLayerId || null,
      protocolId: v.protocolId || null,
      authenticationMethodId: v.authenticationMethodId || null,
      securityPolicyId: v.securityPolicyId || null,
      integrationPatternId: v.integrationPatternId || null,
      messageFormatId: v.messageFormatId || null,
      slaResponseTimeMs: v.slaResponseTimeMs ?? null,
      slaUptimePct: v.slaUptimePct ?? null,
      slaTierId: v.slaTierId || null,
      slaDescription: v.slaDescription || null,
      contractTypeId: v.contractTypeId || null,
      contractVersion: v.contractVersion || null,
      contractUrl: v.contractUrl || null,
      documentationUrl: v.documentationUrl || null,
      tags: this.tags().length ? this.tags() : null,
      dataDomainIds: (v.dataDomainIds ?? []).length ? v.dataDomainIds : null,
      environmentIds: (v.environmentIds ?? []).length ? v.environmentIds : null,
      externalId: v.externalId || null,
    };

    if (this.isEditMode()) {
      this.service.update(this.apiId()!, payload).subscribe({
        next: () => {
          this.saving.set(false);
          this.toast.success(this.t.translate('api.toast.updated'));
          this.router.navigate(['/apis']);
        },
        error: (err: HttpErrorResponse) => {
          this.saving.set(false);
          this.handleError(err);
        },
      });
    } else {
      const owners: ApiOwnerCreateRequest[] = this.owners().map(o => ({
        roleId: o.role.id,
        firstName: o.firstName,
        lastName: o.lastName,
        email: o.email,
        validFrom: o.validFrom,
        validTo: o.validTo,
      }));
      const messagingEndpointRequests = this.messagingEndpoints().map((e, idx) => ({
        name: e.name,
        endpointTypeId: e.endpointType?.id ?? null,
        directionId: e.direction?.id ?? null,
        messageFormatId: e.messageFormat?.id ?? null,
        description: e.description,
        displayOrder: idx,
      }));
      this.service.create({
        ...payload,
        code: v.code || null,
        owners: owners.length ? owners : null,
        messagingEndpoints: messagingEndpointRequests.length ? messagingEndpointRequests : null,
      }).subscribe({
        next: (created) => {
          this.saving.set(false);
          this.toast.success(this.t.translate('api.toast.created'));
          this.router.navigate(['/apis'], { state: { selectId: created.id } });
        },
        error: (err: HttpErrorResponse) => {
          this.saving.set(false);
          this.handleError(err);
        },
      });
    }
  }

  protected openApproveDialog(): void {
    const id = this.apiId();
    if (!id) return;
    this.matDialog.open(ApiVerifyDialog, {
      width: '480px', maxWidth: '95vw', disableClose: true,
      data: { apiId: id, action: 'approve' } satisfies ApiVerifyDialogData,
    }).afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.toast.success(this.t.translate('api.governance.toastApproved'));
        this.loadApi(id);
      }
    });
  }

  protected openRejectDialog(): void {
    const id = this.apiId();
    if (!id) return;
    this.matDialog.open(ApiVerifyDialog, {
      width: '480px', maxWidth: '95vw', disableClose: true,
      data: { apiId: id, action: 'reject' } satisfies ApiVerifyDialogData,
    }).afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.toast.success(this.t.translate('api.governance.toastRejected'));
        this.loadApi(id);
      }
    });
  }

  protected cancel(): void {
    const id = this.apiId();
    this.router.navigate(['/apis'], id ? { state: { selectId: id } } : undefined);
  }

  protected openHistory(): void {
    const id = this.apiId();
    if (!id) return;
    const apiName = this.api()?.name ?? id;
    forkJoin({
      api: this.historyService.getApiRevisions(id),
      attachments: this.historyService.getApiAttachmentHistory(id),
      owners: this.historyService.getApiOwnerHistory(id),
      consumers: this.historyService.getApiConsumerSystemHistory(id),
    }).subscribe(({ api, attachments, owners, consumers }) => {
      const attachmentEntries: RevisionEntryDto<unknown>[] = attachments.map(a => ({
        revisionNumber: a.revisionNumber,
        revisionType: a.revisionType as RevisionType,
        revisionTimestamp: a.revisionTimestamp,
        username: a.username,
        userId: a.userId,
        snapshot: { _kind: 'attachment', fileName: a.fileName, description: a.description, contractType: a.contractTypeName },
      }));
      const ownerEntries: RevisionEntryDto<unknown>[] = owners.map(o => ({
        revisionNumber: o.revisionNumber,
        revisionType: o.revisionType as RevisionType,
        revisionTimestamp: o.revisionTimestamp,
        username: o.username,
        userId: o.userId,
        snapshot: { _kind: 'owner', firstName: o.firstName, lastName: o.lastName, email: o.email, role: o.roleName, validFrom: o.validFrom, validTo: o.validTo },
      }));
      const consumerEntries: RevisionEntryDto<unknown>[] = consumers.map(c => ({
        revisionNumber: c.revisionNumber,
        revisionType: c.revisionType as RevisionType,
        revisionTimestamp: c.revisionTimestamp,
        username: c.username,
        userId: c.userId,
        snapshot: { _kind: 'consumerSystem', systemCode: c.systemCode, systemName: c.systemName },
      }));
      const allEntries = [...api, ...attachmentEntries, ...ownerEntries, ...consumerEntries]
        .sort((a, b) => b.revisionNumber - a.revisionNumber);
      this.matDialog.open(HistoryDialog, {
        data: {
          title: apiName,
          entries: allEntries,
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
      id: tr('id'), code: tr('code'), name: tr('name'), description: tr('description'),
      apiVersion: tr('apiVersion'), type: tr('type'), status: tr('status'),
      producerSystem: tr('producerSystem'), dataFlowDirection: tr('dataFlowDirection'),
      transportLayer: tr('transportLayer'), protocol: tr('protocol'),
      authenticationMethod: tr('authenticationMethod'), securityPolicy: tr('securityPolicy'),
      integrationPattern: tr('integrationPattern'), messageFormat: tr('messageFormat'),
      slaResponseTimeMs: tr('slaResponseTimeMs'), slaUptimePct: tr('slaUptimePct'),
      slaTier: tr('slaTier'), slaDescription: tr('slaDescription'),
      contractType: tr('contractType'), contractUrl: tr('contractUrl'),
      documentationUrl: tr('documentationUrl'), tags: tr('tags'),
      environments: tr('environments'), active: tr('active'),
      createdAt: tr('createdAt'), createdBy: tr('createdBy'),
      updatedAt: tr('updatedAt'), updatedBy: tr('updatedBy'),
      fileName: tr('fileName'), attachments: tr('attachments'),
      firstName: tr('firstName'), lastName: tr('lastName'), email: tr('email'),
      role: tr('role'), validFrom: tr('validFrom'), validTo: tr('validTo'),
      systemCode: tr('systemCode'), systemName: tr('systemName'),
    };
  }

  private loadApi(id: string): void {
    this.loading.set(true);
    this.service.findById(id).subscribe({
      next: (api) => {
        this.api.set(api);
        this.tags.set(api.tags ?? []);
        this.form.patchValue({
          code: api.code,
          name: api.name,
          description: api.description ?? '',
          apiVersion: api.apiVersion ?? '',
          statusId: api.status?.id ?? null,
          typeId: api.type?.id ?? null,
          producerSystemId: api.producerSystem?.id ?? null,
          dataFlowDirectionId: api.dataFlowDirection?.id ?? null,
          consumerSystemIds: (api.consumerSystems ?? []).map(s => s.id),
          transportLayerId: api.transportLayer?.id ?? null,
          protocolId: api.protocol?.id ?? null,
          authenticationMethodId: api.authenticationMethod?.id ?? null,
          securityPolicyId: api.securityPolicy?.id ?? null,
          integrationPatternId: api.integrationPattern?.id ?? null,
          messageFormatId: api.messageFormat?.id ?? null,
          slaResponseTimeMs: api.slaResponseTimeMs ?? null,
          slaUptimePct: api.slaUptimePct ?? null,
          slaTierId: api.slaTier?.id ?? null,
          slaDescription: api.slaDescription ?? '',
          contractTypeId: api.contractType?.id ?? null,
          contractVersion: api.contractVersion ?? '',
          contractUrl: api.contractUrl ?? '',
          documentationUrl: api.documentationUrl ?? '',
          dataDomainIds: api.dataDomains.map(d => d.id),
          environmentIds: (api.environments ?? []).map(e => e.id),
          externalId: api.externalId ?? '',
        });
        this.form.controls.code.disable();
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error(this.t.translate('api.error.notFound'));
        this.router.navigate(['/apis']);
      },
    });
  }

  private loadOwners(id: string): void {
    this.service.findOwners(id).subscribe(owners => this.owners.set(owners));
  }

  private loadAttachments(id: string): void {
    this.service.findAttachments(id).subscribe(list => this.attachments.set(list));
  }

  private loadMessagingEndpoints(id: string): void {
    this.service.findMessagingEndpoints(id).subscribe(list => this.messagingEndpoints.set(list));
  }

  protected openAddMessagingEndpointDialog(): void {
    this.matDialog
      .open(ApiMessagingEndpointDialog, {
        width: '560px',
        maxWidth: '95vw',
        disableClose: true,
        data: {
          apiId: this.apiId(),
          endpointTypes: this.messagingEndpointTypes(),
          directions: this.messagingDirections(),
          messageFormats: this.messageFormats(),
          endpoint: null,
          displayOrder: this.messagingEndpoints().length,
        } satisfies ApiMessagingEndpointDialogData,
      })
      .afterClosed()
      .subscribe((result: ApiMessagingEndpointDto | undefined) => {
        if (!result) return;
        if (this.isEditMode()) {
          this.toast.success(this.t.translate('api.messagingEndpoint.toast.added'));
          this.loadMessagingEndpoints(this.apiId()!);
        } else {
          this.messagingEndpoints.update(list => [...list, result]);
        }
      });
  }

  protected openEditMessagingEndpointDialog(endpoint: ApiMessagingEndpointDto): void {
    this.matDialog
      .open(ApiMessagingEndpointDialog, {
        width: '560px',
        maxWidth: '95vw',
        disableClose: true,
        data: {
          apiId: this.apiId(),
          endpointTypes: this.messagingEndpointTypes(),
          directions: this.messagingDirections(),
          messageFormats: this.messageFormats(),
          endpoint,
          displayOrder: endpoint.displayOrder,
        } satisfies ApiMessagingEndpointDialogData,
      })
      .afterClosed()
      .subscribe((result: ApiMessagingEndpointDto | undefined) => {
        if (!result) return;
        if (this.isEditMode()) {
          this.toast.success(this.t.translate('api.messagingEndpoint.toast.updated'));
          this.loadMessagingEndpoints(this.apiId()!);
        } else {
          this.messagingEndpoints.update(list => list.map(e => e.id === result.id ? result : e));
        }
      });
  }

  protected confirmDeleteMessagingEndpoint(endpoint: ApiMessagingEndpointDto): void {
    this.dialogs.question(
      this.t.translate('api.messagingEndpoint.delete'),
      this.t.translate('api.messagingEndpoint.confirmDelete'),
      () => {
        if (!this.isEditMode()) {
          this.messagingEndpoints.update(list => list.filter(e => e.id !== endpoint.id));
          return;
        }
        this.service.deleteMessagingEndpoint(this.apiId()!, endpoint.id).subscribe({
          next: () => {
            this.toast.success(this.t.translate('api.messagingEndpoint.toast.deleted'));
            this.loadMessagingEndpoints(this.apiId()!);
          },
        });
      },
    );
  }

  private loadDictionaries(): void {
    this.entryService.findByTypeCode('ATTACHMENT_STATUS').subscribe(e => this.attachmentStatuses.set(e));
    this.entryService.findByTypeCode('API_OWNER_ROLE').subscribe(e => this.ownerRoles.set(e));
    this.entryService.findByTypeCode('CONTRACT_TYPE').subscribe(e => this.contractTypes.set(e));
    this.entryService.findByTypeCode('MESSAGING_ENDPOINT_TYPE').subscribe(e => this.messagingEndpointTypes.set(e));
    this.entryService.findByTypeCode('MESSAGING_DIRECTION').subscribe(e => this.messagingDirections.set(e));
    this.entryService.findByTypeCode('MESSAGE_FORMAT').subscribe(e => this.messageFormats.set(e));
    this.transportLayerService.findAll({ active: true, size: 200, sort: 'name' })
      .subscribe(p => this.allTransportLayers.set(p.content));
  }

  private handleError(err: HttpErrorResponse): void {
    const code: string = err.error?.code ?? '';
    if (err.status === 409 || code.includes('duplicate')) {
      const v = this.form.getRawValue();
      this.toast.error(this.t.translate('api.error.duplicateCode', { code: v.code }));
    } else if (err.status === 400 && code === 'api.consumer.conflict') {
      this.toast.error(this.t.translate('api.error.consumerConflict'));
    } else {
      this.toast.error(this.t.translate('common.error.unexpected'));
    }
  }
}
