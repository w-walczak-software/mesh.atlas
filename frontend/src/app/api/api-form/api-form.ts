import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslocoDirective, TranslocoService, provideTranslocoScope } from '@jsverse/transloco';
import { toSignal } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastService } from '@shared/toast/toast.service';
import { DialogService } from '@shared/dialogs/dialog.service';
import { HistoryDialog, HistoryDialogData } from '@shared/history/history.dialog';
import { HistoryService } from '@shared/history/history.service';
import { DictionaryEntryDto } from '../../dictionary/model/dictionary.model';
import { DictionaryEntryService } from '../../dictionary/service/dictionary-entry.service';
import { ItSystemSummaryDto } from '../../itsystem/model/itsystem.model';
import { ItSystemService } from '../../itsystem/service/itsystem.service';
import { TransportLayerSummaryDto } from '../../transportlayer/model/transport-layer.model';
import { TransportLayerService } from '../../transportlayer/service/transport-layer.service';
import { DataDomainSummaryDto } from '../../datadomain/model/data-domain.model';
import { DataDomainService } from '../../datadomain/service/data-domain.service';
import { ApiService } from '../service/api.service';
import { ApiDto, ApiOwnerCreateRequest, ApiOwnerDto } from '../model/api.model';
import { ApiOwnerDialog, ApiOwnerDialogData } from './api-owner.dialog';

