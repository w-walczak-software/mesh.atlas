import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { TranslocoDirective, TranslocoService, provideTranslocoScope } from '@jsverse/transloco';
import { toSignal } from '@angular/core/rxjs-interop';
import { ToastService } from '@shared/toast/toast.service';
import { DialogService } from '@shared/dialogs/dialog.service';
import { AtlasCardHeader } from '@shared/card-header/card-header';
import { AppToolbar } from '@shared/toolbar/toolbar';
import { DataTable } from '@shared/data-table/data-table';
import { BadgeConfig, TableConfig } from '@shared/data-table/data-table.models';
import { ThemeService } from '@shared/services/theme.service';
import { IntegrationPipelineService } from '../service/integration-pipeline.service';
import { IntegrationDatasourceService } from '../service/integration-datasource.service';
import { IntegrationDictionaryMappingService } from '../service/integration-dictionary-mapping.service';
import { SyncRegistryService } from '../service/sync-registry.service';
import {
  IntegrationDatasourceSummaryDto,
  IntegrationPipelineDto,
  PipelineDictionaryMappingDto,
  PipelineStatus,
  StagingApiDto,
  StagingDataDomainDto,
  StagingItSystemDto,
  SyncRegistrySummaryDto,
  TargetEntityType,
} from '../model/integration.model';
import { MappingValueDialog, MappingValueDialogData, MappingValueDialogResult } from '../mappings/mapping-value-dialog';

const DSL_TEMPLATE = `<routes xmlns="http://camel.apache.org/schema/spring">
  <route id="sync-pipeline">
    <from uri="timer:startup?repeatCount=1&amp;delay=0"/>

    <setBody>
      <constant>SELECT id, name FROM source_table</constant>
    </setBody>
    <to uri="jdbc:sourceDataSource?outputType=SelectList"/>

    <!-- Set pipelineId header from registry before split so :#pipelineId works in SQL -->
    <setHeader name="pipelineId">
      <simple>\${ref:pipelineId}</simple>
    </setHeader>

    <split>
      <simple>\${body}</simple>
      <!-- Use :# (not :?) to avoid URI query-string parsing conflict with ? -->
      <to uri="sql:INSERT INTO atlas.staging_table
                 (pipeline_id, external_id, name, staging_status)
               VALUES
                 (:#pipelineId, :#\${body[id]}, :#\${body[name]}, 'PENDING')"/>
    </split>
  </route>
</routes>`;

