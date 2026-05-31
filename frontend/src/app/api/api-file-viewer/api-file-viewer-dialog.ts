import {
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  inject,
  OnDestroy,
  signal,
  ViewEncapsulation,
  viewChild,
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslocoDirective, TranslocoService, provideTranslocoScope } from '@jsverse/transloco';
import { toSignal } from '@angular/core/rxjs-interop';
import { load as yamlLoad } from 'js-yaml';
import { ApiAttachmentDto } from '../model/api.model';
import { ApiService } from '../service/api.service';
import { ThemeService } from '../../shared/services/theme.service';
import {
  getFileExtension,
  getMonacoLanguage,
  isAsyncApiContent,
  isOpenApiContent,
  prepareContent,
} from './doc-viewer.utils';
import { WsdlViewerComponent } from './wsdl-viewer.component';
import { GraphqlViewerComponent } from './graphql-viewer.component';

export interface ApiFileViewerDialogData {
  apiId:      string;
  attachment: ApiAttachmentDto;
}

type ViewerMode = 'openapi' | 'asyncapi' | 'wsdl' | 'graphql' | 'monaco' | null;

const FILE_ICONS: Record<string, string> = {
  json: 'data_object', yaml: 'data_object', yml: 'data_object',
  xml: 'code',         xsd:  'code',        wsdl: 'code',      xslt: 'code',
  html: 'html',        htm:  'html',
  csv: 'table_chart',  tsv:  'table_chart',
  sql: 'storage',
  md:  'article',
  txt: 'text_snippet', log:  'text_snippet',
  ts:  'javascript',   js:   'javascript',
  sh:  'terminal',     bat:  'terminal',
  graphql: 'schema',   gql:  'schema',
};

