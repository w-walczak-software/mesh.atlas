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
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslocoDirective, TranslocoService, provideTranslocoScope } from '@jsverse/transloco';
import { toSignal } from '@angular/core/rxjs-interop';
import { ToastService } from '@shared/toast/toast.service';
import { AtlasCardHeader } from '@shared/card-header/card-header';
import { AppToolbar } from '@shared/toolbar/toolbar';
import { IntegrationDatasourceService } from '../service/integration-datasource.service';
import { DatasourceType, IntegrationDatasourceDto } from '../model/integration.model';

@Component({
  selector: 'app-datasource-form',
  imports: [
    AtlasCardHeader,
    AppToolbar,
    TranslocoDirective,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatTooltipModule,
  ],
  providers: [provideTranslocoScope('integration')],
  templateUrl: './datasource-form.html',
  styleUrl: './datasource-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatasourceForm implements OnInit {
  private readonly service = inject(IntegrationDatasourceService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);
  private readonly t = inject(TranslocoService);
  private readonly fb = inject(FormBuilder);

  protected readonly lang = toSignal(this.t.langChanges$, { initialValue: this.t.getActiveLang() });
  private readonly datasourceId = signal<string | null>(null);
  protected readonly isEditMode = computed(() => this.datasourceId() !== null);
  protected readonly saving = signal(false);
  protected readonly testing = signal(false);

  protected readonly datasourceTypes: DatasourceType[] = ['POSTGRESQL', 'SQLSERVER', 'ORACLE'];

  protected readonly form = this.fb.group({
    code: ['', [Validators.required, Validators.maxLength(100), Validators.pattern(/^[A-Z][A-Z0-9_]*$/)]],
    name: ['', [Validators.required, Validators.maxLength(255)]],
    description: [''],
    type: ['POSTGRESQL' as DatasourceType, Validators.required],
    host: ['', [Validators.required, Validators.maxLength(255)]],
    port: [5432, [Validators.required, Validators.min(1), Validators.max(65535)]],
    databaseName: ['', [Validators.required, Validators.maxLength(255)]],
    username: ['', [Validators.required, Validators.maxLength(255)]],
    password: [''],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.datasourceId.set(id);
      this.form.get('code')!.disable();
      this.loadDatasource(id);
    } else {
      this.form.get('password')!.addValidators(Validators.required);
      this.form.get('password')!.updateValueAndValidity();
    }
  }

  private loadDatasource(id: string): void {
    this.service.findById(id).subscribe({
      next: (ds: IntegrationDatasourceDto) => {
        this.form.patchValue({
          code: ds.code,
          name: ds.name,
          description: ds.description,
          type: ds.type,
          host: ds.host,
          port: ds.port,
          databaseName: ds.databaseName,
          username: ds.username,
        });
        this.form.get('type')!.disable();
      },
    });
  }

  protected save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const v = this.form.getRawValue();
    const id = this.datasourceId();

    const obs = id
      ? this.service.update(id, {
          name: v.name!,
          description: v.description,
          host: v.host!,
          port: v.port!,
          databaseName: v.databaseName!,
          username: v.username!,
          password: v.password || undefined,
        })
      : this.service.create({
          code: v.code!,
          name: v.name!,
          description: v.description,
          type: v.type!,
          host: v.host!,
          port: v.port!,
          databaseName: v.databaseName!,
          username: v.username!,
          password: v.password!,
        });

    obs.subscribe({
      next: () => {
        this.toast.success(this.t.translate(id
          ? 'integration.toast.datasourceUpdated'
          : 'integration.toast.datasourceCreated'));
        this.router.navigate(['/integracje/datasources']);
      },
      error: () => this.saving.set(false),
    });
  }

  protected testConnection(): void {
    const id = this.datasourceId();
    if (!id) return;
    this.testing.set(true);
    this.service.testConnection(id).subscribe({
      next: (result) => {
        this.testing.set(false);
        if (result.success) {
          this.toast.success(this.t.translate('integration.toast.connectionOk'));
        } else {
          this.toast.error(`${this.t.translate('integration.toast.connectionFailed')}: ${result.message}`);
        }
      },
      error: () => {
        this.testing.set(false);
        this.toast.error(this.t.translate('integration.toast.connectionFailed'));
      },
    });
  }

  protected cancel(): void {
    this.router.navigate(['/integracje/datasources']);
  }
}
