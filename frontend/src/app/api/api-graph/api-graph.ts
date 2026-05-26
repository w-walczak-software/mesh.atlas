import {
  ChangeDetectionStrategy,
  Component,
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
  EdgeLabelHtmlTemplateDirective,
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

// ── Node dimensions & layout margin ───────────────────────────────────────────
const NODE_W = 280;
const NODE_H = 116;
const MARGIN = 80;

// ── Node color palette ─────────────────────────────────────────────────────────
const PALETTE = [
  { bg: 'rgba(99,102,241,.1)', bd: 'rgba(99,102,241,.5)', acc: '#6366f1' },
  { bg: 'rgba(16,185,129,.1)', bd: 'rgba(16,185,129,.5)', acc: '#10b981' },
  { bg: 'rgba(14,165,233,.1)', bd: 'rgba(14,165,233,.5)', acc: '#0ea5e9' },
  { bg: 'rgba(245,158,11,.1)', bd: 'rgba(245,158,11,.5)', acc: '#f59e0b' },
  { bg: 'rgba(168,85,247,.1)', bd: 'rgba(168,85,247,.5)', acc: '#a855f7' },
  { bg: 'rgba(236,72,153,.1)', bd: 'rgba(236,72,153,.5)', acc: '#ec4899' },
  { bg: 'rgba(20,184,166,.1)', bd: 'rgba(20,184,166,.5)', acc: '#14b8a6' },
  { bg: 'rgba(234,179,8,.1)', bd: 'rgba(234,179,8,.5)', acc: '#eab308' },
  { bg: 'rgba(249,115,22,.1)', bd: 'rgba(249,115,22,.5)', acc: '#f97316' },
  { bg: 'rgba(239,68,68,.1)', bd: 'rgba(239,68,68,.5)', acc: '#ef4444' },
];

// ── Edge colors — vibrant, readable in both light and dark mode ────────────────
const EDGE_PALETTE = [
  '#6366f1',
  '#10b981',
  '#0ea5e9',
  '#f59e0b',
  '#a855f7',
  '#ec4899',
  '#14b8a6',
  '#eab308',
  '#f97316',
  '#ef4444',
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
    EdgeLabelHtmlTemplateDirective,
    HandleComponent,
  ],
  providers: [provideTranslocoScope('api')],
  templateUrl: './api-graph.html',
  styleUrl: './api-graph.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApiGraph implements OnInit {
  private readonly apiService = inject(ApiService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly t = inject(TranslocoService);

  private readonly vflow = viewChild(VflowComponent);

  protected readonly lang = toSignal(this.t.langChanges$, { initialValue: this.t.getActiveLang() });
  protected readonly loading = signal(true);
  protected readonly nodes = signal<Node[]>([]);
  protected readonly edges = signal<Edge[]>([]);

  protected readonly background = {
    type: 'dots' as const,
    color: 'rgba(148,163,184,0.25)',
    gap: 24,
    size: 1.5,
    backgroundColor: 'var(--mat-sys-surface)',
  };

  ngOnInit(): void {
    this.loadGraph();
  }

  protected loadGraph(): void {
    this.loading.set(true);
    this.apiService.findGraph({}).subscribe({
      next: (result) => {
        this.buildGraph(result);
        this.loading.set(false);
        // Fit viewport after Angular renders the new nodes
        setTimeout(() => this.vflow()?.fitView({ duration: 400 }), 60);
      },
      error: () => this.loading.set(false),
    });
  }

  private buildGraph(result: ApiGraphResultDto): void {
    const { systems, apis } = result;
    const systemIdSet = new Set(systems.map((s) => s.id));

    // ── Collect unique directed pairs (input to force layout) ─────────────────
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

    // ── Force-directed layout ─────────────────────────────────────────────────
    const posMap = forceLayout(systems, edgePairs);

    // ── Build nodes ───────────────────────────────────────────────────────────
    const nodes = createNodes<SystemNodeData>(
      systems.map((s, i) => {
        const pal = PALETTE[i % PALETTE.length];
        const pos = posMap.get(s.id) ?? { x: MARGIN + i * (NODE_W + 40), y: MARGIN };
        return {
          id: s.id,
          type: 'html-template' as const,
          point: pos,
          width: NODE_W,
          height: NODE_H,
          draggable: true,
          data: {
            systemId: s.id,
            code: s.code,
            name: s.name,
            icon: s.icon,
            statusName: s.status?.name ?? '',
            bgColor: pal.bg,
            borderColor: pal.bd,
            accentColor: pal.acc,
          } satisfies SystemNodeData,
        };
      }),
    );

    // ── Build edge groups (one per directed pair) ─────────────────────────────
    const edgeMap = new Map<string, ApiEdgeGroupData>();
    let edgeColorIdx = 0;

    for (const api of apis) {
      if (!api.producerSystemId || !systemIdSet.has(api.producerSystemId)) continue;
      for (const csId of api.consumerSystemIds) {
        if (!systemIdSet.has(csId)) continue;
        const key = `${api.producerSystemId}__${csId}`;
        if (!edgeMap.has(key)) {
          edgeMap.set(key, {
            edgeKey: key,
            producerSystemId: api.producerSystemId,
            consumerSystemId: csId,
            transportLayer: api.transportLayer ?? null,
            apis: [],
            edgeColor: EDGE_PALETTE[edgeColorIdx++ % EDGE_PALETTE.length],
          });
        }
        edgeMap.get(key)!.apis.push(api);
      }
    }

    const edges = createEdges<ApiEdgeGroupData>(
      [...edgeMap.values()].map((group) => ({
        id: group.edgeKey,
        source: group.producerSystemId,
        target: group.consumerSystemId,
        type: 'template' as const,
        curve: 'bezier' as const,
        markers: {
          end: {
            type: 'arrow-closed' as const,
            color: group.edgeColor,
            width: 20,
            height: 20,
          },
        },
        edgeLabels: {
          center: { type: 'html-template' as const, data: group },
        },
        data: group,
      })),
    );

    this.nodes.set(nodes);
    this.edges.set(edges);
  }

  // ── Interaction handlers ───────────────────────────────────────────────────

  protected onNodeDblClick(data: SystemNodeData): void {
    this.router.navigate(['/it-systems', data.systemId, 'edit']);
  }

  protected onEdgeDblClick(group: ApiEdgeGroupData): void {
    if (group.apis.length === 1) {
      this.router.navigate(['/apis', group.apis[0].id, 'edit']);
    } else {
      this.dialog
        .open<ApiSelectDialog, ApiSelectDialogData, string>(ApiSelectDialog, {
          data: { apis: group.apis },
          width: '480px',
          autoFocus: false,
        })
        .afterClosed()
        .subscribe((apiId) => {
          if (apiId) this.router.navigate(['/apis', apiId, 'edit']);
        });
    }
  }

  // ── Viewport controls ──────────────────────────────────────────────────────

  protected fitView(): void {
    this.vflow()?.fitView({ duration: 300 });
  }

  protected zoomIn(): void {
    const current = this.vflow()?.viewport().zoom ?? 1;
    this.vflow()?.zoomTo(Math.min(current * 1.3, 4));
  }

  protected zoomOut(): void {
    const current = this.vflow()?.viewport().zoom ?? 1;
    this.vflow()?.zoomTo(Math.max(current * 0.77, 0.1));
  }

  protected goBack(): void {
    this.router.navigate(['/apis']);
  }
}

// ── Force-directed layout — Fruchterman–Reingold ───────────────────────────────
//
// Returns top-left corner positions (ready for vflow `point`).
//
// Algorithm overview:
//   1. Initialise all nodes on a circle.
//   2. Iterate: repel every pair, attract connected pairs.
//   3. Cool temperature so movements shrink each iteration.
//   4. Post-process: nudge any connected pair that is too close vertically,
//      because a bezier from right→left handle degenerates to a straight line
//      when both handles share the same y.

function forceLayout(
  systems: ApiGraphSystemDto[],
  edgePairs: ReadonlyArray<{ source: string; target: string }>,
): Map<string, { x: number; y: number }> {
  const n = systems.length;

  if (n === 0) return new Map();
  if (n === 1) return new Map([[systems[0].id, { x: MARGIN, y: MARGIN }]]);

  // ── Virtual canvas ────────────────────────────────────────────────────────
  // Grows with √n so node density stays consistent.
  const cols = Math.ceil(Math.sqrt(n * (16 / 9))); // target ~16:9 fill
  const rows = Math.ceil(n / cols);
  const W = Math.max(1400, cols * (NODE_W + 280));
  const H = Math.max(900, rows * (NODE_H + 220));
  const k = Math.sqrt((W * H) / n); // ideal inter-node distance

  // ── Circle initialisation (slight phase offset avoids axis alignment) ─────
  const cx = W / 2;
  const cy = H / 2;
  const r = Math.min(W, H) * 0.3;

  const pos = new Map<string, { x: number; y: number }>();
  systems.forEach((s, i) => {
    const a = (2 * Math.PI * i) / n + 0.4; // 0.4 rad offset ≈ 23°
    pos.set(s.id, { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
  });

  // ── Simulation ────────────────────────────────────────────────────────────
  const ITER = 300;
  let temp = W / 6;
  const cool = temp / ITER;

  for (let it = 0; it < ITER; it++) {
    const disp = new Map<string, { dx: number; dy: number }>(
      systems.map((s) => [s.id, { dx: 0, dy: 0 }]),
    );

    // Repulsion — O(n²), negligible for enterprise-scale graphs (n < ~100)
    for (let i = 0; i < n - 1; i++) {
      for (let j = i + 1; j < n; j++) {
        const a = pos.get(systems[i].id)!;
        const b = pos.get(systems[j].id)!;
        const dx = a.x - b.x || 0.01; // avoid zero vector
        const dy = a.y - b.y || 0.01;
        const d = Math.sqrt(dx * dx + dy * dy);
        const f = (k * k) / d;
        const ux = dx / d;
        const uy = dy / d;
        disp.get(systems[i].id)!.dx += ux * f;
        disp.get(systems[i].id)!.dy += uy * f;
        disp.get(systems[j].id)!.dx -= ux * f;
        disp.get(systems[j].id)!.dy -= uy * f;
      }
    }

    // Attraction — connected pairs
    for (const e of edgePairs) {
      const a = pos.get(e.source);
      const b = pos.get(e.target);
      if (!a || !b) continue;
      const dx = a.x - b.x || 0.01;
      const dy = a.y - b.y || 0.01;
      const d = Math.sqrt(dx * dx + dy * dy);
      const f = (d * d) / k;
      const ux = dx / d;
      const uy = dy / d;
      disp.get(e.source)!.dx -= ux * f;
      disp.get(e.source)!.dy -= uy * f;
      disp.get(e.target)!.dx += ux * f;
      disp.get(e.target)!.dy += uy * f;
    }

    // Apply displacements, clamped by current temperature
    for (const s of systems) {
      const p = pos.get(s.id)!;
      const d = disp.get(s.id)!;
      const len = Math.sqrt(d.dx * d.dx + d.dy * d.dy);
      if (len > 0) {
        const clamp = Math.min(len, temp);
        p.x += (d.dx / len) * clamp;
        p.y += (d.dy / len) * clamp;
      }
    }

    temp -= cool;
  }

  // ── Translate to top-left corner with MARGIN padding ──────────────────────
  let minX = Infinity,
    minY = Infinity;
  for (const p of pos.values()) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
  }
  for (const p of pos.values()) {
    p.x = Math.round(p.x - minX + MARGIN);
    p.y = Math.round(p.y - minY + MARGIN);
  }

  // ── Guarantee bezier curvature ────────────────────────────────────────────
  // A cubic bezier between a right-side source handle and a left-side target
  // handle degenerates to a straight line when both handles share the same y.
  // Handle y = node.y + NODE_H/2, so we need |Δnode.y| ≥ MIN_DY.
  const MIN_DY = Math.ceil(NODE_H * 0.55); // ≈ 64 px → visible arc at any zoom

  for (const e of edgePairs) {
    const a = pos.get(e.source);
    const b = pos.get(e.target);
    if (!a || !b) continue;
    if (Math.abs(a.y - b.y) < MIN_DY) {
      // Nudge target; direction chosen to preserve existing offset sign (or downward by default)
      b.y += b.y >= a.y ? MIN_DY : -MIN_DY;
    }
  }

  return pos;
}
