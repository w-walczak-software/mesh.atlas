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
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ItSystemSelectComponent } from '@shared/it-system-select/it-system-select';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslocoDirective, TranslocoService, provideTranslocoScope } from '@jsverse/transloco';
import { toSignal } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastService } from '@shared/toast/toast.service';
import { AtlasTextInput } from '@shared/text-input/text-input';
import { AtlasTextarea } from '@shared/textarea/textarea';
import { AtlasCardHeader } from '@shared/card-header/card-header';
import { AppToolbar } from '@shared/toolbar/toolbar';
import { AuthService } from '@core/auth/auth.service';
import { HistoryDialog, HistoryDialogData } from '@shared/history/history.dialog';
import { HistoryService } from '@shared/history/history.service';
import { ItSystemSummaryDto } from '../../itsystem/model/itsystem.model';
import { TransportLayerService } from '../service/transport-layer.service';
import { TransportLayerDto } from '../model/transport-layer.model';
import {
  ItSystemIconPickerDialog,
  IconPickerDialogData,
} from '../../itsystem/it-system-icon-picker/it-system-icon-picker.dialog';

@Component({
  selector: 'app-transport-layer-form',
  imports: [
    AtlasCardHeader,
    AtlasTextInput,
    AtlasTextarea,
    AppToolbar,
    TranslocoDirective,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatDialogModule,
    MatTooltipModule,
    ItSystemSelectComponent,
  ],
  providers: [provideTranslocoScope('transportlayer'), provideTranslocoScope('history')],
  templateUrl: './transport-layer-form.html',
  styleUrl: './transport-layer-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransportLayerForm implements OnInit {
  private readonly service = inject(TransportLayerService);
  private readonly historyService = inject(HistoryService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);
  private readonly auth = inject(AuthService);
  private readonly matDialog = inject(MatDialog);
  private readonly t = inject(TranslocoService);
  private readonly fb = inject(FormBuilder);

  protected readonly lang = toSignal(this.t.langChanges$, { initialValue: this.t.getActiveLang() });
  protected readonly canWrite = computed(() => this.auth.hasAnyRole(['atlas_admin', 'atlas_system']));
  protected readonly isAdmin = computed(() => this.auth.hasAnyRole(['atlas_admin', 'ATLAS_ADMIN']));
  protected readonly readonly = computed(() => this.isEditMode() && !this.canWrite());

  private readonly layerId = signal<string | null>(null);
  protected readonly isEditMode = computed(() => this.layerId() !== null);
  protected readonly saving = signal(false);
  protected readonly loading = signal(false);
  protected readonly layer = signal<TransportLayerDto | null>(null);
  protected readonly icon = signal<string | null>(null);
  protected readonly color = signal<string | null>(null);
  protected readonly selectedItSystem = signal<ItSystemSummaryDto | null>(null);

  protected readonly effectiveIcon = computed(() => this.selectedItSystem()?.icon ?? this.icon());

  protected readonly form = this.fb.group({
    code: ['', [Validators.required, Validators.maxLength(100),
      Validators.pattern('^[A-Z][A-Z0-9_-]*$')]],
    name: ['', [Validators.required, Validators.maxLength(300)]],
    description: ['', Validators.maxLength(4000)],
    itSystemId: [null as string | null],
    supportsEndpointRegistration: [false],
    endpointLabel: ['', Validators.maxLength(100)],
    endpointLabelPl: ['', Validators.maxLength(100)],
  });

  protected onItSystemChange(sys: ItSystemSummaryDto | ItSystemSummaryDto[] | null): void {
    this.selectedItSystem.set(Array.isArray(sys) ? null : sys);
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.layerId.set(id);
      this.loadLayer(id);
    } else {
      this.form.controls.code.enable();
    }
  }

  protected readonly COLOR_PALETTE = [
    '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
    '#ec4899', '#f43f5e', '#ef4444', '#f97316',
    '#f59e0b', '#eab308', '#84cc16', '#22c55e',
    '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
  ] as const;

  protected selectColor(hex: string): void {
    this.color.set(this.color() === hex ? null : hex);
  }

  protected openIconPicker(): void {
    this.matDialog
      .open(ItSystemIconPickerDialog, {
        width: '700px',
        maxWidth: '95vw',
        data: { currentIcon: this.icon() } satisfies IconPickerDialogData,
      })
      .afterClosed()
      .subscribe((result: string | null | undefined) => {
        if (result === undefined) return;
        this.icon.set(result);
      });
  }

  protected openHistory(): void {
    const id = this.layerId();
    if (!id) return;
    const layerName = this.layer()?.name ?? id;
    this.historyService.getTransportLayerRevisions(id).subscribe(entries => {
      this.matDialog.open(HistoryDialog, {
        data: {
          title: layerName,
          entries,
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
    const metadata = this.buildMetadata(v);
    if (this.isEditMode()) {
      this.service.update(this.layerId()!, {
        name: v.name!,
        description: v.description || null,
        icon: this.icon() || null,
        color: this.color() || null,
        metadata,
        itSystemId: v.itSystemId || null,
      }).subscribe({
        next: () => {
          this.saving.set(false);
          this.toast.success(this.t.translate('transportlayer.toast.updated'));
          this.router.navigate(['/transport-layers']);
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
        icon: this.icon() || null,
        color: this.color() || null,
        metadata,
        itSystemId: v.itSystemId || null,
      }).subscribe({
        next: (created) => {
          this.saving.set(false);
          this.toast.success(this.t.translate('transportlayer.toast.created'));
          this.router.navigate(['/transport-layers', created.id, 'edit']);
        },
        error: (err: HttpErrorResponse) => {
          this.saving.set(false);
          this.handleError(err);
        },
      });
    }
  }

  private buildMetadata(v: ReturnType<typeof this.form.getRawValue>): Record<string, unknown> | null {
    if (!v.supportsEndpointRegistration) return null;
    return {
      supportsEndpointRegistration: true,
      endpointLabel: v.endpointLabel || null,
      endpointLabelPl: v.endpointLabelPl || null,
    };
  }

  protected cancel(): void {
    this.router.navigate(['/transport-layers']);
  }

  private loadLayer(id: string): void {
    this.loading.set(true);
    this.service.findById(id).subscribe({
      next: (layer) => {
        this.layer.set(layer);
        this.icon.set(layer.icon ?? null);
        this.color.set(layer.color ?? null);
        const meta = layer.metadata ?? {};
        this.form.patchValue({
          code: layer.code,
          name: layer.name,
          description: layer.description ?? '',
          itSystemId: layer.itSystem?.id ?? null,
          supportsEndpointRegistration: meta['supportsEndpointRegistration'] === true,
          endpointLabel: (meta['endpointLabel'] as string) ?? '',
          endpointLabelPl: (meta['endpointLabelPl'] as string) ?? '',
        });
        if (this.readonly()) {
          this.form.disable();
        } else {
          this.form.controls.code.disable();
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error(this.t.translate('transportlayer.error.notFound'));
        this.router.navigate(['/transport-layers']);
      },
    });
  }

  private buildFieldLabels(): Record<string, string> {
    const tr = (k: string) => this.t.translate<string>('history.fields.' + k);
    return {
      id: tr('id'), code: tr('code'), name: tr('name'), description: tr('description'),
      icon: tr('icon'), color: tr('color'), itSystem: tr('itSystem'), active: tr('active'),
      createdAt: tr('createdAt'), createdBy: tr('createdBy'),
      updatedAt: tr('updatedAt'), updatedBy: tr('updatedBy'),
    };
  }

  private handleError(err: HttpErrorResponse): void {
    const code: string = err.error?.code ?? '';
    if (err.status === 409 || code.includes('duplicate')) {
      const v = this.form.getRawValue();
      this.toast.error(this.t.translate('transportlayer.error.duplicateCode', { code: v.code }));
    } else {
      this.toast.error(this.t.translate('common.error.unexpected'));
    }
  }
}
