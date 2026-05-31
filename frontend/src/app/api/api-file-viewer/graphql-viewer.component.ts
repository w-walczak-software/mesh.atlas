import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  input,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BUILT_IN_SCALARS, GqlField, parseGraphql } from './graphql-parser';

interface GqlOperation {
  kind: 'QUERY' | 'MUTATION' | 'SUBSCRIPTION';
  field: GqlField;
}

@Component({
  selector: 'app-graphql-viewer',
  imports: [MatButtonModule, MatExpansionModule, MatIconModule, MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <!-- ── Toolbar ──────────────────────────────────────────────────────── -->
    @if (!parseError()) {
      <div class="gv-toolbar">
        <span class="gv-brand-badge">GraphQL</span>
        @if (queryOpsCount()) {
          <span class="gv-pill gv-pill--q" matTooltip="Queries">
            <mat-icon>arrow_circle_right</mat-icon>{{ queryOpsCount() }}
          </span>
        }
        @if (mutationOpsCount()) {
          <span class="gv-pill gv-pill--m" matTooltip="Mutations">
            <mat-icon>edit</mat-icon>{{ mutationOpsCount() }}
          </span>
        }
        @if (subscriptionOpsCount()) {
          <span class="gv-pill gv-pill--s" matTooltip="Subscriptions">
            <mat-icon>notifications</mat-icon>{{ subscriptionOpsCount() }}
          </span>
        }
        @if (schema()?.types?.length) {
          <span class="gv-pill gv-pill--t" matTooltip="Object types">
            <mat-icon>data_object</mat-icon>{{ objectTypes().length }}
          </span>
        }
      </div>
    }

    <!-- ── Parse error ───────────────────────────────────────────────────── -->
    @if (parseError()) {
      <div class="gv-error">
        <mat-icon>broken_image</mat-icon>
        <span>Could not parse GraphQL schema</span>
      </div>
    } @else if (schema(); as s) {

      <div class="gv-body">

        <!-- ── Filter ────────────────────────────────────────────────────── -->
        <div class="gv-filter">
          <mat-icon>search</mat-icon>
          <input class="gv-filter__input"
                 placeholder="Filter by name…"
                 [value]="filter()"
                 (input)="filter.set($any($event.target).value)" />
          @if (filter()) {
            <button mat-icon-button class="gv-filter__clear" (click)="filter.set('')">
              <mat-icon>close</mat-icon>
            </button>
          }
        </div>

        <!-- ── Operations ────────────────────────────────────────────────── -->
        @if (filteredOps().length) {
          <div class="gv-section">
            <div class="gv-section-hd">
              <mat-icon>flash_on</mat-icon>
              <span>Operations</span>
              <span class="gv-count">{{ filteredOps().length }}</span>
            </div>
            <mat-accordion class="gv-accordion" multi="false">
              @for (op of filteredOps(); track op.field.name) {
                <mat-expansion-panel class="gv-panel" hideToggle>
                  <mat-expansion-panel-header class="gv-panel__hdr">
                    <mat-panel-title class="gv-panel__title">
                      <span class="gv-kind gv-kind--{{ op.kind.toLowerCase() }}">{{ op.kind }}</span>
                      <span class="gv-field-name">{{ op.field.name }}</span>
                      @if (op.field.args.length) {
                        <span class="gv-args-badge" matTooltip="{{ op.field.args.length }} argument(s)">
                          ({{ op.field.args.length }})
                        </span>
                      }
                      @if (op.field.isDeprecated) {
                        <mat-icon class="gv-deprecated-icon" matTooltip="Deprecated">warning_amber</mat-icon>
                      }
                    </mat-panel-title>
                    <mat-panel-description class="gv-panel__desc">
                      <span class="gv-return-type">{{ op.field.type }}</span>
                      <mat-icon class="gv-chevron">expand_more</mat-icon>
                    </mat-panel-description>
                  </mat-expansion-panel-header>

                  <div class="gv-panel__body">
                    @if (op.field.isDeprecated) {
                      <div class="gv-deprecated-banner">
                        <mat-icon>warning_amber</mat-icon>
                        <span>Deprecated{{ op.field.deprecationReason ? ': ' + op.field.deprecationReason : '' }}</span>
                      </div>
                    }
                    @if (op.field.description) {
                      <p class="gv-doc">{{ op.field.description }}</p>
                    }
                    @if (op.field.args.length) {
                      <div class="gv-args">
                        <div class="gv-args__hd">Arguments</div>
                        @for (arg of op.field.args; track arg.name) {
                          <div class="gv-arg">
                            <span class="gv-arg__name">{{ arg.name }}</span>
                            <span class="gv-arg__sep">:</span>
                            <span class="gv-arg__type">{{ arg.type }}</span>
                            @if (arg.defaultValue) {
                              <span class="gv-arg__default">= {{ arg.defaultValue }}</span>
                            }
                            @if (arg.description) {
                              <mat-icon class="gv-arg__info"
                                        [matTooltip]="arg.description">info_outline</mat-icon>
                            }
                          </div>
                        }
                      </div>
                    }
                  </div>
                </mat-expansion-panel>
              }
            </mat-accordion>
          </div>
        }

        <!-- ── Object types ───────────────────────────────────────────────── -->
        @if (filteredTypes().length) {
          <div class="gv-section">
            <div class="gv-section-hd">
              <mat-icon>data_object</mat-icon>
              <span>Types</span>
              <span class="gv-count">{{ filteredTypes().length }}</span>
            </div>
            <mat-accordion class="gv-accordion" multi="false">
              @for (type of filteredTypes(); track type.name) {
                <mat-expansion-panel class="gv-panel" hideToggle>
                  <mat-expansion-panel-header class="gv-panel__hdr">
                    <mat-panel-title class="gv-panel__title">
                      <span class="gv-type-name">{{ type.name }}</span>
                      @if (type.implements.length) {
                        <span class="gv-implements" [matTooltip]="'implements ' + type.implements.join(' &amp; ')">
                          <mat-icon>account_tree</mat-icon>
                        </span>
                      }
                    </mat-panel-title>
                    <mat-panel-description class="gv-panel__desc">
                      <span class="gv-count">{{ type.fields.length }}</span>
                      <span class="gv-muted">&nbsp;fields</span>
                      <mat-icon class="gv-chevron">expand_more</mat-icon>
                    </mat-panel-description>
                  </mat-expansion-panel-header>
                  <div class="gv-fields">
                    @if (type.implements.length) {
                      <div class="gv-implements-row">
                        <span class="gv-implements-lbl">implements</span>
                        @for (iface of type.implements; track iface) {
                          <span class="gv-iface-tag">{{ iface }}</span>
                        }
                      </div>
                    }
                    @if (type.description) {
                      <p class="gv-doc gv-doc--compact">{{ type.description }}</p>
                    }
                    @for (field of type.fields; track field.name) {
                      <div class="gv-field" [class.gv-field--deprecated]="field.isDeprecated">
                        <span class="gv-field__name">{{ field.name }}</span>
                        @if (field.args.length) {
                          <span class="gv-field__args">({{ field.args.map(a => a.name + ': ' + a.type).join(', ') }})</span>
                        }
                        <span class="gv-field__sep">:</span>
                        <span class="gv-field__type">{{ field.type }}</span>
                        @if (field.isDeprecated) {
                          <mat-icon class="gv-deprecated-icon" [matTooltip]="field.deprecationReason || 'Deprecated'">warning_amber</mat-icon>
                        }
                        @if (field.description) {
                          <mat-icon class="gv-field__info" [matTooltip]="field.description">info_outline</mat-icon>
                        }
                      </div>
                    }
                  </div>
                </mat-expansion-panel>
              }
            </mat-accordion>
          </div>
        }

        <!-- ── Interfaces ─────────────────────────────────────────────────── -->
        @if (filteredInterfaces().length) {
          <div class="gv-section">
            <div class="gv-section-hd">
              <mat-icon>account_tree</mat-icon>
              <span>Interfaces</span>
              <span class="gv-count">{{ filteredInterfaces().length }}</span>
            </div>
            <mat-accordion class="gv-accordion" multi="false">
              @for (iface of filteredInterfaces(); track iface.name) {
                <mat-expansion-panel class="gv-panel" hideToggle>
                  <mat-expansion-panel-header class="gv-panel__hdr">
                    <mat-panel-title class="gv-panel__title">
                      <span class="gv-type-name">{{ iface.name }}</span>
                    </mat-panel-title>
                    <mat-panel-description class="gv-panel__desc">
                      <span class="gv-count">{{ iface.fields.length }}</span>
                      <span class="gv-muted">&nbsp;fields</span>
                      <mat-icon class="gv-chevron">expand_more</mat-icon>
                    </mat-panel-description>
                  </mat-expansion-panel-header>
                  <div class="gv-fields">
                    @for (field of iface.fields; track field.name) {
                      <div class="gv-field">
                        <span class="gv-field__name">{{ field.name }}</span>
                        <span class="gv-field__sep">:</span>
                        <span class="gv-field__type">{{ field.type }}</span>
                      </div>
                    }
                  </div>
                </mat-expansion-panel>
              }
            </mat-accordion>
          </div>
        }

        <!-- ── Inputs ─────────────────────────────────────────────────────── -->
        @if (filteredInputs().length) {
          <div class="gv-section">
            <div class="gv-section-hd">
              <mat-icon>input</mat-icon>
              <span>Inputs</span>
              <span class="gv-count">{{ filteredInputs().length }}</span>
            </div>
            <mat-accordion class="gv-accordion" multi="false">
              @for (inp of filteredInputs(); track inp.name) {
                <mat-expansion-panel class="gv-panel" hideToggle>
                  <mat-expansion-panel-header class="gv-panel__hdr">
                    <mat-panel-title class="gv-panel__title">
                      <span class="gv-type-name">{{ inp.name }}</span>
                    </mat-panel-title>
                    <mat-panel-description class="gv-panel__desc">
                      <span class="gv-count">{{ inp.fields.length }}</span>
                      <span class="gv-muted">&nbsp;fields</span>
                      <mat-icon class="gv-chevron">expand_more</mat-icon>
                    </mat-panel-description>
                  </mat-expansion-panel-header>
                  <div class="gv-fields">
                    @for (field of inp.fields; track field.name) {
                      <div class="gv-field">
                        <span class="gv-field__name">{{ field.name }}</span>
                        <span class="gv-field__sep">:</span>
                        <span class="gv-field__type">{{ field.type }}</span>
                      </div>
                    }
                  </div>
                </mat-expansion-panel>
              }
            </mat-accordion>
          </div>
        }

        <!-- ── Enums ──────────────────────────────────────────────────────── -->
        @if (filteredEnums().length) {
          <div class="gv-section">
            <div class="gv-section-hd">
              <mat-icon>list</mat-icon>
              <span>Enums</span>
              <span class="gv-count">{{ filteredEnums().length }}</span>
            </div>
            <mat-accordion class="gv-accordion" multi="false">
              @for (en of filteredEnums(); track en.name) {
                <mat-expansion-panel class="gv-panel" hideToggle>
                  <mat-expansion-panel-header class="gv-panel__hdr">
                    <mat-panel-title class="gv-panel__title">
                      <span class="gv-type-name">{{ en.name }}</span>
                    </mat-panel-title>
                    <mat-panel-description class="gv-panel__desc">
                      <span class="gv-count">{{ en.values.length }}</span>
                      <span class="gv-muted">&nbsp;values</span>
                      <mat-icon class="gv-chevron">expand_more</mat-icon>
                    </mat-panel-description>
                  </mat-expansion-panel-header>
                  @if (en.description) {
                    <p class="gv-doc gv-doc--compact">{{ en.description }}</p>
                  }
                  <div class="gv-enum-values">
                    @for (val of en.values; track val.name) {
                      <div class="gv-enum-val" [class.gv-enum-val--deprecated]="val.isDeprecated">
                        <span class="gv-enum-val__name">{{ val.name }}</span>
                        @if (val.isDeprecated) {
                          <mat-icon class="gv-deprecated-icon"
                                    [matTooltip]="val.deprecationReason || 'Deprecated'">warning_amber</mat-icon>
                        }
                        @if (val.description && !val.isDeprecated) {
                          <span class="gv-muted">{{ val.description }}</span>
                        }
                      </div>
                    }
                  </div>
                </mat-expansion-panel>
              }
            </mat-accordion>
          </div>
        }

        <!-- ── Scalars ────────────────────────────────────────────────────── -->
        @if (customScalars().length) {
          <div class="gv-section">
            <div class="gv-section-hd">
              <mat-icon>tag</mat-icon>
              <span>Custom Scalars</span>
              <span class="gv-count">{{ customScalars().length }}</span>
            </div>
            <div class="gv-scalars">
              @for (sc of customScalars(); track sc) {
                <span class="gv-scalar-chip">{{ sc }}</span>
              }
            </div>
          </div>
        }

        <!-- ── Unions ─────────────────────────────────────────────────────── -->
        @if (filteredUnions().length) {
          <div class="gv-section">
            <div class="gv-section-hd">
              <mat-icon>merge</mat-icon>
              <span>Unions</span>
              <span class="gv-count">{{ filteredUnions().length }}</span>
            </div>
            <div class="gv-unions">
              @for (u of filteredUnions(); track u.name) {
                <div class="gv-union">
                  <span class="gv-union__name">{{ u.name }}</span>
                  <span class="gv-union__eq">=</span>
                  @for (m of u.members; track m; let last = $last) {
                    <span class="gv-union__member">{{ m }}</span>
                    @if (!last) { <span class="gv-union__pipe">|</span> }
                  }
                </div>
              }
            </div>
          </div>
        }

      </div>
    }
  `,
  styles: [`
    /* ── Host & theme vars ───────────────────────────────────────────── */
    app-graphql-viewer {
      display: flex; flex-direction: column; height: 100%; overflow: hidden;
      --gv-bg:           #f4f3f7;
      --gv-bg-card:      #ffffff;
      --gv-bg-panel:     #ffffff;
      --gv-bg-panel-hdr: #faf8ff;
      --gv-bg-field-odd: #fafafa;
      --gv-bg-field-ev:  #ffffff;
      --gv-bg-args:      #f8f5ff;
      --gv-bg-dep:       #fff3e0;
      --gv-text:         #1c1b1f;
      --gv-text-2:       #49454e;
      --gv-text-muted:   #79747e;
      --gv-text-type:    #6a0dad;
      --gv-text-dep:     #bf360c;
      --gv-border:       #e0dde7;
      --gv-badge-bg:     #f3e5f5;
      --gv-badge-text:   #6a1b9a;
      --gv-shadow:       0 1px 4px rgba(0,0,0,.10), 0 0 1px rgba(0,0,0,.06);
      --gv-mono:         'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;
      background: var(--gv-bg); color: var(--gv-text);
      font-family: Inter, system-ui, sans-serif; font-size: 13px;
    }

    app-graphql-viewer.gv-dark {
      --gv-bg:           #141218;
      --gv-bg-card:      #1d1b20;
      --gv-bg-panel:     #1d1b20;
      --gv-bg-panel-hdr: #221f2a;
      --gv-bg-field-odd: #1d1b20;
      --gv-bg-field-ev:  #141218;
      --gv-bg-args:      #1a1030;
      --gv-bg-dep:       #2d1a00;
      --gv-text:         #e6e0e9;
      --gv-text-2:       #cac4d0;
      --gv-text-muted:   #938f99;
      --gv-text-type:    #d0bcff;
      --gv-text-dep:     #ffb74d;
      --gv-border:       #49454e;
      --gv-badge-bg:     #2d1b50;
      --gv-badge-text:   #d0bcff;
      --gv-shadow:       0 1px 4px rgba(0,0,0,.4), 0 0 1px rgba(0,0,0,.3);
    }

    /* ── Toolbar ─────────────────────────────────────────────────────── */
    .gv-toolbar {
      display: flex; align-items: center; gap: 8px; flex-shrink: 0;
      padding: 9px 16px;
      background: var(--gv-bg-card);
      border-bottom: 1px solid var(--gv-border);
    }
    .gv-brand-badge {
      padding: 3px 10px; border-radius: 12px;
      background: var(--gv-badge-bg); color: var(--gv-badge-text);
      font-size: 11px; font-weight: 700; letter-spacing: .5px;
    }
    .gv-pill {
      display: inline-flex; align-items: center; gap: 3px;
      padding: 2px 8px 2px 4px; border-radius: 12px;
      font-size: 11px; font-weight: 600; cursor: default;
    }
    .gv-pill mat-icon { font-size: 13px; width: 13px; height: 13px; }
    .gv-pill--q { background: #e3f2fd; color: #1565c0; }
    .gv-pill--m { background: #e8f5e9; color: #2e7d32; }
    .gv-pill--s { background: #fff3e0; color: #e65100; }
    .gv-pill--t { background: var(--gv-badge-bg); color: var(--gv-badge-text); }
    app-graphql-viewer.gv-dark .gv-pill--q { background: #0d1a2d; color: #90caf9; }
    app-graphql-viewer.gv-dark .gv-pill--m { background: #0d1f0d; color: #81c784; }
    app-graphql-viewer.gv-dark .gv-pill--s { background: #2d1a00; color: #ffb74d; }

    /* ── Error ───────────────────────────────────────────────────────── */
    .gv-error {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; height: 100%; gap: 12px;
      color: var(--gv-text-muted); font-size: 14px;
    }
    .gv-error mat-icon { font-size: 48px; width: 48px; height: 48px; }

    /* ── Body ────────────────────────────────────────────────────────── */
    .gv-body {
      flex: 1; overflow-y: auto; padding: 16px;
      display: flex; flex-direction: column; gap: 16px;
    }

    /* ── Filter ──────────────────────────────────────────────────────── */
    .gv-filter {
      display: flex; align-items: center; gap: 6px;
      background: var(--gv-bg-card); border: 1px solid var(--gv-border);
      border-radius: 8px; padding: 6px 12px;
    }
    .gv-filter mat-icon { font-size: 16px; width: 16px; height: 16px; color: var(--gv-text-muted); }
    .gv-filter__input {
      flex: 1; background: transparent; border: none; outline: none;
      color: var(--gv-text); font-size: 13px; font-family: inherit;
    }
    .gv-filter__input::placeholder { color: var(--gv-text-muted); }
    .gv-filter__clear {
      --mdc-icon-button-state-layer-size: 24px !important;
      width: 24px !important; height: 24px !important;
    }
    .gv-filter__clear mat-icon { font-size: 14px !important; }

    /* ── Section ─────────────────────────────────────────────────────── */
    .gv-section { display: flex; flex-direction: column; gap: 0; }
    .gv-section-hd {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 14px;
      background: var(--gv-bg-card); border: 1px solid var(--gv-border);
      border-bottom: none; border-radius: 10px 10px 0 0;
      font-size: 11px; font-weight: 700; letter-spacing: .4px;
      text-transform: uppercase; color: var(--gv-text-2);
    }
    .gv-section-hd mat-icon {
      font-size: 15px; width: 15px; height: 15px; color: var(--gv-badge-text);
    }

    /* ── Accordion ───────────────────────────────────────────────────── */
    .gv-accordion {
      border: 1px solid var(--gv-border);
      border-radius: 0 0 10px 10px;
      overflow: hidden;
    }
    .gv-accordion .mat-expansion-panel {
      background: var(--gv-bg-panel);
      border-radius: 0 !important; border-bottom: 1px solid var(--gv-border);
      box-shadow: none !important; margin: 0 !important;
    }
    .gv-accordion .mat-expansion-panel:last-child { border-bottom: none; }
    .gv-accordion .mat-expansion-panel-header { background: var(--gv-bg-panel-hdr) !important; }
    .gv-accordion .mat-expansion-panel-header:hover {
      background: color-mix(in srgb, var(--gv-badge-bg) 20%, var(--gv-bg-panel-hdr)) !important;
    }
    .gv-accordion .mat-expanded .mat-expansion-panel-header {
      background: var(--gv-bg-panel) !important;
      border-bottom: 1px solid var(--gv-border);
    }
    .gv-accordion .mat-expansion-panel-body { padding: 0 !important; }

    /* ── Panel header ────────────────────────────────────────────────── */
    .gv-panel__hdr { height: 44px !important; }
    .gv-panel__title {
      display: flex; align-items: center; gap: 8px;
      font-size: 13px; font-weight: 600; color: var(--gv-text);
      flex: 1; overflow: hidden;
    }
    .gv-panel__desc {
      display: flex; align-items: center; gap: 6px; flex-shrink: 0;
    }
    .gv-chevron {
      font-size: 18px !important; width: 18px !important; height: 18px !important;
      color: var(--gv-text-muted); flex-shrink: 0;
      transition: transform 200ms ease;
    }
    .mat-expanded .gv-chevron { transform: rotate(180deg); }

    /* ── Operation kind badges ───────────────────────────────────────── */
    .gv-kind {
      flex-shrink: 0; padding: 2px 6px; border-radius: 4px;
      font-size: 9px; font-weight: 800; letter-spacing: .6px; text-transform: uppercase;
    }
    .gv-kind--query        { background: #e3f2fd; color: #1565c0; }
    .gv-kind--mutation     { background: #e8f5e9; color: #2e7d32; }
    .gv-kind--subscription { background: #fff3e0; color: #e65100; }
    app-graphql-viewer.gv-dark .gv-kind--query        { background: #0d1a2d; color: #90caf9; }
    app-graphql-viewer.gv-dark .gv-kind--mutation     { background: #0d1f0d; color: #81c784; }
    app-graphql-viewer.gv-dark .gv-kind--subscription { background: #2d1a00; color: #ffb74d; }

    .gv-field-name { font-family: var(--gv-mono); font-size: 13px; }
    .gv-type-name  { font-family: var(--gv-mono); font-size: 13px; }
    .gv-return-type {
      font-family: var(--gv-mono); font-size: 11px; color: var(--gv-text-type);
    }
    .gv-args-badge {
      font-size: 11px; color: var(--gv-text-muted); font-family: var(--gv-mono);
    }
    .gv-implements mat-icon {
      font-size: 14px; width: 14px; height: 14px; color: var(--gv-text-muted);
    }

    /* ── Deprecated ──────────────────────────────────────────────────── */
    .gv-deprecated-icon {
      font-size: 14px !important; width: 14px !important; height: 14px !important;
      color: var(--gv-text-dep);
    }
    .gv-deprecated-banner {
      display: flex; align-items: center; gap: 8px;
      padding: 7px 12px; margin-bottom: 8px;
      background: var(--gv-bg-dep); color: var(--gv-text-dep);
      border-radius: 6px; font-size: 12px;
    }
    .gv-deprecated-banner mat-icon { font-size: 15px; width: 15px; height: 15px; }

    /* ── Panel body ──────────────────────────────────────────────────── */
    .gv-panel__body {
      padding: 12px 16px; display: flex; flex-direction: column; gap: 10px;
    }
    .gv-doc {
      margin: 0; font-size: 12px; color: var(--gv-text-2); line-height: 1.6;
      padding: 6px 10px;
      background: var(--gv-bg);
      border-left: 3px solid var(--gv-border);
      border-radius: 0 4px 4px 0;
    }
    .gv-doc--compact { margin: 8px 16px; }

    /* ── Args (in operation expanded panel) ──────────────────────────── */
    .gv-args {
      background: var(--gv-bg-args); border: 1px solid var(--gv-border);
      border-radius: 6px; overflow: hidden;
    }
    .gv-args__hd {
      padding: 5px 12px; font-size: 10px; font-weight: 700;
      text-transform: uppercase; letter-spacing: .4px;
      color: var(--gv-badge-text); background: color-mix(in srgb, var(--gv-badge-bg) 50%, var(--gv-bg-args));
      border-bottom: 1px solid var(--gv-border);
    }
    .gv-arg {
      display: flex; align-items: center; gap: 5px;
      padding: 5px 12px; border-bottom: 1px solid var(--gv-border);
      font-size: 12px;
    }
    .gv-arg:last-child { border-bottom: none; }
    .gv-arg__name    { font-family: var(--gv-mono); color: var(--gv-text); font-weight: 500; }
    .gv-arg__sep     { color: var(--gv-text-muted); }
    .gv-arg__type    { font-family: var(--gv-mono); color: var(--gv-text-type); }
    .gv-arg__default { font-family: var(--gv-mono); color: var(--gv-text-muted); font-size: 11px; }
    .gv-arg__info {
      font-size: 13px !important; width: 13px !important; height: 13px !important;
      color: var(--gv-text-muted); margin-left: auto;
    }

    /* ── Fields list (types / interfaces / inputs) ────────────────────── */
    .gv-fields { display: flex; flex-direction: column; }
    .gv-implements-row {
      display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
      padding: 6px 12px; border-bottom: 1px solid var(--gv-border);
      font-size: 11px;
    }
    .gv-implements-lbl {
      font-size: 10px; font-weight: 600; text-transform: uppercase;
      letter-spacing: .4px; color: var(--gv-text-muted);
    }
    .gv-iface-tag {
      padding: 1px 6px; border-radius: 4px; font-family: var(--gv-mono);
      background: var(--gv-badge-bg); color: var(--gv-badge-text);
      font-size: 11px; font-weight: 500;
    }
    .gv-field {
      display: flex; align-items: center; gap: 5px;
      padding: 5px 12px; border-bottom: 1px solid var(--gv-border);
      min-height: 30px; font-size: 12px;
    }
    .gv-field:nth-child(odd)  { background: var(--gv-bg-field-odd); }
    .gv-field:nth-child(even) { background: var(--gv-bg-field-ev); }
    .gv-field:last-child { border-bottom: none; }
    .gv-field--deprecated { opacity: .65; }
    .gv-field__name {
      font-family: var(--gv-mono); font-weight: 500; color: var(--gv-text);
      white-space: nowrap;
    }
    .gv-field__args {
      font-family: var(--gv-mono); font-size: 11px; color: var(--gv-text-muted);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 240px;
    }
    .gv-field__sep  { color: var(--gv-text-muted); }
    .gv-field__type {
      font-family: var(--gv-mono); color: var(--gv-text-type);
      white-space: nowrap;
    }
    .gv-field__info {
      font-size: 13px !important; width: 13px !important; height: 13px !important;
      color: var(--gv-text-muted); margin-left: auto; flex-shrink: 0;
    }

    /* ── Enum values ─────────────────────────────────────────────────── */
    .gv-enum-values { display: flex; flex-direction: column; }
    .gv-enum-val {
      display: flex; align-items: center; gap: 8px;
      padding: 5px 12px; border-bottom: 1px solid var(--gv-border);
      font-size: 12px;
    }
    .gv-enum-val:last-child { border-bottom: none; }
    .gv-enum-val--deprecated { opacity: .6; }
    .gv-enum-val__name { font-family: var(--gv-mono); font-weight: 500; letter-spacing: .3px; }

    /* ── Scalars ─────────────────────────────────────────────────────── */
    .gv-scalars {
      display: flex; flex-wrap: wrap; gap: 8px;
      padding: 12px; background: var(--gv-bg-card);
      border: 1px solid var(--gv-border); border-top: none;
      border-radius: 0 0 10px 10px;
    }
    .gv-scalar-chip {
      padding: 3px 10px; border-radius: 12px;
      background: var(--gv-badge-bg); color: var(--gv-badge-text);
      font-family: var(--gv-mono); font-size: 12px; font-weight: 500;
    }

    /* ── Unions ──────────────────────────────────────────────────────── */
    .gv-unions {
      display: flex; flex-direction: column;
      background: var(--gv-bg-card);
      border: 1px solid var(--gv-border); border-top: none;
      border-radius: 0 0 10px 10px; overflow: hidden;
    }
    .gv-union {
      display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
      padding: 8px 14px; border-bottom: 1px solid var(--gv-border);
      font-size: 12px;
    }
    .gv-union:last-child { border-bottom: none; }
    .gv-union__name { font-family: var(--gv-mono); font-weight: 600; color: var(--gv-text); }
    .gv-union__eq   { color: var(--gv-text-muted); }
    .gv-union__member {
      padding: 1px 7px; border-radius: 4px;
      background: var(--gv-badge-bg); color: var(--gv-badge-text);
      font-family: var(--gv-mono); font-size: 11px; font-weight: 500;
    }
    .gv-union__pipe { color: var(--gv-text-muted); }

    /* ── Shared utilities ────────────────────────────────────────────── */
    .gv-count {
      display: inline-flex; align-items: center; justify-content: center;
      min-width: 20px; height: 18px; padding: 0 5px; border-radius: 9px;
      background: var(--gv-badge-bg); color: var(--gv-badge-text);
      font-size: 10px; font-weight: 700;
    }
    .gv-muted { color: var(--gv-text-muted); font-size: 12px; }
  `],
})
export class GraphqlViewerComponent {
  readonly sdlText = input.required<string>();
  readonly isDark  = input.required<boolean>();

  protected readonly filter = signal('');

  private readonly parsed = computed(() => {
    try { return parseGraphql(this.sdlText()); }
    catch { return null; }
  });

  protected readonly schema     = this.parsed;
  protected readonly parseError = computed(() => this.parsed() === null);

  protected readonly operations = computed<GqlOperation[]>(() => {
    const s = this.schema();
    if (!s) return [];
    const ops: GqlOperation[] = [];
    const qt = s.types.find(t => t.name === s.queryType);
    const mt = s.types.find(t => t.name === s.mutationType);
    const st = s.types.find(t => t.name === s.subscriptionType);
    qt?.fields.forEach(f => ops.push({ kind: 'QUERY',        field: f }));
    mt?.fields.forEach(f => ops.push({ kind: 'MUTATION',     field: f }));
    st?.fields.forEach(f => ops.push({ kind: 'SUBSCRIPTION', field: f }));
    return ops;
  });

  protected readonly objectTypes = computed(() => {
    const s = this.schema();
    if (!s) return [];
    const opNames = new Set([s.queryType, s.mutationType, s.subscriptionType]);
    return s.types.filter(t => !opNames.has(t.name) && !t.name.startsWith('__'));
  });

  protected readonly queryOpsCount        = computed(() => this.operations().filter(o => o.kind === 'QUERY').length);
  protected readonly mutationOpsCount     = computed(() => this.operations().filter(o => o.kind === 'MUTATION').length);
  protected readonly subscriptionOpsCount = computed(() => this.operations().filter(o => o.kind === 'SUBSCRIPTION').length);

  protected readonly customScalars = computed(() =>
    (this.schema()?.scalars ?? []).filter(s => !BUILT_IN_SCALARS.has(s))
  );

  protected readonly filteredOps = computed(() => {
    const f = this.filter().toLowerCase().trim();
    return f
      ? this.operations().filter(op => op.field.name.toLowerCase().includes(f))
      : this.operations();
  });

  protected readonly filteredTypes = computed(() => {
    const f = this.filter().toLowerCase().trim();
    if (!f) return this.objectTypes();
    return this.objectTypes().filter(t =>
      t.name.toLowerCase().includes(f) ||
      t.fields.some(fld => fld.name.toLowerCase().includes(f))
    );
  });

  protected readonly filteredInterfaces = computed(() => {
    const f = this.filter().toLowerCase().trim();
    const items = (this.schema()?.interfaces ?? []).filter(t => !t.name.startsWith('__'));
    return f ? items.filter(t => t.name.toLowerCase().includes(f)) : items;
  });

  protected readonly filteredInputs = computed(() => {
    const f = this.filter().toLowerCase().trim();
    const items = this.schema()?.inputs ?? [];
    return f ? items.filter(t => t.name.toLowerCase().includes(f)) : items;
  });

  protected readonly filteredEnums = computed(() => {
    const f = this.filter().toLowerCase().trim();
    const items = (this.schema()?.enums ?? []).filter(e => !e.name.startsWith('__'));
    return f ? items.filter(e =>
      e.name.toLowerCase().includes(f) ||
      e.values.some(v => v.name.toLowerCase().includes(f))
    ) : items;
  });

  protected readonly filteredUnions = computed(() => {
    const f = this.filter().toLowerCase().trim();
    const items = this.schema()?.unions ?? [];
    return f ? items.filter(u => u.name.toLowerCase().includes(f)) : items;
  });

  constructor(private readonly host: ElementRef<HTMLElement>) {
    effect(() => {
      host.nativeElement.classList.toggle('gv-dark', this.isDark());
    });
  }
}