@Component({
  selector: 'app-pipeline-form',
  imports: [
    AtlasCardHeader,
    AppToolbar,
    DataTable,
    TranslocoDirective,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatTabsModule,
    MatTableModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
  ],
  providers: [provideTranslocoScope('integration')],
  templateUrl: './pipeline-form.html',
  styleUrl: './pipeline-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PipelineForm implements OnInit, OnDestroy {
  private readonly http = inject(HttpClient);
  protected readonly pipelineService = inject(IntegrationPipelineService);
  private readonly datasourceService = inject(IntegrationDatasourceService);
  private readonly mappingService = inject(IntegrationDictionaryMappingService);
  private readonly syncRegistryService = inject(SyncRegistryService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);
  private readonly dialogs = inject(DialogService);
  private readonly t = inject(TranslocoService);
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  protected readonly themeService = inject(ThemeService);

  protected readonly lang = toSignal(this.t.langChanges$, { initialValue: this.t.getActiveLang() });
  protected readonly pipelineId = signal<string | null>(null);
  protected readonly isEditMode = computed(() => this.pipelineId() !== null);
  protected readonly saving = signal(false);
  protected readonly syncing = signal(false);
  protected readonly initializingMappings = signal(false);
  protected readonly loadingDsl = signal(false);
  protected readonly pipeline = signal<IntegrationPipelineDto | null>(null);
  protected readonly dslModified = signal(false);

  protected readonly datasources = signal<IntegrationDatasourceSummaryDto[]>([]);
  protected readonly mappings = signal<PipelineDictionaryMappingDto[]>([]);
  protected readonly stagingItSystems = signal<StagingItSystemDto[]>([]);
  protected readonly stagingApis = signal<StagingApiDto[]>([]);
  protected readonly stagingDataDomains = signal<StagingDataDomainDto[]>([]);
  protected readonly syncHistory = signal<SyncRegistrySummaryDto[]>([]);
  protected readonly dslContent = signal<string | null>(null);

  protected readonly pipelineStatuses: PipelineStatus[] = ['DRAFT', 'ACTIVE', 'PAUSED'];
  protected readonly targetEntityTypes: TargetEntityType[] = ['IT_SYSTEM', 'API', 'DATA_DOMAIN'];

  protected readonly form = this.fb.group({
    code: ['', [Validators.required, Validators.maxLength(100), Validators.pattern(/^[A-Z][A-Z0-9_]*$/)]],
    name: ['', [Validators.required, Validators.maxLength(255)]],
    description: [''],
    targetEntity: ['IT_SYSTEM' as TargetEntityType, Validators.required],
    datasourceId: ['', Validators.required],
    status: ['DRAFT' as PipelineStatus, Validators.required],
  });

  // Monaco
  private readonly monacoContainer = viewChild<ElementRef<HTMLElement>>('monacoContainer');
  private monacoElement: HTMLElement | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private monacoApi: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private monacoEditor: any = null;

  constructor() {
    effect(() => {
      const el = this.monacoContainer()?.nativeElement;
      const isDark = this.themeService.isDark();
      if (!el) return;

      if (el !== this.monacoElement) {
        this.monacoElement = el;
        void this.initMonaco(el, isDark);
      } else {
        this.monacoApi?.editor.setTheme(isDark ? 'vs-dark' : 'vs');
      }
    });
  }

  ngOnDestroy(): void {
    this.monacoEditor?.dispose();
  }

  protected readonly mappingsTableConfig = computed<TableConfig<PipelineDictionaryMappingDto>>(() => ({
    tableId: 'pipeline-mappings',
    columns: [
      { key: 'dictionaryTypeCode', label: this.t.translate('integration.mapping.dictionaryTypeCode'), width: '200px' },
      {
        key: 'externalValue',
        label: this.t.translate('integration.mapping.externalValue'),
        cellRender: (row) => row.externalValue != null
          ? { text: row.externalValue }
          : { badge: { label: this.t.translate('integration.mapping.notSet'), colorClass: 'warn' } },
      },
      { key: 'atlasEntryCode', label: this.t.translate('integration.mapping.atlasEntryCode'), width: '160px' },
      { key: 'atlasEntryName', label: this.t.translate('integration.mapping.atlasEntryName') },
    ],
    toolbar: [
      {
        label: this.t.translate('integration.action.initializeMappings'),
        icon: 'auto_fix_high',
        disabled: this.initializingMappings(),
        action: () => this.initializeMappings(),
      },
    ],
    rowDblClick: (row) => this.openEditValue(row),
    rowStyle: (row): Record<string, string> => row.externalValue == null ? { opacity: '0.65' } : {},
  }));

  protected readonly syncHistoryTableConfig = computed<TableConfig<SyncRegistrySummaryDto>>(() => ({
    tableId: 'pipeline-sync-history',
    columns: [
      { key: 'executedAt', label: this.t.translate('integration.registry.executedAt'), width: '170px' },
      { key: 'executedBy', label: this.t.translate('integration.registry.executedBy'), width: '140px' },
      {
        key: 'status',
        label: this.t.translate('integration.registry.status'),
        width: '110px',
        badges: {
          'COMPLETED': { label: this.t.translate('integration.syncStatus.completed'), color: 'success' },
          'PARTIAL': { label: this.t.translate('integration.syncStatus.partial'), color: 'warning' },
          'FAILED': { label: this.t.translate('integration.syncStatus.failed'), color: 'error' },
          'RUNNING': { label: this.t.translate('integration.syncStatus.running'), color: 'primary' },
          'PENDING': { label: this.t.translate('integration.syncStatus.pending'), color: 'neutral' },
        } as Record<string, BadgeConfig>,
      },
      { key: 'totalCount', label: this.t.translate('integration.registry.totalCount'), width: '80px' },
      { key: 'successCount', label: this.t.translate('integration.registry.successCount'), width: '80px' },
      { key: 'failedCount', label: this.t.translate('integration.registry.failedCount'), width: '80px' },
    ],
    rowDblClick: (row) => this.router.navigate(['/integracje/sync-registry', row.id]),
  }));

  ngOnInit(): void {
    this.loadDatasources();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.pipelineId.set(id);
      this.loadingDsl.set(true);
      this.form.get('code')!.disable();
      this.form.get('targetEntity')!.disable();
      this.loadPipeline(id);
      this.loadMappings(id);
      this.loadSyncHistory(id);
    }
  }

  private loadDatasources(): void {
    this.datasourceService.findAll(0, 100).subscribe({
      next: (page) => this.datasources.set(page.content),
    });
  }

  private loadPipeline(id: string): void {
    this.pipelineService.findById(id).subscribe({
      next: (p) => {
        this.pipeline.set(p);
        this.form.patchValue({
          code: p.code,
          name: p.name,
          description: p.description,
          targetEntity: p.targetEntity,
          datasourceId: p.datasource?.id ?? '',
          status: p.status,
        });
        if (p.hasDsl) {
          this.loadDslContent(id);
        } else {
          this.loadingDsl.set(false);
        }
      },
    });
  }

  private loadDslContent(id: string): void {
    this.loadingDsl.set(true);
    this.http.get(this.pipelineService.getDslUrl(id), { responseType: 'text' }).subscribe({
      next: (text) => {
        this.dslContent.set(text);
        this.loadingDsl.set(false);
      },
      error: () => this.loadingDsl.set(false),
    });
  }

  private async initMonaco(element: HTMLElement, isDark: boolean): Promise<void> {
    if (!(window as any).MonacoEnvironment) {
      (window as any).MonacoEnvironment = {
        getWorker: (_moduleId: string, _label: string) =>
          new Worker(new URL('../../api/api-file-viewer/monaco.worker', import.meta.url)),
      };
    }

    const monaco = await import('monaco-editor');
    this.monacoApi = monaco;
    this.monacoEditor?.dispose();

    this.monacoEditor = monaco.editor.create(element, {
      value: this.dslContent() ?? DSL_TEMPLATE,
      language: 'xml',
      readOnly: false,
      minimap: { enabled: false },
      theme: isDark ? 'vs-dark' : 'vs',
      scrollBeyondLastLine: false,
      automaticLayout: true,
      wordWrap: 'off',
      fontSize: 13,
      lineNumbers: 'on',
      folding: true,
      renderWhitespace: 'none',
      contextmenu: true,
      mouseWheelZoom: true,
    });

    this.monacoEditor.onDidChangeModelContent(() => {
      this.dslModified.set(true);
    });
  }

  protected importDslFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const content = reader.result as string;
      if (this.monacoEditor) {
        this.monacoEditor.setValue(content);
      }
    };
    reader.readAsText(file);
    input.value = '';
  }

  protected saveDsl(): void {
    const id = this.pipelineId();
    if (!id || !this.monacoEditor) return;
    const content = this.monacoEditor.getValue() as string;
    this.pipelineService.uploadDsl(id, content).subscribe({
      next: () => {
        this.toast.success(this.t.translate('integration.toast.dslUploaded'));
        this.dslContent.set(content);
        this.dslModified.set(false);
        const p = this.pipeline();
        if (p) this.pipeline.set({ ...p, hasDsl: true });
      },
      error: (err: HttpErrorResponse) => {
        const message: string = err.error?.message ?? this.t.translate('integration.toast.dslUploadFailed');
        this.toast.error(message);
      },
    });
  }

  protected downloadDsl(): void {
    const id = this.pipelineId();
    if (!id) return;
    const editorContent = this.monacoEditor?.getValue() as string | undefined;
    const content = editorContent ?? this.dslContent() ?? '';
    const blob = new Blob([content], { type: 'text/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pipeline-${id}.xml`;
    a.click();
    URL.revokeObjectURL(url);
  }

  private loadMappings(pipelineId: string): void {
    this.mappingService.findAll(pipelineId).subscribe({
      next: (list) => this.mappings.set(list.map((m) => ({
        ...m,
        atlasEntryCode: m.atlasEntry.code,
        atlasEntryName: m.atlasEntry.name,
      }))),
    });
  }

  private loadSyncHistory(pipelineId: string): void {
    this.syncRegistryService.findAll(pipelineId, 0, 10).subscribe({
      next: (page) => this.syncHistory.set(page.content),
    });
  }

  protected initializeMappings(): void {
    const id = this.pipelineId();
    if (!id) return;
    this.initializingMappings.set(true);
    this.mappingService.initialize(id).subscribe({
      next: (result) => {
        this.initializingMappings.set(false);
        this.toast.success(
          this.t.translate('integration.toast.mappingsInitialized', { created: result.created, skipped: result.skipped })
        );
        this.loadMappings(id);
      },
      error: () => {
        this.initializingMappings.set(false);
        this.toast.error(this.t.translate('integration.toast.mappingsInitFailed'));
      },
    });
  }

  protected openEditValue(mapping: PipelineDictionaryMappingDto): void {
    const id = this.pipelineId();
    if (!id) return;
    const ref = this.dialog.open<MappingValueDialog, MappingValueDialogData, MappingValueDialogResult>(
      MappingValueDialog,
      { data: { mapping }, width: '480px' }
    );
    ref.afterClosed().subscribe((result) => {
      if (result === undefined) return;
      this.mappingService.updateValue(id, mapping.id, { externalValue: result.externalValue }).subscribe({
        next: (updated) => {
          const flat = { ...updated, atlasEntryCode: updated.atlasEntry.code, atlasEntryName: updated.atlasEntry.name };
          this.mappings.update((list) => list.map((m) => (m.id === updated.id ? flat : m)));
          this.toast.success(this.t.translate('integration.toast.mappingValueSaved'));
        },
        error: () => this.toast.error(this.t.translate('integration.toast.mappingValueFailed')),
      });
    });
  }

  protected triggerSync(): void {
    const id = this.pipelineId();
    if (!id) return;
    this.dialogs.question(
      this.t.translate('integration.action.sync'),
      this.t.translate('integration.confirm.sync'),
      () => {
        this.syncing.set(true);
        this.pipelineService.triggerSync(id).subscribe({
          next: (result) => {
            this.syncing.set(false);
            this.toast.success(`${this.t.translate('integration.toast.syncStarted')} — ID: ${result.syncRegistryId}`);
            this.loadSyncHistory(id);
          },
          error: () => {
            this.syncing.set(false);
            this.toast.error(this.t.translate('integration.toast.syncFailed'));
          },
        });
      },
    );
  }

  protected save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const v = this.form.getRawValue();
    const id = this.pipelineId();

    const obs = id
      ? this.pipelineService.update(id, {
          name: v.name!,
          description: v.description,
          status: v.status!,
          datasourceId: v.datasourceId!,
        })
      : this.pipelineService.create({
          code: v.code!,
          name: v.name!,
          description: v.description,
          targetEntity: v.targetEntity!,
          datasourceId: v.datasourceId!,
        });

    obs.subscribe({
      next: (result) => {
        this.toast.success(this.t.translate(id
          ? 'integration.toast.pipelineUpdated'
          : 'integration.toast.pipelineCreated'));
        if (!id) {
          this.router.navigate(['/integracje', result.id]);
        } else {
          this.saving.set(false);
          this.pipeline.set(result);
        }
      },
      error: () => this.saving.set(false),
    });
  }

  protected cancel(): void {
    this.router.navigate(['/integracje']);
  }
}
