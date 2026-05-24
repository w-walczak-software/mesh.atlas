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
import { ItSystemService } from '../service/itsystem.service';
import {
  ItSystemDto,
  ItSystemOwnerCreateRequest,
  ItSystemOwnerDto,
} from '../model/itsystem.model';
import { ItSystemOwnerDialog } from './it-system-owner.dialog';

@Component({
  selector: 'app-it-system-form',
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
  providers: [provideTranslocoScope('itsystem')],
  templateUrl: './it-system-form.html',
  styleUrl: './it-system-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItSystemForm implements OnInit {
  private readonly service = inject(ItSystemService);
  private readonly historyService = inject(HistoryService);
  private readonly entryService = inject(DictionaryEntryService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);
  private readonly dialogs = inject(DialogService);
  private readonly matDialog = inject(MatDialog);
  private readonly t = inject(TranslocoService);
  private readonly fb = inject(FormBuilder);

  protected readonly lang = toSignal(this.t.langChanges$, { initialValue: this.t.getActiveLang() });

  private readonly systemId = signal<string | null>(null);
  protected readonly isEditMode = computed(() => this.systemId() !== null);
  protected readonly saving = signal(false);
  protected readonly loading = signal(false);
  protected readonly system = signal<ItSystemDto | null>(null);
  protected readonly owners = signal<ItSystemOwnerDto[]>([]);

  protected readonly statuses = signal<DictionaryEntryDto[]>([]);
  protected readonly lifecycleStages = signal<DictionaryEntryDto[]>([]);
  protected readonly businessCriticalities = signal<DictionaryEntryDto[]>([]);
  protected readonly dataClassifications = signal<DictionaryEntryDto[]>([]);
  protected readonly systemTypes = signal<DictionaryEntryDto[]>([]);
  protected readonly architectureStyles = signal<DictionaryEntryDto[]>([]);
  protected readonly deploymentModels = signal<DictionaryEntryDto[]>([]);
  protected readonly runtimeEnvironments = signal<DictionaryEntryDto[]>([]);
  protected readonly systemScopes = signal<DictionaryEntryDto[]>([]);
  protected readonly ownerRoles = signal<DictionaryEntryDto[]>([]);

  protected readonly tags = signal<string[]>([]);

  protected readonly form = this.fb.group({
    code: ['', [Validators.required, Validators.maxLength(100),
      Validators.pattern('^[A-Z][A-Z0-9_-]*$')]],
    name: ['', [Validators.required, Validators.maxLength(300)]],
    description: ['', Validators.maxLength(4000)],
    documentationUrl: ['', Validators.maxLength(2000)],
    repositoryUrl: ['', Validators.maxLength(2000)],
    statusId: [null as string | null, Validators.required],
    lifecycleStageId: [null as string | null, Validators.required],
    businessCriticalityId: [null as string | null, Validators.required],
    dataClassificationId: [null as string | null, Validators.required],
    systemTypeId: [null as string | null, Validators.required],
    architectureStyleId: [null as string | null],
    deploymentModelId: [null as string | null],
    runtimeEnvironmentId: [null as string | null],
    scopeId: [null as string | null],
    newTag: [''],
  });

  protected readonly ownerColumns = ['name', 'role', 'validFrom', 'validTo', 'actions'];

  ngOnInit(): void {
    this.loadDictionaries();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.systemId.set(id);
      this.loadSystem(id);
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
      .open(ItSystemOwnerDialog, {
        width: '560px',
        maxWidth: '95vw',
        disableClose: true,
        data: { systemId: this.systemId(), roles: this.ownerRoles(), owner: null },
      })
      .afterClosed()
      .subscribe((result: ItSystemOwnerDto | undefined) => {
        if (!result) return;
        if (this.isEditMode()) {
          this.toast.success(this.t.translate('itsystem.toast.ownerAdded'));
          this.loadOwners(this.systemId()!);
        } else {
          this.owners.update(list => [...list, result]);
        }
      });
  }

  protected openEditOwnerDialog(owner: ItSystemOwnerDto): void {
    this.matDialog
      .open(ItSystemOwnerDialog, {
        width: '560px',
        maxWidth: '95vw',
        disableClose: true,
        data: { systemId: this.systemId(), roles: this.ownerRoles(), owner },
      })
      .afterClosed()
      .subscribe((result: ItSystemOwnerDto | undefined) => {
        if (!result) return;
        if (this.isEditMode()) {
          this.toast.success(this.t.translate('itsystem.toast.ownerUpdated'));
          this.loadOwners(this.systemId()!);
        } else {
          this.owners.update(list => list.map(o => o.id === result.id ? result : o));
        }
      });
  }

  protected confirmDeleteOwner(owner: ItSystemOwnerDto): void {
    this.dialogs.question(
      this.t.translate('itsystem.owner.delete'),
      this.t.translate('itsystem.confirm.deleteOwner'),
      () => {
        if (!this.isEditMode()) {
          this.owners.update(list => list.filter(o => o.id !== owner.id));
          return;
        }
        this.service.deleteOwner(this.systemId()!, owner.id).subscribe({
          next: () => {
            this.toast.success(this.t.translate('itsystem.toast.ownerDeleted'));
            this.loadOwners(this.systemId()!);
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
    if (this.isEditMode()) {
      this.service.update(this.systemId()!, {
        name: v.name!,
        description: v.description || null,
        documentationUrl: v.documentationUrl || null,
        repositoryUrl: v.repositoryUrl || null,
        statusId: v.statusId!,
        lifecycleStageId: v.lifecycleStageId!,
        businessCriticalityId: v.businessCriticalityId!,
        dataClassificationId: v.dataClassificationId!,
        systemTypeId: v.systemTypeId!,
        architectureStyleId: v.architectureStyleId || null,
        deploymentModelId: v.deploymentModelId || null,
        runtimeEnvironmentId: v.runtimeEnvironmentId || null,
        scopeId: v.scopeId || null,
        tags: this.tags().length ? this.tags() : null,
        metadata: null,
      }).subscribe({
        next: () => {
          this.saving.set(false);
          this.toast.success(this.t.translate('itsystem.toast.updated'));
          this.router.navigate(['/it-systems']);
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
        repositoryUrl: v.repositoryUrl || null,
        statusId: v.statusId!,
        lifecycleStageId: v.lifecycleStageId!,
        businessCriticalityId: v.businessCriticalityId!,
        dataClassificationId: v.dataClassificationId!,
        systemTypeId: v.systemTypeId!,
        architectureStyleId: v.architectureStyleId || null,
        deploymentModelId: v.deploymentModelId || null,
        runtimeEnvironmentId: v.runtimeEnvironmentId || null,
        scopeId: v.scopeId || null,
        tags: this.tags().length ? this.tags() : null,
        metadata: null,
      }).subscribe({
        next: (created) => this.persistPendingOwners(created),
        error: (err: HttpErrorResponse) => {
          this.saving.set(false);
          this.handleError(err);
        },
      });
    }
  }

  protected cancel(): void {
    this.router.navigate(['/it-systems']);
  }

  protected openHistory(): void {
    const id = this.systemId();
    if (!id) return;
    const systemName = this.system()?.name ?? id;
    this.historyService.getItSystemRevisions(id).subscribe(entries => {
      this.matDialog.open(HistoryDialog, {
        data: {
          title: systemName,
          entries,
          fieldLabels: this.buildItSystemFieldLabels(),
        } satisfies HistoryDialogData,
        maxWidth: '800px',
        width: '95vw',
      });
    });
  }

  protected openOwnerHistory(owner: ItSystemOwnerDto): void {
    const systemId = this.systemId();
    if (!systemId) return;
    this.historyService.getItSystemOwnerRevisions(systemId, owner.id).subscribe(entries => {
      this.matDialog.open(HistoryDialog, {
        data: {
          title: `${owner.firstName} ${owner.lastName}`,
          entries,
          fieldLabels: this.buildOwnerFieldLabels(),
        } satisfies HistoryDialogData,
        maxWidth: '800px',
        width: '95vw',
      });
    });
  }

  private buildItSystemFieldLabels(): Record<string, string> {
    const tr = (k: string) => this.t.translate<string>('history.fields.' + k);
    return {
      id: tr('id'), code: tr('code'), name: tr('name'), description: tr('description'),
      documentationUrl: tr('documentationUrl'), repositoryUrl: tr('repositoryUrl'),
      status: tr('status'), lifecycleStage: tr('lifecycleStage'),
      businessCriticality: tr('businessCriticality'), dataClassification: tr('dataClassification'),
      systemType: tr('systemType'), architectureStyle: tr('architectureStyle'),
      deploymentModel: tr('deploymentModel'), runtimeEnvironment: tr('runtimeEnvironment'),
      scope: tr('scope'), tags: tr('tags'), active: tr('active'),
      createdAt: tr('createdAt'), createdBy: tr('createdBy'),
      updatedAt: tr('updatedAt'), updatedBy: tr('updatedBy'),
    };
  }

  private buildOwnerFieldLabels(): Record<string, string> {
    const tr = (k: string) => this.t.translate<string>('history.fields.' + k);
    return {
      id: tr('id'), role: tr('role'), firstName: tr('firstName'), lastName: tr('lastName'),
      email: tr('email'), validFrom: tr('validFrom'), validTo: tr('validTo'),
      active: tr('active'), createdAt: tr('createdAt'), createdBy: tr('createdBy'),
      updatedAt: tr('updatedAt'), updatedBy: tr('updatedBy'),
    };
  }

  private persistPendingOwners(created: ItSystemDto): void {
    const pending = this.owners();
    if (!pending.length) {
      this.saving.set(false);
      this.toast.success(this.t.translate('itsystem.toast.created'));
      this.router.navigate(['/it-systems', created.id, 'edit']);
      return;
    }

    const requests = pending.map((owner): ItSystemOwnerCreateRequest => ({
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
        this.toast.success(this.t.translate('itsystem.toast.created'));
        this.router.navigate(['/it-systems', created.id, 'edit']);
      },
      error: () => {
        this.saving.set(false);
        this.toast.warn(this.t.translate('itsystem.toast.createdOwnersFailed'));
        this.router.navigate(['/it-systems', created.id, 'edit']);
      },
    });
  }

  private loadSystem(id: string): void {
    this.loading.set(true);
    this.service.findById(id).subscribe({
      next: (sys) => {
        this.system.set(sys);
        this.tags.set(sys.tags ?? []);
        this.form.patchValue({
          code: sys.code,
          name: sys.name,
          description: sys.description ?? '',
          documentationUrl: sys.documentationUrl ?? '',
          repositoryUrl: sys.repositoryUrl ?? '',
          statusId: sys.status?.id ?? null,
          lifecycleStageId: sys.lifecycleStage?.id ?? null,
          businessCriticalityId: sys.businessCriticality?.id ?? null,
          dataClassificationId: sys.dataClassification?.id ?? null,
          systemTypeId: sys.systemType?.id ?? null,
          architectureStyleId: sys.architectureStyle?.id ?? null,
          deploymentModelId: sys.deploymentModel?.id ?? null,
          runtimeEnvironmentId: sys.runtimeEnvironment?.id ?? null,
          scopeId: sys.scope?.id ?? null,
        });
        this.form.controls.code.disable();
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error(this.t.translate('itsystem.error.notFound'));
        this.router.navigate(['/it-systems']);
      },
    });
  }

  private loadOwners(id: string): void {
    this.service.findOwners(id).subscribe(owners => this.owners.set(owners));
  }

  private loadDictionaries(): void {
    this.entryService.findByTypeCode('SYSTEM_STATUS').subscribe(e => this.statuses.set(e));
    this.entryService.findByTypeCode('LIFECYCLE_STAGE').subscribe(e => this.lifecycleStages.set(e));
    this.entryService.findByTypeCode('BUSINESS_CRITICALITY').subscribe(e => this.businessCriticalities.set(e));
    this.entryService.findByTypeCode('DATA_CLASSIFICATION').subscribe(e => this.dataClassifications.set(e));
    this.entryService.findByTypeCode('SYSTEM_TYPE').subscribe(e => this.systemTypes.set(e));
    this.entryService.findByTypeCode('ARCHITECTURE_STYLE').subscribe(e => this.architectureStyles.set(e));
    this.entryService.findByTypeCode('DEPLOYMENT_MODEL').subscribe(e => this.deploymentModels.set(e));
    this.entryService.findByTypeCode('RUNTIME_ENVIRONMENT').subscribe(e => this.runtimeEnvironments.set(e));
    this.entryService.findByTypeCode('SYSTEM_SCOPE').subscribe(e => this.systemScopes.set(e));
    this.entryService.findByTypeCode('SYSTEM_OWNER_ROLE').subscribe(e => this.ownerRoles.set(e));
  }

  private handleError(err: HttpErrorResponse): void {
    const code: string = err.error?.code ?? '';
    if (err.status === 409 || code.includes('duplicate')) {
      const v = this.form.getRawValue();
      this.toast.error(this.t.translate('itsystem.error.duplicateCode', { code: v.code }));
    } else {
      this.toast.error(this.t.translate('common.error.unexpected'));
    }
  }
}
