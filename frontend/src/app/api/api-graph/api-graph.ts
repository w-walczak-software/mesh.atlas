import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { provideTranslocoScope, TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { getFontEmbedCSS } from 'html-to-image';
import jsPDF from 'jspdf';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  createEdges,
  createNodes,
  Edge,
  EdgeTemplateDirective,
  HandleComponent,
  Node,
  NodeHtmlTemplateDirective,
  VflowComponent,
} from 'ngx-vflow';
import { ApiService } from '../service/api.service';
import { ApiGraphResultDto, ApiGraphSystemDto } from '../model/api.model';
import { ApiEdgeGroupData, SystemNodeData } from './api-graph.model';
import { ApiSelectDialog, ApiSelectDialogData } from './api-select.dialog';
import { SystemPreviewDialog, SystemPreviewDialogData, SystemPreviewDialogResult } from './system-preview.dialog';
import { ApiPreviewDialog, ApiPreviewDialogData, ApiPreviewDialogResult } from './api-preview.dialog';
import { ApiFilterStateService } from '../service/api-filter-state.service';

// ── Layout type ────────────────────────────────────────────────────────────────
export type GraphLayout = 'force' | 'layered' | 'circular';

// ── Hover tooltip payload ──────────────────────────────────────────────────────
interface HoverTooltip {
  type: 'system' | 'api';
  x:    number;
  y:    number;
  system?: SystemNodeData;
  edge?:   ApiEdgeGroupData;
}

// ── Node dimensions ────────────────────────────────────────────────────────────
const NODE_W = 280;
const NODE_H = 116;
const MARGIN = 80;

// ── Node color palette ─────────────────────────────────────────────────────────
const PALETTE = [
  { bg: 'rgba(99,102,241,.1)',  bd: 'rgba(99,102,241,.5)',  acc: '#6366f1' },
  { bg: 'rgba(16,185,129,.1)', bd: 'rgba(16,185,129,.5)', acc: '#10b981' },
  { bg: 'rgba(14,165,233,.1)', bd: 'rgba(14,165,233,.5)', acc: '#0ea5e9' },
  { bg: 'rgba(245,158,11,.1)', bd: 'rgba(245,158,11,.5)', acc: '#f59e0b' },
  { bg: 'rgba(168,85,247,.1)', bd: 'rgba(168,85,247,.5)', acc: '#a855f7' },
  { bg: 'rgba(236,72,153,.1)', bd: 'rgba(236,72,153,.5)', acc: '#ec4899' },
  { bg: 'rgba(20,184,166,.1)', bd: 'rgba(20,184,166,.5)', acc: '#14b8a6' },
  { bg: 'rgba(234,179,8,.1)',  bd: 'rgba(234,179,8,.5)',  acc: '#eab308' },
  { bg: 'rgba(249,115,22,.1)', bd: 'rgba(249,115,22,.5)', acc: '#f97316' },
  { bg: 'rgba(239,68,68,.1)',  bd: 'rgba(239,68,68,.5)',  acc: '#ef4444' },
];

// ── Parallel edge spacing (px offset applied to bezier control points) ─────────
const PARALLEL_GAP = 36;

// ── Edge colors ────────────────────────────────────────────────────────────────
const EDGE_PALETTE = [
  '#6366f1', '#10b981', '#0ea5e9', '#f59e0b',
  '#a855f7', '#ec4899', '#14b8a6', '#eab308',
  '#f97316', '#ef4444',
];