@Component({
  selector: 'app-api-file-viewer-dialog',
  imports: [MatDialogModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatTooltipModule, TranslocoDirective, WsdlViewerComponent, GraphqlViewerComponent],
  providers: [provideTranslocoScope('api')],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <ng-container *transloco="let t; scope: 'api'; lang: lang()">

      <!-- ── Header ─────────────────────────────────────────────────────── -->
      <div class="vdlg-header">
        <div class="vdlg-header__icon-wrap">
          <mat-icon class="vdlg-header__icon">{{ fileIcon() }}</mat-icon>
        </div>
        <div class="vdlg-header__text">
          <span class="vdlg-header__name">{{ data.attachment.fileName }}</span>
          @if (data.attachment.contractType) {
            <span class="vdlg-header__sub">{{ data.attachment.contractType.name }}</span>
          }
        </div>
        @if (mode() === 'openapi' || mode() === 'asyncapi' || mode() === 'wsdl' || mode() === 'graphql') {
          <button mat-icon-button class="vdlg-src-toggle"
                  [matTooltip]="showSource() ? 'Show rendered' : 'Show source'"
                  (click)="toggleSource()">
            <mat-icon>{{ showSource() ? 'visibility' : 'code' }}</mat-icon>
          </button>
        }
        <button mat-icon-button class="vdlg-close" (click)="close()"
                [attr.aria-label]="t('api.action.cancel')">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- ── Body ───────────────────────────────────────────────────────── -->
      <div class="vdlg-body">

        @if (loading()) {
          <div class="vdlg-center">
            <mat-spinner diameter="44"></mat-spinner>
          </div>
        } @else if (error()) {
          <div class="vdlg-center vdlg-error">
            <mat-icon class="vdlg-error__icon">error_outline</mat-icon>
            <span>{{ t('api.viewer.loadError') }}</span>
          </div>
        } @else if (mode() === 'monaco' || (showSource() && (mode() === 'openapi' || mode() === 'asyncapi' || mode() === 'wsdl' || mode() === 'graphql'))) {
          <div #monacoContainer class="vdlg-monaco"></div>
        } @else if (mode() === 'openapi') {
          <div #redocContainer class="vdlg-redoc"
               [style.background]="themeService.isDark() ? '#141218' : '#fff'"></div>
        } @else if (mode() === 'asyncapi') {
          <div #asyncapiContainer class="vdlg-asyncapi"
               [style.background]="themeService.isDark() ? '#141218' : '#fff'"></div>
        } @else if (mode() === 'wsdl') {
          <app-wsdl-viewer class="vdlg-wsdl"
            [xmlText]="pendingWsdlText"
            [isDark]="themeService.isDark()">
          </app-wsdl-viewer>
        } @else if (mode() === 'graphql') {
          <app-graphql-viewer class="vdlg-graphql"
            [sdlText]="pendingGraphqlText"
            [isDark]="themeService.isDark()">
          </app-graphql-viewer>
        }

      </div>

    </ng-container>
  `,
  styles: [`
    .vdlg-header {
      display: flex; align-items: center; gap: 12px;
      padding: 14px 14px 12px 20px;
      border-bottom: 1px solid var(--mat-sys-outline-variant);
      background: color-mix(in srgb, var(--mat-sys-primary) 5%, transparent);
      flex-shrink: 0;
    }
    .vdlg-header__icon-wrap {
      width: 36px; height: 36px; border-radius: 8px; flex-shrink: 0;
      background: var(--mat-sys-primary);
      display: flex; align-items: center; justify-content: center;
    }
    .vdlg-header__icon {
      font-size: 18px !important; width: 18px !important; height: 18px !important; color: #fff;
    }
    .vdlg-header__text {
      flex: 1; min-width: 0;
      display: flex; flex-direction: column; gap: 2px;
    }
    .vdlg-header__name {
      font-size: 14px; font-weight: 600; color: var(--mat-sys-on-surface);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .vdlg-header__sub {
      font-size: 11px; color: var(--mat-sys-on-surface-variant);
    }
    .vdlg-src-toggle { color: var(--mat-sys-on-surface-variant); flex-shrink: 0; }
    .vdlg-close { color: var(--mat-sys-on-surface-variant); flex-shrink: 0; }

    .vdlg-body {
      height: calc(90vh - 66px);
      overflow: hidden;
    }
    .vdlg-center {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      height: 100%; gap: 16px;
    }
    .vdlg-error {
      color: var(--mat-sys-error);
      font-size: 14px;
    }
    .vdlg-error__icon {
      font-size: 48px !important; width: 48px !important; height: 48px !important;
    }
    .vdlg-monaco {
      width: 100%; height: 100%;
    }
    .vdlg-redoc {
      width: 100%; height: 100%;
      overflow-y: auto;
      transition: background 150ms ease;
    }
    .vdlg-asyncapi {
      width: 100%; height: 100%;
      overflow-y: auto;
      transition: background 150ms ease;
    }
    .vdlg-wsdl {
      width: 100%; height: 100%;
    }
    .vdlg-graphql {
      width: 100%; height: 100%;
    }
  `],
})
export class ApiFileViewerDialog implements OnDestroy {
  protected readonly data         = inject<ApiFileViewerDialogData>(MAT_DIALOG_DATA);
  private   readonly ref          = inject(MatDialogRef<ApiFileViewerDialog>);
  private   readonly apiService   = inject(ApiService);
  private   readonly ts           = inject(TranslocoService);
  protected readonly themeService = inject(ThemeService);

  protected readonly lang       = toSignal(this.ts.langChanges$, { initialValue: this.ts.getActiveLang() });
  protected readonly loading    = signal(true);
  protected readonly mode       = signal<ViewerMode>(null);
  protected readonly error      = signal(false);
  protected readonly showSource = signal(false);

  private readonly monacoContainer   = viewChild<ElementRef<HTMLElement>>('monacoContainer');
  private readonly redocContainer    = viewChild<ElementRef<HTMLElement>>('redocContainer');
  private readonly asyncapiContainer = viewChild<ElementRef<HTMLElement>>('asyncapiContainer');

  private pendingMonacoContent  = '';
  private pendingMonacoLanguage = 'plaintext';
  private pendingOpenApiSpec: unknown = null;
  private pendingAsyncApiText = '';
  protected pendingWsdlText    = '';
  protected pendingGraphqlText = '';

  private monacoElement: HTMLElement | null = null;
  private asyncapiElement: HTMLElement | null = null;
  private asyncapiStyleEl: HTMLStyleElement | null = null;
  private wheelListener: (() => void) | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private monacoApi: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private monacoEditor: any = null;

  constructor() {
    // Monaco: re-init when DOM element changes (new instance after toggle); update theme otherwise
    effect(() => {
      const el     = this.monacoContainer()?.nativeElement;
      const isDark = this.themeService.isDark();
      if (!el) return;

      if (el !== this.monacoElement) {
        this.monacoElement = el;
        void this.initMonaco(el, isDark);
      } else {
        this.monacoApi?.editor.setTheme(isDark ? 'vs-dark' : 'vs');
      }
    });

    // Redoc: init on first appearance; clear + reinit when theme toggles
    effect(() => {
      const el     = this.redocContainer()?.nativeElement;
      const isDark = this.themeService.isDark();
      if (!el || this.mode() !== 'openapi') return;
      el.innerHTML = '';
      this.initRedoc(el, isDark);
    });

    // AsyncAPI: re-init when DOM element changes (new instance after source toggle); update theme otherwise
    effect(() => {
      const el     = this.asyncapiContainer()?.nativeElement;
      const isDark = this.themeService.isDark();
      if (!el || this.mode() !== 'asyncapi') return;

      if (el !== this.asyncapiElement) {
        this.asyncapiElement = el;
        this.asyncapiStyleEl = null;
        void this.initAsyncApi(el, isDark);
      } else {
        this.applyAsyncApiTheme(isDark);
      }
    });

    this.loadFile();
  }

  ngOnDestroy(): void {
    this.monacoEditor?.dispose();
    this.wheelListener?.();
  }

  protected toggleSource(): void {
    this.showSource.update(v => !v);
  }

  protected fileIcon(): string {
    const ext = getFileExtension(this.data.attachment.fileName);
    return FILE_ICONS[ext] ?? 'insert_drive_file';
  }

  private loadFile(): void {
    this.apiService
      .downloadAttachment(this.data.apiId, this.data.attachment.id)
      .subscribe({
        next: async (blob) => {
          const { fileName } = this.data.attachment;
          const ext  = getFileExtension(fileName);
          const text = await blob.text();

          if (['graphql', 'gql'].includes(ext)) {
            this.pendingGraphqlText    = text;
            this.pendingMonacoContent  = text;
            this.pendingMonacoLanguage = 'graphql';
            this.mode.set('graphql');
          } else if (ext === 'wsdl') {
            this.pendingWsdlText       = text;
            this.pendingMonacoContent  = prepareContent(text, fileName);
            this.pendingMonacoLanguage = 'xml';
            this.mode.set('wsdl');
          } else if (['json', 'yaml', 'yml'].includes(ext)) {
            if (isAsyncApiContent(text)) {
              this.pendingAsyncApiText    = text;
              this.pendingMonacoContent   = prepareContent(text, fileName);
              this.pendingMonacoLanguage  = getMonacoLanguage(fileName);
              this.mode.set('asyncapi');
            } else if (isOpenApiContent(text)) {
              this.pendingOpenApiSpec     = ext === 'json' ? JSON.parse(text) : yamlLoad(text);
              this.pendingMonacoContent   = prepareContent(text, fileName);
              this.pendingMonacoLanguage  = getMonacoLanguage(fileName);
              this.mode.set('openapi');
            } else {
              this.pendingMonacoContent  = prepareContent(text, fileName);
              this.pendingMonacoLanguage = getMonacoLanguage(fileName);
              this.mode.set('monaco');
            }
          } else {
            this.pendingMonacoContent  = prepareContent(text, fileName);
            this.pendingMonacoLanguage = getMonacoLanguage(fileName);
            this.mode.set('monaco');
          }
          this.loading.set(false);
        },
        error: () => {
          this.error.set(true);
          this.loading.set(false);
        },
      });
  }

  private async initMonaco(element: HTMLElement, isDark: boolean): Promise<void> {
    if (!(window as any).MonacoEnvironment) {
      (window as any).MonacoEnvironment = {
        getWorker: (_moduleId: string, _label: string) =>
          new Worker(new URL('./monaco.worker', import.meta.url)),
      };
    }

    const monaco   = await import('monaco-editor');
    this.monacoApi = monaco;

    this.monacoEditor?.dispose();
    this.monacoEditor = monaco.editor.create(element, {
      value:                this.pendingMonacoContent,
      language:             this.pendingMonacoLanguage,
      readOnly:             true,
      minimap:              { enabled: false },
      theme:                isDark ? 'vs-dark' : 'vs',
      scrollBeyondLastLine: false,
      automaticLayout:      true,
      wordWrap:             'on',
      fontSize:             13,
      lineNumbers:          'on',
      folding:              true,
      renderWhitespace:     'none',
      contextmenu:          false,
      links:                true,
    });

    this.wheelListener?.();
    const wheelHandler = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cur = this.monacoEditor.getOption((monaco.editor.EditorOption as any).fontSize);
      this.monacoEditor.updateOptions({ fontSize: Math.max(8, Math.min(32, cur - Math.sign(e.deltaY))) });
    };
    element.addEventListener('wheel', wheelHandler, { passive: false });
    this.wheelListener = () => element.removeEventListener('wheel', wheelHandler);
  }

  private async initRedoc(element: HTMLElement, isDark: boolean): Promise<void> {
    await this.ensureRedocScript();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).Redoc.init(
      this.pendingOpenApiSpec,
      {
        hideDownloadButton: true,
        scrollYOffset:      0,
        noAutoAuth:         true,
        theme:              isDark ? REDOC_DARK_THEME : REDOC_LIGHT_THEME,
      },
      element,
    );
  }

  private async initAsyncApi(element: HTMLElement, isDark: boolean): Promise<void> {
    await this.ensureAsyncApiScript();
    const comp = document.createElement('asyncapi-component');
    comp.setAttribute('schema',        this.pendingAsyncApiText);
    comp.setAttribute('cssImportPath', 'asyncapi/default.min.css');
    element.appendChild(comp);

    // The component uses open Shadow DOM — inject theme styles directly into shadow root
    if (comp.shadowRoot) {
      const style = document.createElement('style');
      comp.shadowRoot.appendChild(style);
      this.asyncapiStyleEl = style;
      this.applyAsyncApiTheme(isDark);
    }
  }

  private applyAsyncApiTheme(isDark: boolean): void {
    if (!this.asyncapiStyleEl) return;
    this.asyncapiStyleEl.textContent = isDark ? ASYNCAPI_DARK_CSS : '';
  }

  private ensureRedocScript(): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).Redoc) return Promise.resolve();

    const existing = document.head.querySelector<HTMLScriptElement>(
      'script[data-id="redoc-standalone"]',
    );
    if (existing) {
      return new Promise<void>((resolve, reject) => {
        existing.addEventListener('load',  () => resolve(),                           { once: true });
        existing.addEventListener('error', () => reject(new Error('Redoc load failed')), { once: true });
      });
    }

    return new Promise<void>((resolve, reject) => {
      const script         = document.createElement('script');
      script.dataset['id'] = 'redoc-standalone';
      script.src           = 'redoc/redoc.standalone.js';
      script.onload        = () => resolve();
      script.onerror       = () => reject(new Error('Redoc load failed'));
      document.head.appendChild(script);
    });
  }

  private ensureAsyncApiScript(): Promise<void> {
    if (customElements.get('asyncapi-component')) return Promise.resolve();

    const existing = document.head.querySelector<HTMLScriptElement>(
      'script[data-id="asyncapi-standalone"]',
    );
    if (existing) {
      return new Promise<void>((resolve, reject) => {
        existing.addEventListener('load',  () => resolve(),                                { once: true });
        existing.addEventListener('error', () => reject(new Error('AsyncAPI load failed')), { once: true });
      });
    }

    return new Promise<void>((resolve, reject) => {
      const script         = document.createElement('script');
      script.dataset['id'] = 'asyncapi-standalone';
      script.src           = 'asyncapi/asyncapi-web-component.js';
      script.onload        = () => resolve();
      script.onerror       = () => reject(new Error('AsyncAPI load failed'));
      document.head.appendChild(script);
    });
  }

  protected close(): void { this.ref.close(); }
}

// ── AsyncAPI dark mode CSS (injected into open Shadow DOM) ────────────────────

const ASYNCAPI_DARK_CSS = `
  .aui-root { background-color: #141218 !important; color: #e6e0e9 !important; }
  .aui-root .bg-white  { background-color: #141218 !important; }
  .aui-root .bg-gray-100 { background-color: #1d1b20 !important; }
  .aui-root .bg-gray-200 { background-color: #282538 !important; }
  .aui-root .bg-gray-800 { background-color: #0d0c10 !important; }
  .aui-root .text-gray-900, .aui-root .text-gray-800, .aui-root .text-gray-700 { color: #e6e0e9 !important; }
  .aui-root .text-gray-600, .aui-root .text-gray-500 { color: #cac4d0 !important; }
  .aui-root .text-gray-200 { color: #49454e !important; }
  .aui-root .border-gray-400 { border-color: #49454e !important; }
  .aui-root .prose { color: #e6e0e9 !important; }
  .aui-root .prose h1, .aui-root .prose h2, .aui-root .prose h3, .aui-root .prose h4 { color: #e6e0e9 !important; }
  .aui-root .prose a { color: #d0bcff !important; }
  .aui-root .prose strong { color: #e6e0e9 !important; }
  .aui-root .prose blockquote { color: #cac4d0 !important; border-left-color: #49454e !important; }
  .aui-root .prose pre { background-color: #1d1b20 !important; }
  .aui-root .prose code { color: #cac4d0 !important; }
  .aui-root .border-solid, .aui-root .border { border-color: #49454e !important; }
  .aui-root .shadow, .aui-root .shadow-md { box-shadow: 0 1px 3px 0 rgba(0,0,0,.4) !important; }
`;

// ── Redoc theme configs ────────────────────────────────────────────────────────

const REDOC_LIGHT_THEME = {
  typography: {
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    headings: { fontFamily: 'Inter, system-ui, -apple-system, sans-serif' },
  },
};

const REDOC_DARK_THEME = {
  colors: {
    primary:    { main: '#d0bcff' },
    text:       { primary: '#e6e0e9', secondary: '#cac4d0' },
    background: { main: '#141218' },
    border:     { dark: '#49454e', light: '#2b2930' },
    responses: {
      success: { color: '#81c784', backgroundColor: '#1a2b1a' },
      error:   { color: '#cf6679', backgroundColor: '#2b1a1d' },
      warning: { color: '#ffb74d', backgroundColor: '#2b231a' },
      info:    { color: '#80cbc4', backgroundColor: '#1a2425' },
    },
    http: {
      get:     '#81c784',
      post:    '#bb86fc',
      put:     '#ffb74d',
      delete:  '#cf6679',
      patch:   '#80deea',
      head:    '#a5d6a7',
      options: '#ce93d8',
    },
  },
  sidebar: {
    backgroundColor: '#1d1b20',
    textColor:       '#e6e0e9',
  },
  rightPanel: {
    backgroundColor: '#282538',
    textColor:       '#e6e0e9',
  },
  typography: {
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    headings: { fontFamily: 'Inter, system-ui, -apple-system, sans-serif' },
  },
};