@Component({
  selector: 'app-api-form',
  imports: [
    TranslocoDirective,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatChipsModule,
    MatDialogModule,
    MatTableModule,
    MatTooltipModule,
  ],
  providers: [provideTranslocoScope('api')],
  templateUrl: './api-form.html',
  styleUrl: './api-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApiForm implements OnInit {
  private readonly service = inject(ApiService);
  private readonly historyService = inject(HistoryService);
  private readonly entryService = inject(DictionaryEntryService);
  private readonly itSystemService = inject(ItSystemService);
  private readonly transportLayerService = inject(TransportLayerService);
  private readonly dataDomainService = inject(DataDomainService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);
  private readonly dialogs = inject(DialogService);
  private readonly matDialog = inject(MatDialog);
  private readonly t = inject(TranslocoService);
  private readonly fb = inject(FormBuilder);

  protected readonly lang = toSignal(this.t.langChanges$, { initialValue: this.t.getActiveLang() });

  private readonly apiId = signal<string | null>(null);
  protected readonly isEditMode = computed(() => this.apiId() !== null);
  protected readonly saving = signal(false);
  protected readonly loading = signal(false);
  protected readonly api = signal<ApiDto | null>(null);
  protected readonly owners = signal<ApiOwnerDto[]>([]);

  protected readonly statuses = signal<DictionaryEntryDto[]>([]);
  protected readonly types = signal<DictionaryEntryDto[]>([]);
  protected readonly protocols = signal<DictionaryEntryDto[]>([]);
  protected readonly authMethods = signal<DictionaryEntryDto[]>([]);
  protected readonly securityPolicies = signal<DictionaryEntryDto[]>([]);
  protected readonly integrationPatterns = signal<DictionaryEntryDto[]>([]);
  protected readonly messageFormats = signal<DictionaryEntryDto[]>([]);
  protected readonly slaTiers = signal<DictionaryEntryDto[]>([]);
  protected readonly contractTypes = signal<DictionaryEntryDto[]>([]);
  protected readonly ownerRoles = signal<DictionaryEntryDto[]>([]);
  protected readonly itSystems = signal<ItSystemSummaryDto[]>([]);
  protected readonly transportLayers = signal<TransportLayerSummaryDto[]>([]);
  protected readonly dataDomains = signal<DataDomainSummaryDto[]>([]);

  protected readonly tags = signal<string[]>([]);

  protected readonly form = this.fb.group({
    code: ['', [Validators.required, Validators.maxLength(100),
      Validators.pattern('^[A-Z][A-Z0-9_-]*$')]],
    name: ['', [Validators.required, Validators.maxLength(300)]],
    description: ['', Validators.maxLength(4000)],
    apiVersion: ['', Validators.maxLength(100)],
    statusId: [null as string | null, Validators.required],
    typeId: [null as string | null],
    sourceSystemId: [null as string | null],
    targetSystemId: [null as string | null],
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
    contractUrl: ['', Validators.maxLength(2000)],
    documentationUrl: ['', Validators.maxLength(2000)],
    dataDomainIds: [[] as string[]],
    newTag: [''],
  });

  protected readonly ownerColumns = ['name', 'role', 'validFrom', 'validTo', 'actions'];

  ngOnInit(): void {
    this.loadDictionaries();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.apiId.set(id);
      this.loadApi(id);
      this.loadOwners(id);
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

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
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
      sourceSystemId: v.sourceSystemId || null,
      targetSystemId: v.targetSystemId || null,
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
      contractUrl: v.contractUrl || null,
      documentationUrl: v.documentationUrl || null,
      tags: this.tags().length ? this.tags() : null,
      dataDomainIds: (v.dataDomainIds ?? []).length ? v.dataDomainIds : null,
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
      this.service.create({ ...payload, code: v.code! }).subscribe({
        next: (created) => this.persistPendingOwners(created),
        error: (err: HttpErrorResponse) => {
          this.saving.set(false);
          this.handleError(err);
        },
      });
    }
  }

  protected cancel(): void {
    this.router.navigate(['/apis']);
  }

  protected openHistory(): void {
    const id = this.apiId();
    if (!id) return;
    const apiName = this.api()?.name ?? id;
    this.historyService.getApiRevisions(id).subscribe(entries => {
      this.matDialog.open(HistoryDialog, {
        data: {
          title: apiName,
          entries,
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
      sourceSystem: tr('sourceSystem'), targetSystem: tr('targetSystem'),
      transportLayer: tr('transportLayer'), protocol: tr('protocol'),
      authenticationMethod: tr('authenticationMethod'), securityPolicy: tr('securityPolicy'),
      integrationPattern: tr('integrationPattern'), messageFormat: tr('messageFormat'),
      slaResponseTimeMs: tr('slaResponseTimeMs'), slaUptimePct: tr('slaUptimePct'),
      slaTier: tr('slaTier'), slaDescription: tr('slaDescription'),
      contractType: tr('contractType'), contractUrl: tr('contractUrl'),
      documentationUrl: tr('documentationUrl'), tags: tr('tags'), active: tr('active'),
      createdAt: tr('createdAt'), createdBy: tr('createdBy'),
      updatedAt: tr('updatedAt'), updatedBy: tr('updatedBy'),
    };
  }

  private persistPendingOwners(created: ApiDto): void {
    const pending = this.owners();
    if (!pending.length) {
      this.saving.set(false);
      this.toast.success(this.t.translate('api.toast.created'));
      this.router.navigate(['/apis', created.id, 'edit']);
      return;
    }

    const requests = pending.map((owner): ApiOwnerCreateRequest => ({
      roleId: owner.role.id,
      firstName: owner.firstName,
      lastName: owner.lastName,
      email: owner.email,
      validFrom: owner.validFrom,
      validTo: owner.validTo,
    }));

    forkJoin(requests.map(req => this.service.createOwner(created.id, req))).subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success(this.t.translate('api.toast.created'));
        this.router.navigate(['/apis', created.id, 'edit']);
      },
      error: () => {
        this.saving.set(false);
        this.toast.warn(this.t.translate('api.toast.createdOwnersFailed'));
        this.router.navigate(['/apis', created.id, 'edit']);
      },
    });
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
          sourceSystemId: api.sourceSystem?.id ?? null,
          targetSystemId: api.targetSystem?.id ?? null,
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
          contractUrl: api.contractUrl ?? '',
          documentationUrl: api.documentationUrl ?? '',
          dataDomainIds: api.dataDomains.map(d => d.id),
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

  private loadDictionaries(): void {
    this.entryService.findByTypeCode('API_STATUS').subscribe(e => this.statuses.set(e));
    this.entryService.findByTypeCode('API_TYPE').subscribe(e => this.types.set(e));
    this.entryService.findByTypeCode('PROTOCOL').subscribe(e => this.protocols.set(e));
    this.entryService.findByTypeCode('AUTHENTICATION_METHOD').subscribe(e => this.authMethods.set(e));
    this.entryService.findByTypeCode('SECURITY_POLICY').subscribe(e => this.securityPolicies.set(e));
    this.entryService.findByTypeCode('INTEGRATION_PATTERN').subscribe(e => this.integrationPatterns.set(e));
    this.entryService.findByTypeCode('MESSAGE_FORMAT').subscribe(e => this.messageFormats.set(e));
    this.entryService.findByTypeCode('SLA_TIER').subscribe(e => this.slaTiers.set(e));
    this.entryService.findByTypeCode('CONTRACT_TYPE').subscribe(e => this.contractTypes.set(e));
    this.entryService.findByTypeCode('API_OWNER_ROLE').subscribe(e => this.ownerRoles.set(e));
    this.itSystemService.findAll({ active: true, size: 500, sort: 'name' }).subscribe(
      page => this.itSystems.set(page.content),
    );
    this.transportLayerService.findAll({ active: true, size: 500, sort: 'name' }).subscribe(
      page => this.transportLayers.set(page.content),
    );
    this.dataDomainService.findAll({ active: true, size: 500, sort: 'name' }).subscribe(
      page => this.dataDomains.set(page.content),
    );
  }

  private handleError(err: HttpErrorResponse): void {
    const code: string = err.error?.code ?? '';
    if (err.status === 409 || code.includes('duplicate')) {
      const v = this.form.getRawValue();
      this.toast.error(this.t.translate('api.error.duplicateCode', { code: v.code }));
    } else {
      this.toast.error(this.t.translate('common.error.unexpected'));
    }
  }
}