@Component({
  selector: 'app-api-graph',
  imports: [
    TranslocoDirective,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    VflowComponent,
    NodeHtmlTemplateDirective,
    EdgeTemplateDirective,
    HandleComponent,
  ],
  providers: [provideTranslocoScope('api')],
  templateUrl: './api-graph.html',
  styleUrl:    './api-graph.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApiGraph implements OnInit {
  private readonly apiService   = inject(ApiService);
  private readonly filterState  = inject(ApiFilterStateService);
  private readonly router       = inject(Router);
  private readonly dialog       = inject(MatDialog);
  private readonly t            = inject(TranslocoService);
  private readonly vflow        = viewChild(VflowComponent);
  private readonly graphCanvas  = viewChild<ElementRef<HTMLElement>>('graphCanvas');

  protected readonly lang         = toSignal(this.t.langChanges$, { initialValue: this.t.getActiveLang() });
  protected readonly loading      = signal(true);
  protected readonly nodes        = signal<Node[]>([]);
  protected readonly edges        = signal<Edge[]>([]);
  protected readonly layout       = signal<GraphLayout>('force');
  protected readonly animateEdges = signal(false);
  protected readonly hasFilters   = computed(() => this.filterState.hasActiveFilters());
  protected readonly hoverTooltip = signal<HoverTooltip | null>(null);
  protected readonly exporting    = signal(false);
  protected readonly backTooltip  = computed(() => {
    const route = this.filterState.getSourceRoute();
    if (route === '/it-systems')   return this.t.translate('api.graph.backToItSystems');
    if (route === '/data-domains') return this.t.translate('api.graph.backToDataDomains');
    return this.t.translate('api.graph.backToList');
  });

  /** Cached last result so layout can be re-applied without re-fetching */
  private lastResult:        ApiGraphResultDto | null = null;
  private tooltipTimer:      ReturnType<typeof setTimeout> | null = null;
  private systemNamesById  = new Map<string, string>();

  protected readonly background = {
    type:            'dots' as const,
    color:           'rgba(148,163,184,0.25)',
    gap:             24,
    size:            1.5,
    backgroundColor: 'var(--mat-sys-surface)',
  };

  ngOnInit(): void {
    this.loadGraph();
  }

  // ── Data loading ──────────────────────────────────────────────────────────

  protected loadGraph(): void {
    this.loading.set(true);
    const criteria = this.filterState.toGraphCriteria();
    this.apiService.findGraph(criteria).subscribe({
      next: (result) => {
        this.lastResult = result;
        this.applyLayout();
        this.loading.set(false);
        setTimeout(() => this.vflow()?.fitView({ duration: 400 }), 60);
      },
      error: () => this.loading.set(false),
    });
  }

  // ── Layout switching ──────────────────────────────────────────────────────

  protected changeLayout(l: GraphLayout): void {
    this.layout.set(l);
    if (this.lastResult) {
      this.applyLayout();
      setTimeout(() => this.vflow()?.fitView({ duration: 300 }), 60);
    }
  }

  private applyLayout(): void {
    if (!this.lastResult) return;
    this.buildGraph(this.lastResult);
  }

  // ── Graph construction ────────────────────────────────────────────────────

  private buildGraph(result: ApiGraphResultDto): void {
    const { systems, apis } = result;
    const systemIdSet = new Set(systems.map(s => s.id));

    // Build id → name look-up used by ApiPreviewDialog
    this.systemNamesById = new Map(systems.map(s => [s.id, s.name]));

    // Collect unique directed pairs for layout algorithms
    type Pair = { source: string; target: string };
    const edgePairs: Pair[] = [];
    const seenPairs = new Set<string>();

    for (const api of apis) {
      if (!api.producerSystemId || !systemIdSet.has(api.producerSystemId)) continue;
      for (const csId of api.consumerSystemIds) {
        if (!systemIdSet.has(csId)) continue;
        const key = `${api.producerSystemId}__${csId}`;
        if (!seenPairs.has(key)) {
          seenPairs.add(key);
          edgePairs.push({ source: api.producerSystemId, target: csId });
        }
      }
    }

    // Compute positions with the selected algorithm
    const posMap = this.computePositions(systems, edgePairs);

    // Build nodes
    const nodes = createNodes<SystemNodeData>(
      systems.map((s, i) => {
        const pal = PALETTE[i % PALETTE.length];
        const pos = posMap.get(s.id) ?? { x: MARGIN + i * (NODE_W + 40), y: MARGIN };
        return {
          id:        s.id,
          type:      'html-template' as const,
          point:     pos,
          width:     NODE_W,
          height:    NODE_H,
          draggable: true,
          data: {
            systemId:                s.id,
            code:                    s.code,
            name:                    s.name,
            icon:                    s.icon,
            statusName:              s.status?.name ?? '',
            bgColor:                 pal.bg,
            borderColor:             pal.bd,
            accentColor:             pal.acc,
            description:             s.description,
            systemTypeName:          s.systemType?.name ?? null,
            lifecycleStageName:      s.lifecycleStage?.name ?? null,
            businessCriticalityName: s.businessCriticality?.name ?? null,
            dataClassificationName:  s.dataClassification?.name ?? null,
            architectureStyleName:   s.architectureStyle?.name ?? null,
            tags:                    s.tags,
            owners:                  s.owners,
            createdAt:               s.createdAt,
            createdBy:               s.createdBy,
            updatedAt:               s.updatedAt,
            updatedBy:               s.updatedBy,
          } satisfies SystemNodeData,
        };
      }),
    );

    // Build edge groups — one per (directed pair × transport layer × data-flow direction)
    const edgeMap = new Map<string, ApiEdgeGroupData>();
    let edgeColorIdx = 0;

    for (const api of apis) {
      if (!api.producerSystemId || !systemIdSet.has(api.producerSystemId)) continue;
      for (const csId of api.consumerSystemIds) {
        if (!systemIdSet.has(csId)) continue;
        const tCode = api.transportLayer?.code ?? '';
        const dCode = api.dataFlowDirection?.code ?? '';
        const key = `${api.producerSystemId}__${csId}__${tCode}__${dCode}`;
        if (!edgeMap.has(key)) {
          const tlColor = api.transportLayer?.color ?? null;
          edgeMap.set(key, {
            edgeKey:          key,
            producerSystemId: api.producerSystemId,
            consumerSystemId: csId,
            transportLayer:   api.transportLayer ?? null,
            apis:             [],
            edgeColor:        tlColor ?? EDGE_PALETTE[edgeColorIdx++ % EDGE_PALETTE.length],
            strokeWidth:      2,
            parallelOffset:   0,
            reverseFlow:      api.dataFlowDirection?.code === 'PUSH',
          });
        }
        edgeMap.get(key)!.apis.push(api);
      }
    }

    // Stroke width scales with API count; parallel offsets separate edges sharing the same system pair
    const pairToGroups = new Map<string, ApiEdgeGroupData[]>();
    for (const group of edgeMap.values()) {
      group.strokeWidth = Math.min(1 + group.apis.length, 6);
      const pKey = `${group.producerSystemId}__${group.consumerSystemId}`;
      if (!pairToGroups.has(pKey)) pairToGroups.set(pKey, []);
      pairToGroups.get(pKey)!.push(group);
    }
    for (const groups of pairToGroups.values()) {
      if (groups.length <= 1) continue;
      // Thicker (more APIs) edge gets the center slot; others spread symmetrically above/below
      groups.sort((a, b) => b.apis.length - a.apis.length);
      groups.forEach((g, i) => {
        g.parallelOffset = Math.round((i - (groups.length - 1) / 2) * PARALLEL_GAP);
      });
    }

    const edges = createEdges<ApiEdgeGroupData>(
      [...edgeMap.values()].map(group => ({
        id:     group.edgeKey,
        source: group.producerSystemId,
        target: group.consumerSystemId,
        type:   'template'    as const,
        curve:  'bezier'      as const,
        markers: {
          end: {
            type:   'arrow-closed' as const,
            color:  group.edgeColor,
            width:  20,
            height: 20,
          },
        },
        data: group,
      })),
    );

    this.nodes.set(nodes);
    this.edges.set(edges);
  }

  private computePositions(
    systems:   ApiGraphSystemDto[],
    edgePairs: ReadonlyArray<{ source: string; target: string }>,
  ): Map<string, { x: number; y: number }> {
    switch (this.layout()) {
      case 'layered':  return layeredLayout(systems, edgePairs);
      case 'circular': return circularLayout(systems);
      default:         return forceLayout(systems, edgePairs);
    }
  }

  // ── Interaction handlers ───────────────────────────────────────────────────

  protected onNodeDblClick(data: SystemNodeData): void {
    this.clearTooltip();
    this.dialog
      .open<SystemPreviewDialog, SystemPreviewDialogData, SystemPreviewDialogResult>(
        SystemPreviewDialog,
        { data: { system: data }, width: '1125px', maxWidth: '95vw', autoFocus: false },
      )
      .afterClosed()
      .subscribe(result => {
        if (result === 'details') {
          this.router.navigate(['/it-systems', data.systemId, 'edit']);
        }
      });
  }

  protected onEdgeDblClick(group: ApiEdgeGroupData): void {
    this.clearTooltip();
    if (group.apis.length === 1) {
      this.openApiPreview(group.apis[0], group.edgeColor);
    } else {
      this.dialog
        .open<ApiSelectDialog, ApiSelectDialogData, string>(ApiSelectDialog, {
          data:      { apis: group.apis },
          width:     '480px',
          autoFocus: false,
        })
        .afterClosed()
        .subscribe(apiId => {
          if (!apiId) return;
          const api = group.apis.find(a => a.id === apiId);
          if (api) this.openApiPreview(api, group.edgeColor);
        });
    }
  }

  private openApiPreview(api: ApiEdgeGroupData['apis'][number], edgeColor: string): void {
    this.dialog
      .open<ApiPreviewDialog, ApiPreviewDialogData, ApiPreviewDialogResult>(
        ApiPreviewDialog,
        {
          data: { api, edgeColor, systemNamesById: this.systemNamesById },
          width:     '1020px',
          maxWidth:  '95vw',
          autoFocus: false,
        },
      )
      .afterClosed()
      .subscribe(result => {
        if (result === 'details') {
          this.router.navigate(['/apis', api.id, 'edit']);
        }
      });
  }

  // ── Tooltip handlers ──────────────────────────────────────────────────────

  protected onNodeMouseEnter(data: SystemNodeData, event: MouseEvent): void {
    this.scheduleTooltip({ type: 'system', x: event.clientX, y: event.clientY, system: data });
  }

  protected onEdgeMouseEnter(data: ApiEdgeGroupData, event: MouseEvent): void {
    this.scheduleTooltip({ type: 'api', x: event.clientX, y: event.clientY, edge: data });
  }

  protected clearTooltip(): void {
    if (this.tooltipTimer !== null) {
      clearTimeout(this.tooltipTimer);
      this.tooltipTimer = null;
    }
    this.hoverTooltip.set(null);
  }

  private scheduleTooltip(tip: HoverTooltip): void {
    if (this.tooltipTimer !== null) clearTimeout(this.tooltipTimer);
    this.tooltipTimer = setTimeout(() => {
      this.hoverTooltip.set(tip);
      this.tooltipTimer = null;
    }, 400);
  }

  // ── Bezier path helpers ────────────────────────────────────────────────────

  /**
   * Extracts the 8 numeric coordinates from a cubic bezier SVG path
   * (M x0 y0 C cx1 cy1 cx2 cy2 x1 y1) regardless of separator style.
   */
  private parseBezierPath(path: string): [number, number, number, number, number, number, number, number] | null {
    const nums = [...path.matchAll(/[-]?\d+(?:\.\d+)?/g)].map(m => Number(m[0]));
    if (nums.length < 8) return null;
    return nums.slice(0, 8) as [number, number, number, number, number, number, number, number];
  }

  /** Returns the path string with control points shifted by `offset` pixels on the Y axis. */
  protected getOffsetPath(path: string, offset: number): string {
    if (!offset) return path;
    const pts = this.parseBezierPath(path);
    if (!pts) return path;
    const [x0, y0, cx1, cy1, cx2, cy2, x1, y1] = pts;
    return `M ${x0} ${y0} C ${cx1} ${cy1 + offset} ${cx2} ${cy2 + offset} ${x1} ${y1}`;
  }

  /** Returns the pixel position of the midpoint (t=0.5) of the offset bezier, for label placement. */
  protected getEdgeLabelPos(path: string, offset: number): { x: number; y: number } {
    const pts = this.parseBezierPath(path);
    if (!pts) return { x: 0, y: 0 };
    const [x0, y0, cx1, cy1, cx2, cy2, x1, y1] = pts;
    return {
      x: Math.round(0.125 * x0 + 0.375 * cx1 + 0.375 * cx2 + 0.125 * x1),
      y: Math.round(0.125 * y0 + 0.375 * (cy1 + offset) + 0.375 * (cy2 + offset) + 0.125 * y1),
    };
  }

  // ── Viewport controls ──────────────────────────────────────────────────────

  protected fitView(): void {
    this.vflow()?.fitView({ duration: 300 });
  }

  protected zoomIn(): void {
    const z = this.vflow()?.viewport().zoom ?? 1;
    this.vflow()?.zoomTo(Math.min(z * 1.3, 4));
  }

  protected zoomOut(): void {
    const z = this.vflow()?.viewport().zoom ?? 1;
    this.vflow()?.zoomTo(Math.max(z * 0.77, 0.1));
  }

  protected goBack(): void {
    this.router.navigate([this.filterState.getSourceRoute()]);
  }

  // ── Export ────────────────────────────────────────────────────────────────

  protected async exportAs(format: 'png' | 'jpg' | 'pdf'): Promise<void> {
    const canvas = this.graphCanvas()?.nativeElement;
    if (!canvas || this.exporting()) return;

    // The whole graph is rendered inside a single root <svg> (nodes as foreignObject
    // HTML, edges as SVG paths). The on-screen <svg> is only viewport-sized, so
    // rasterizing it directly clips everything outside the visible area. Instead we
    // clone that SVG, neutralise the pan/zoom transform and resize it via viewBox to
    // the full content bounds, inline every computed style and embed the fonts — the
    // export then is a self-contained SVG containing every node and edge, drawn at the
    // exact on-screen styling.
    const rootSvg = canvas.querySelector<SVGSVGElement>('svg.root-svg');
    if (!rootSvg) return;

    this.clearTooltip();
    this.exporting.set(true);
    const filename = `mesh-atlas-integration-map-${new Date().toISOString().slice(0, 10)}`;

    try {
      const { dataUrl, width, height } = await this.renderGraphImage(
        rootSvg, format === 'jpg' ? 'image/jpeg' : 'image/png',
      );

      if (format === 'png' || format === 'jpg') {
        triggerDownload(dataUrl, `${filename}.${format}`);
      } else {
        const pdf = new jsPDF({
          orientation: width >= height ? 'landscape' : 'portrait',
          unit: 'px',
          format: [width, height],
          hotfixes: ['px_scaling'],
        });
        pdf.addImage(dataUrl, 'PNG', 0, 0, width, height);
        pdf.save(`${filename}.pdf`);
      }
    } finally {
      this.exporting.set(false);
    }
  }

  /** Padding (px) around the graph content in exported images. */
  private static readonly EXPORT_PADDING = 48;
  /** Bitmap upscaling factor for crisp exports (capped so the canvas stays within limits). */
  private static readonly EXPORT_PIXEL_RATIO = 2;
  /** Browser canvas dimension limit (px). */
  private static readonly CANVAS_LIMIT = 16384;

  /**
   * Produces a raster data-URL of the entire graph at on-screen 1:1 styling.
   *
   * Builds a self-contained clone of the root <svg>: viewport transform reset to 1:1,
   * `viewBox` sized to the full content bounds, every computed style inlined onto the
   * inner foreignObject HTML (html-to-image can't reach across the <svg> boundary), and
   * the web fonts embedded as base64 so icons render as glyphs. The clone is then drawn
   * onto a canvas.
   */
  private async renderGraphImage(
    rootSvg: SVGSVGElement,
    mime: 'image/png' | 'image/jpeg',
  ): Promise<{ dataUrl: string; width: number; height: number }> {
    const pad = ApiGraph.EXPORT_PADDING;

    // Content bounds in flow coordinates — independent of the current pan/zoom.
    const box    = (this.findViewportGroup(rootSvg) ?? rootSvg).getBBox();
    const width  = Math.max(1, Math.ceil(box.width  + pad * 2));
    const height = Math.max(1, Math.ceil(box.height + pad * 2));

    const clone = rootSvg.cloneNode(true) as SVGSVGElement;
    // Render at natural scale, origin-independent, so the viewBox controls framing.
    this.findViewportGroup(clone)?.setAttribute('transform', 'translate(0,0) scale(1)');
    clone.setAttribute('width',  `${width}`);
    clone.setAttribute('height', `${height}`);
    clone.setAttribute('viewBox', `${box.x - pad} ${box.y - pad} ${width} ${height}`);

    // Inline computed styles onto the foreignObject HTML so the SVG is self-contained
    // (an <img> rendering an SVG data-URL does not apply the document's stylesheets).
    this.inlineComputedStyles(rootSvg, clone);

    // Embed fonts (Material Symbols Outlined, Inter) so icons render as glyphs.
    const fontEmbedCSS = await getFontEmbedCSS(rootSvg as unknown as HTMLElement);
    if (fontEmbedCSS) {
      const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
      style.textContent = fontEmbedCSS;
      clone.insertBefore(style, clone.firstChild);
    }

    const surface = getComputedStyle(document.documentElement)
      .getPropertyValue('--mat-sys-surface').trim() || '#ffffff';

    const xml   = new XMLSerializer().serializeToString(clone);
    const svgUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`;
    const img   = await loadImage(svgUrl);

    // Cap the upscaling so the bitmap never exceeds the browser canvas limit.
    const ratio = Math.min(ApiGraph.EXPORT_PIXEL_RATIO, ApiGraph.CANVAS_LIMIT / Math.max(width, height));
    const out   = document.createElement('canvas');
    out.width   = Math.round(width  * ratio);
    out.height  = Math.round(height * ratio);
    const ctx   = out.getContext('2d')!;
    // Solid surface background so the export matches the on-screen canvas (and JPEG,
    // which has no alpha channel, gets the right colour in both light and dark mode).
    ctx.fillStyle = surface;
    ctx.fillRect(0, 0, out.width, out.height);
    ctx.drawImage(img, 0, 0, out.width, out.height);

    return {
      dataUrl: out.toDataURL(mime, mime === 'image/jpeg' ? 0.95 : undefined),
      width,
      height,
    };
  }

  /** Locates the vflow viewport <g> (the element carrying the d3-zoom transform). */
  private findViewportGroup(svg: SVGSVGElement): SVGGElement | null {
    const direct = svg.querySelector<SVGGElement>('g[mapContext]');
    if (direct) return direct;
    return [...svg.querySelectorAll<SVGGElement>('g')]
      .find(g => /matrix|translate|scale/.test(g.getAttribute('transform') ?? '')) ?? null;
  }

  /**
   * Walks `liveRoot` and its structural clone `cloneRoot` in lock-step, copying the
   * resolved computed style of every HTML element onto the clone. Only HTML elements
   * (the foreignObject node/label markup) need this — SVG paths/markers are already
   * fully described by their presentation attributes.
   */
  private inlineComputedStyles(liveRoot: Element, cloneRoot: Element): void {
    const liveWalker  = document.createTreeWalker(liveRoot,  NodeFilter.SHOW_ELEMENT);
    const cloneWalker = document.createTreeWalker(cloneRoot, NodeFilter.SHOW_ELEMENT);

    // `Node` is shadowed by the ngx-vflow import, so use the DOM type explicitly.
    let live: globalThis.Node | null  = liveRoot;
    let clone: globalThis.Node | null = cloneRoot;
    while (live && clone) {
      if (live instanceof HTMLElement && clone instanceof HTMLElement) {
        const cs = getComputedStyle(live);
        let cssText = cs.cssText;
        if (!cssText) {
          for (let i = 0; i < cs.length; i++) {
            const p = cs[i];
            cssText += `${p}:${cs.getPropertyValue(p)};`;
          }
        }
        clone.style.cssText = cssText;
      }
      live  = liveWalker.nextNode();
      clone = cloneWalker.nextNode();
    }
  }
}

function triggerDownload(dataUrl: string, filename: string): void {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// Layout algorithms
// Each returns a Map of systemId → top-left {x, y} ready for vflow `point`.
// ══════════════════════════════════════════════════════════════════════════════

// ── 1. Force-directed (Fruchterman–Reingold) ───────────────────────────────────
//
// Steps:
//   1. Initialise nodes on a circle with a slight phase offset.
//   2. Iterate: repel every pair, attract connected pairs.
//   3. Cool temperature so movements shrink each iteration.
//   4. Nudge connected nodes that end up at the same vertical level
//      (bezier right→left degenerates to a straight line when Δy ≈ 0).

function forceLayout(
  systems:   ApiGraphSystemDto[],
  edgePairs: ReadonlyArray<{ source: string; target: string }>,
): Map<string, { x: number; y: number }> {
  const n = systems.length;
  if (n === 0) return new Map();

  const ISO_GAP   = 15;
  const ISO_COLS  = 6;
  const ISO_ROW_H = NODE_H + ISO_GAP;
  const COMP_GAP  = 80;   // horizontal gap between packed components
  const ROW_GAP   = 80;   // vertical gap between packed component rows

  // ── 1. Split: isolated (no edges at all) vs connected ────────────────────
  const connectedIds = new Set<string>();
  for (const e of edgePairs) { connectedIds.add(e.source); connectedIds.add(e.target); }
  const isolated  = systems.filter(s => !connectedIds.has(s.id));
  const connected = systems.filter(s =>  connectedIds.has(s.id));

  const pos = new Map<string, { x: number; y: number }>();

  // ── 2. Isolated strip: rows of ISO_COLS at the very top, 15 px gaps ───────
  isolated.forEach((s, i) => {
    pos.set(s.id, {
      x: MARGIN + (i % ISO_COLS) * (NODE_W + ISO_GAP),
      y: MARGIN + Math.floor(i / ISO_COLS) * ISO_ROW_H,
    });
  });
  const isoRowCount = isolated.length > 0 ? Math.ceil(isolated.length / ISO_COLS) : 0;
  const isoHeight   = isoRowCount > 0 ? MARGIN + isoRowCount * ISO_ROW_H : 0;

  if (connected.length === 0) return pos;

  // ── 3. Find disconnected components among connected nodes ─────────────────
  //    Each component gets its own independent force simulation so groups with
  //    no inter-component edges never repel each other to infinity.
  const components = findConnectedComponents(connected, edgePairs);

  // ── 4. Force-layout each component in its own local coordinate space ──────
  type LaidComp = { localPos: Map<string, { x: number; y: number }>; w: number; h: number };
  const laid: LaidComp[] = components.map(comp => {
    const compIdSet = new Set(comp.map(s => s.id));
    const compEdges = edgePairs.filter(e => compIdSet.has(e.source) && compIdSet.has(e.target));
    const localPos  = forceLayoutComponent(comp, compEdges);

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of localPos.values()) {
      minX = Math.min(minX, p.x); minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y);
    }
    return { localPos, w: maxX - minX + NODE_W, h: maxY - minY + NODE_H };
  });

  // Sort largest component first for better visual balance
  laid.sort((a, b) => b.w * b.h - a.w * a.h);

  // ── 5. Pack components into rows below the isolated strip ─────────────────
  const maxRowWidth = Math.max(1600, laid[0].w + 2 * MARGIN);
  let curX = MARGIN;
  let curY = MARGIN + isoHeight;
  let rowH = 0;

  for (const comp of laid) {
    if (curX + comp.w > maxRowWidth && curX > MARGIN) {
      curX  = MARGIN;
      curY += rowH + ROW_GAP;
      rowH  = 0;
    }
    for (const [id, p] of comp.localPos) {
      pos.set(id, { x: Math.round(curX + p.x), y: Math.round(curY + p.y) });
    }
    curX += comp.w + COMP_GAP;
    rowH  = Math.max(rowH, comp.h);
  }

  // ── 6. Nudge same-y connected pairs to guarantee edge curvature ───────────
  const MIN_DY = Math.ceil(NODE_H * 0.55);
  for (const e of edgePairs) {
    const a = pos.get(e.source), b = pos.get(e.target);
    if (!a || !b) continue;
    if (Math.abs(a.y - b.y) < MIN_DY) b.y += b.y >= a.y ? MIN_DY : -MIN_DY;
  }

  return pos;
}

/** Union-Find: groups nodes into disconnected components. */
function findConnectedComponents(
  nodes:     ApiGraphSystemDto[],
  edgePairs: ReadonlyArray<{ source: string; target: string }>,
): ApiGraphSystemDto[][] {
  const parent = new Map<string, string>(nodes.map(s => [s.id, s.id]));

  const find = (id: string): string => {
    if (parent.get(id) !== id) parent.set(id, find(parent.get(id)!));
    return parent.get(id)!;
  };
  const union = (a: string, b: string) => {
    const ra = find(a), rb = find(b);
    if (ra !== rb) parent.set(ra, rb);
  };

  for (const e of edgePairs) {
    if (parent.has(e.source) && parent.has(e.target)) union(e.source, e.target);
  }

  const groups = new Map<string, ApiGraphSystemDto[]>();
  for (const s of nodes) {
    const root = find(s.id);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root)!.push(s);
  }
  return [...groups.values()];
}

/** Fruchterman–Reingold for a single component; returns local coords (origin = 0,0). */
function forceLayoutComponent(
  systems:   ApiGraphSystemDto[],
  edgePairs: ReadonlyArray<{ source: string; target: string }>,
): Map<string, { x: number; y: number }> {
  const nc = systems.length;
  if (nc === 1) return new Map([[systems[0].id, { x: 0, y: 0 }]]);

  const cols = Math.ceil(Math.sqrt(nc * (16 / 9)));
  const rows = Math.ceil(nc / cols);
  const W = Math.max(700, cols * (NODE_W + 280));
  const H = Math.max(500, rows * (NODE_H + 220));
  const k = Math.sqrt((W * H) / nc);

  const cx = W / 2, cy = H / 2, r = Math.min(W, H) * 0.30;
  const pos = new Map<string, { x: number; y: number }>();
  systems.forEach((s, i) => {
    const a = (2 * Math.PI * i) / nc + 0.4;
    pos.set(s.id, { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
  });

  const ITER = 300;
  let temp = W / 6;
  const cool = temp / ITER;

  for (let it = 0; it < ITER; it++) {
    const disp = new Map<string, { dx: number; dy: number }>(
      systems.map(s => [s.id, { dx: 0, dy: 0 }]),
    );

    for (let i = 0; i < nc - 1; i++) {
      for (let j = i + 1; j < nc; j++) {
        const a = pos.get(systems[i].id)!, b = pos.get(systems[j].id)!;
        const dx = a.x - b.x || 0.01, dy = a.y - b.y || 0.01;
        const d = Math.sqrt(dx * dx + dy * dy);
        const f = (k * k) / d, ux = dx / d, uy = dy / d;
        disp.get(systems[i].id)!.dx += ux * f;  disp.get(systems[i].id)!.dy += uy * f;
        disp.get(systems[j].id)!.dx -= ux * f;  disp.get(systems[j].id)!.dy -= uy * f;
      }
    }

    for (const e of edgePairs) {
      const a = pos.get(e.source), b = pos.get(e.target);
      if (!a || !b) continue;
      const dx = a.x - b.x || 0.01, dy = a.y - b.y || 0.01;
      const d = Math.sqrt(dx * dx + dy * dy);
      const f = (d * d) / k, ux = dx / d, uy = dy / d;
      disp.get(e.source)!.dx -= ux * f;  disp.get(e.source)!.dy -= uy * f;
      disp.get(e.target)!.dx += ux * f;  disp.get(e.target)!.dy += uy * f;
    }

    for (const s of systems) {
      const p = pos.get(s.id)!, d = disp.get(s.id)!;
      const len = Math.sqrt(d.dx * d.dx + d.dy * d.dy);
      if (len > 0) { const c = Math.min(len, temp); p.x += (d.dx / len) * c; p.y += (d.dy / len) * c; }
    }
    temp -= cool;
  }

  // Normalise to local origin (0, 0)
  let minX = Infinity, minY = Infinity;
  for (const p of pos.values()) { minX = Math.min(minX, p.x); minY = Math.min(minY, p.y); }
  for (const p of pos.values()) { p.x = Math.round(p.x - minX); p.y = Math.round(p.y - minY); }
  return pos;
}

// ── 2. Layered (hierarchical, role-based columns) ─────────────────────────────
//
// Ranks:  pure-producer (0) | mixed (1) | pure-consumer (2) | isolated (3)
// Each rank forms one vertical column, centred against the tallest column.

function layeredLayout(
  systems:   ApiGraphSystemDto[],
  edgePairs: ReadonlyArray<{ source: string; target: string }>,
): Map<string, { x: number; y: number }> {
  const H_GAP = 160, V_GAP = 80;

  const producerIds = new Set(edgePairs.map(e => e.source));
  const consumerIds = new Set(edgePairs.map(e => e.target));

  const rankOf = (id: string): number => {
    const p = producerIds.has(id), c = consumerIds.has(id);
    if (p && !c) return 0;
    if (p && c)  return 1;
    if (!p && c) return 2;
    return 3;
  };

  const sorted = [...systems].sort((a, b) => {
    const ra = rankOf(a.id), rb = rankOf(b.id);
    return ra !== rb ? ra - rb : a.name.localeCompare(b.name);
  });

  const groups: ApiGraphSystemDto[][] = [[], [], [], []];
  for (const s of sorted) groups[rankOf(s.id)].push(s);

  const columns = groups.filter(c => c.length > 0);
  const colHeights = columns.map(c => c.length * NODE_H + (c.length - 1) * V_GAP);
  const maxH = Math.max(0, ...colHeights);

  const pos = new Map<string, { x: number; y: number }>();
  columns.forEach((col, ci) => {
    const x = MARGIN + ci * (NODE_W + H_GAP);
    const yStart = MARGIN + (maxH - colHeights[ci]) / 2;
    col.forEach((s, ri) => pos.set(s.id, { x, y: yStart + ri * (NODE_H + V_GAP) }));
  });
  return pos;
}

// ── 3. Circular ────────────────────────────────────────────────────────────────
//
// All nodes evenly spaced on a circle; radius scales with n.

function circularLayout(
  systems: ApiGraphSystemDto[],
): Map<string, { x: number; y: number }> {
  const n = systems.length;
  if (n === 0) return new Map();
  if (n === 1) return new Map([[systems[0].id, { x: MARGIN, y: MARGIN }]]);

  // Radius large enough so nodes don't overlap
  const circumference = n * (NODE_W + 60);
  const r  = Math.max(260, circumference / (2 * Math.PI));
  const cx = r + MARGIN + NODE_W / 2;
  const cy = r + MARGIN + NODE_H / 2;

  const pos = new Map<string, { x: number; y: number }>();
  systems.forEach((s, i) => {
    const a = (2 * Math.PI * i) / n - Math.PI / 2;  // start at top
    pos.set(s.id, {
      x: Math.round(cx + r * Math.cos(a) - NODE_W / 2),
      y: Math.round(cy + r * Math.sin(a) - NODE_H / 2),
    });
  });
  return pos;
}
