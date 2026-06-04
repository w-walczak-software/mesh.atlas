import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslocoDirective, TranslocoService, provideTranslocoScope } from '@jsverse/transloco';
import { EditorComponent } from '@tinymce/tinymce-angular';
import type { Editor, RawEditorOptions } from 'tinymce';
import { ToastService } from '@shared/toast/toast.service';
import { AtlasTextInput } from '@shared/text-input/text-input';
import { EmailTemplateDto } from '../model/admin.model';
import { EmailTemplateService } from './email-template.service';

export interface EmailTemplateEditDialogData {
  template: EmailTemplateDto;
}

@Component({
  selector: 'app-email-template-edit-dialog',
  imports: [
    AtlasTextInput,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    TranslocoDirective,
    EditorComponent,
  ],
  providers: [provideTranslocoScope('admin')],
  templateUrl: './email-template-edit-dialog.html',
  styleUrl: './email-template-edit-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmailTemplateEditDialog implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(EmailTemplateService);
  private readonly dialogRef = inject(MatDialogRef<EmailTemplateEditDialog>);
  private readonly data = inject<EmailTemplateEditDialogData>(MAT_DIALOG_DATA);
  private readonly toast = inject(ToastService);
  private readonly t = inject(TranslocoService);

  private editorInstance: Editor | null = null;

  protected readonly saving = signal(false);
  protected readonly newTagInput = signal('');
  protected readonly tags = signal<string[]>([]);

  protected readonly form = this.fb.group({
    code: [
      '',
      [Validators.required, Validators.maxLength(100), Validators.pattern(/^[A-Z][A-Z0-9_]*$/)],
    ],
    title: ['', [Validators.required, Validators.maxLength(500)]],
    description: ['', [Validators.maxLength(2000)]],
    body: ['', [Validators.required]],
  });

  protected readonly editorInit: RawEditorOptions = {
    base_url: '/tinymce',
    suffix: '.min',
    plugins: 'link lists table code autoresize image',
    toolbar:
      'undo redo | styles | bold italic underline strikethrough | forecolor backcolor | ' +
      'link image | alignleft aligncenter alignright | bullist numlist | table | code',
    toolbar_mode: 'wrap',
    menubar: false,
    branding: false,
    resize: false,
    autoresize_bottom_margin: 0,
    min_height: 420,
    content_style: [
      'body { font-family: Arial, Helvetica, sans-serif; font-size: 14px;',
      'line-height: 1.6; color: #1a1a1a; margin: 16px; }',
      'a { color: #1976d2; }',
      'table { border-collapse: collapse; width: 100%; }',
      'td, th { border: 1px solid #ddd; padding: 8px; }',
    ].join(' '),
    relative_urls: false,
    remove_script_host: false,
    setup: (editor: Editor) => {
      this.editorInstance = editor;
    },
  };

  ngOnInit(): void {
    const tmpl = this.data.template;
    this.form.patchValue({
      code: tmpl.code,
      title: tmpl.title,
      description: tmpl.description ?? '',
      body: tmpl.body,
    });
    this.form.controls.code.disable();
    this.tags.set([...tmpl.tags]);
  }

  protected addTag(): void {
    const raw = this.newTagInput().trim();
    if (!raw) return;
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(raw)) {
      this.toast.warn(this.t.translate('admin.emailTemplate.toast.invalidTag'));
      return;
    }
    if (this.tags().includes(raw)) return;
    this.tags.update(list => [...list, raw]);
    this.newTagInput.set('');
  }

  protected removeTag(tag: string): void {
    this.tags.update(list => list.filter(t => t !== tag));
  }

  protected insertTag(tag: string): void {
    const snippet = '[[${' + tag + '}]]';
    if (this.editorInstance) {
      this.editorInstance.insertContent(snippet);
      this.editorInstance.focus();
    } else {
      const current = this.form.controls.body.value ?? '';
      this.form.controls.body.setValue(current + snippet);
    }
  }

  protected onTagInputKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.addTag();
    }
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const { title, description, body } = this.form.getRawValue();
    const tags = this.tags();

    this.service.update(this.data.template.id, {
      title: title!,
      body: body!,
      description: description || null,
      tags,
    }).subscribe({
      next: saved => {
        this.toast.success(this.t.translate('admin.emailTemplate.toast.updated'));
        this.dialogRef.close(saved);
      },
      error: () => this.saving.set(false),
    });
  }

  protected cancel(): void {
    this.dialogRef.close(null);
  }
}
