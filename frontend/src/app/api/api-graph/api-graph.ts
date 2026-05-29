import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { provideTranslocoScope, TranslocoDirective, TranslocoService } from '@jsverse/transloco';
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

  protected readonly lang         = toSignal(this.t.langChanges$, { initialValue: this.t.getActiveLang() });
  protected readonly loading      = signal(true);
  protected readonly nodes        = signal<Node[]>([]);
  protected readonly edges        = signal<Edge[]>([]);
  protected readonly layout       = signal<GraphLayout>('force');
  protected readonly animateEdges = signal(false);
  protected readonly hasFilters   = computed(() => this.filterState.hasActiveFilters());
  protected readonly hoverTooltip = signal<HoverTooltip | null>(null);
  protected readonly backTooltip  = computed(() =>
    this.filterState.getSourceRoute() === '/it-systems'
      ? this.t.translate('api.graph.backToItSystems')
      : this.t.translate('api.graph.backToList')
  );

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
          edgeMap.set(key, {
            edgeKey:          key,
            producerSystemId: api.producerSystemId,
            consumerSystemId: csId,
            transportLayer:   api.transportLayer ?? null,
            apis:             [],
            edgeColor:        EDGE_PALETTE[edgeColorIdx++ % EDGE_PALETTE.length],
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
        { data: { system: data }, width: '420px', autoFocus: false },
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
          width:     '440px',
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
  if (n === 1) return new Map([[systems[0].id, { x: MARGIN, y: MARGIN }]]);

  // Virtual canvas scales with √n to keep density consistent
  const cols = Math.ceil(Math.sqrt(n * (16 / 9)));
  const rows = Math.ceil(n / cols);
  const W = Math.max(1400, cols * (NODE_W + 280));
  const H = Math.max(900,  rows * (NODE_H + 220));
  const k = Math.sqrt((W * H) / n);   // ideal inter-node distance

  // Circle initialisation — 0.4 rad offset avoids perfectly horizontal pairs
  const cx = W / 2, cy = H / 2, r = Math.min(W, H) * 0.30;
  const pos = new Map<string, { x: number; y: number }>();
  systems.forEach((s, i) => {
    const a = (2 * Math.PI * i) / n + 0.4;
    pos.set(s.id, { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
  });

  const ITER = 300;
  let temp  = W / 6;
  const cool = temp / ITER;

  for (let it = 0; it < ITER; it++) {
    const disp = new Map<string, { dx: number; dy: number }>(
      systems.map(s => [s.id, { dx: 0, dy: 0 }]),
    );

    // Repulsion — O(n²)
    for (let i = 0; i < n - 1; i++) {
      for (let j = i + 1; j < n; j++) {
        const a  = pos.get(systems[i].id)!;
        const b  = pos.get(systems[j].id)!;
        const dx = a.x - b.x || 0.01;
        const dy = a.y - b.y || 0.01;
        const d  = Math.sqrt(dx * dx + dy * dy);
        const f  = (k * k) / d, ux = dx / d, uy = dy / d;
        disp.get(systems[i].id)!.dx += ux * f;
        disp.get(systems[i].id)!.dy += uy * f;
        disp.get(systems[j].id)!.dx -= ux * f;
        disp.get(systems[j].id)!.dy -= uy * f;
      }
    }

    // Attraction — connected pairs
    for (const e of edgePairs) {
      const a = pos.get(e.source), b = pos.get(e.target);
      if (!a || !b) continue;
      const dx = a.x - b.x || 0.01, dy = a.y - b.y || 0.01;
      const d  = Math.sqrt(dx * dx + dy * dy);
      const f  = (d * d) / k, ux = dx / d, uy = dy / d;
      disp.get(e.source)!.dx -= ux * f;
      disp.get(e.source)!.dy -= uy * f;
      disp.get(e.target)!.dx += ux * f;
      disp.get(e.target)!.dy += uy * f;
    }

    // Apply, clamped by temperature
    for (const s of systems) {
      const p = pos.get(s.id)!, d = disp.get(s.id)!;
      const len = Math.sqrt(d.dx * d.dx + d.dy * d.dy);
      if (len > 0) {
        const c = Math.min(len, temp);
        p.x += (d.dx / len) * c;
        p.y += (d.dy / len) * c;
      }
    }
    temp -= cool;
  }

  // Translate to origin with MARGIN
  let minX = Infinity, minY = Infinity;
  for (const p of pos.values()) { minX = Math.min(minX, p.x); minY = Math.min(minY, p.y); }
  for (const p of pos.values()) { p.x = Math.round(p.x - minX + MARGIN); p.y = Math.round(p.y - minY + MARGIN); }

  // Guarantee curvature: nudge pairs that share the same y
  const MIN_DY = Math.ceil(NODE_H * 0.55);
  for (const e of edgePairs) {
    const a = pos.get(e.source), b = pos.get(e.target);
    if (!a || !b) continue;
    if (Math.abs(a.y - b.y) < MIN_DY) {
      b.y += b.y >= a.y ? MIN_DY : -MIN_DY;
    }
  }

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
