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
import { parseWsdl, WsdlModel, WsdlOperation } from './wsdl-parser';

@Component({
  selector: 'app-wsdl-viewer',
  imports: [
    MatButtonModule,
    MatExpansionModule,
    MatIconModule,
    MatTooltipModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <!-- ── Toolbar ──────────────────────────────────────────────── -->
    @if (model()?.bindings?.length) {
      <div class="wv-toolbar">
        <span class="wv-proto-badge">{{ model()!.bindings[0].protocol }}</span>
      </div>
    }

    <!-- ── Graphical view ───────────────────────────────────────── -->
    @if (parseError()) {
      <div class="wv-error">
        <mat-icon>broken_image</mat-icon>
        <span>Could not parse WSDL document</span>
      </div>

    } @else if (model(); as m) {
      <div class="wv-body">

        <!-- ── Summary cards ────────────────────────────────────── -->
        <div class="wv-summary-grid">

          <!-- Service info -->
          <div class="wv-card">
            <div class="wv-card__hd">
              <mat-icon>settings_applications</mat-icon>
              <span>{{ m.name || 'WSDL Service' }}</span>
            </div>
            <div class="wv-card__bd">
              <div class="wv-prop">
                <span class="wv-prop__lbl">Target namespace</span>
                <span class="wv-prop__val wv-mono wv-truncate"
                      [title]="m.targetNamespace">{{ m.targetNamespace || '–' }}</span>
                @if (m.targetNamespace) {
                  <button mat-icon-button class="wv-copy"
                          matTooltip="Copy namespace"
                          (click)="copy(m.targetNamespace)">
                    <mat-icon>content_copy</mat-icon>
                  </button>
                }
              </div>
              <div class="wv-prop">
                <span class="wv-prop__lbl">WSDL version</span>
                <span class="wv-prop__val">{{ m.version }}</span>
              </div>
              @if (m.bindings.length) {
                <div class="wv-prop">
                  <span class="wv-prop__lbl">Binding style</span>
                  <span class="wv-prop__val wv-capitalize">{{ m.bindings[0].style }}</span>
                </div>
                @if (m.bindings[0].transport) {
                  <div class="wv-prop">
                    <span class="wv-prop__lbl">Transport</span>
                    <span class="wv-prop__val wv-mono wv-truncate"
                          [title]="m.bindings[0].transport">{{ m.bindings[0].transport }}</span>
                  </div>
                }
              }
              <div class="wv-prop">
                <span class="wv-prop__lbl">Operations</span>
                <span class="wv-prop__val">{{ totalOps() }}</span>
              </div>
            </div>
          </div>

          <!-- Endpoints -->
          @if (m.services.length && m.services[0].ports.length) {
            <div class="wv-card">
              <div class="wv-card__hd">
                <mat-icon>lan</mat-icon>
                <span>Endpoints</span>
                <span class="wv-count">{{ m.services[0].ports.length }}</span>
              </div>
              <div class="wv-card__bd">
                @for (port of m.services[0].ports; track port.name) {
                  <div class="wv-endpoint">
                    <div class="wv-endpoint__name">
                      <mat-icon class="wv-endpoint__icon">electrical_services</mat-icon>
                      {{ port.name }}
                    </div>
                    <div class="wv-endpoint__row">
                      <span class="wv-proto-tag wv-proto-tag--{{ port.protocol === 'SOAP 1.2' ? 'soap12' : 'soap11' }}">
                        {{ port.protocol }}
                      </span>
                      @if (port.address) {
                        <span class="wv-mono wv-truncate wv-endpoint__url"
                              [title]="port.address">{{ port.address }}</span>
                        <button mat-icon-button class="wv-copy"
                                matTooltip="Copy URL"
                                (click)="copy(port.address)">
                          <mat-icon>content_copy</mat-icon>
                        </button>
                      } @else {
                        <span class="wv-muted">No address defined</span>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>
          }
        </div>

        <!-- ── Operations ────────────────────────────────────────── -->
        @for (pt of m.portTypes; track pt.name; let ptIdx = $index) {
          <div class="wv-ops-section">

            <!-- Header with filter -->
            <div class="wv-ops-hd">
              <div class="wv-ops-title">
                <mat-icon>api</mat-icon>
                <span>Operations</span>
                <span class="wv-count">
                  {{ filteredOps(pt).length }}
                  @if (filteredOps(pt).length !== pt.operations.length) {
                    &nbsp;/ {{ pt.operations.length }}
                  }
                </span>
                @if (m.portTypes.length > 1) {
                  <span class="wv-pt-name">{{ pt.name }}</span>
                }
              </div>
              <div class="wv-filter">
                <mat-icon>search</mat-icon>
                <input class="wv-filter__input"
                       placeholder="Filter operations…"
                       [value]="filter()"
                       (input)="filter.set($any($event.target).value)" />
                @if (filter()) {
                  <button mat-icon-button class="wv-filter__clear" (click)="filter.set('')">
                    <mat-icon>close</mat-icon>
                  </button>
                }
              </div>
            </div>

            <!-- Accordion -->
            <mat-accordion class="wv-accordion" multi="false">
              @for (op of filteredOps(pt); track op.name) {
                <mat-expansion-panel class="wv-op" hideToggle>
                  <mat-expansion-panel-header class="wv-op__hdr">
                    <mat-panel-title class="wv-op__title">
                      <mat-icon class="wv-op__icon">flash_on</mat-icon>
                      <span class="wv-op__name">{{ op.name }}</span>
                      @if (op.faults.length) {
                        <span class="wv-fault-badge" matTooltip="{{ op.faults.length }} fault(s)">
                          <mat-icon>warning_amber</mat-icon>{{ op.faults.length }}
                        </span>
                      }
                    </mat-panel-title>
                    <mat-panel-description class="wv-op__desc">
                      @if (op.soapAction) {
                        <span class="wv-mono wv-op__action">{{ op.soapAction }}</span>
                      }
                      <mat-icon class="wv-op__chevron">expand_more</mat-icon>
                    </mat-panel-description>
                  </mat-expansion-panel-header>

                  <!-- ── Expanded body ──────────────────────────── -->
                  <div class="wv-op__body">
                    <!-- Meta row -->
                    <div class="wv-meta-row">
                      @if (op.soapAction) {
                        <div class="wv-meta">
                          <span class="wv-meta__lbl">SOAP Action</span>
                          <span class="wv-mono wv-meta__val">{{ op.soapAction }}</span>
                          <button mat-icon-button class="wv-copy" matTooltip="Copy"
                                  (click)="copy(op.soapAction)">
                            <mat-icon>content_copy</mat-icon>
                          </button>
                        </div>
                      }
                      @if (op.style) {
                        <div class="wv-meta">
                          <span class="wv-meta__lbl">Style</span>
                          <span class="wv-meta__val wv-capitalize">{{ op.style }}</span>
                        </div>
                      }
                    </div>

                    @if (op.documentation) {
                      <p class="wv-op__doc">{{ op.documentation }}</p>
                    }

                    <!-- Input / Output -->
                    <div class="wv-io-grid">
                      @if (op.input) {
                        <div class="wv-io wv-io--in">
                          <div class="wv-io__hd">
                            <mat-icon>input</mat-icon>
                            <span>Request</span>
                            <span class="wv-io__msg">{{ op.input.messageName }}</span>
                          </div>
                          <div class="wv-io__bd">
                            @let parts = op.input.parts;
                            @if (parts.length) {
                              @for (part of parts; track part.name) {
                                @if (part.fields.length) {
                                  @for (f of part.fields; track f.name) {
                                    <div class="wv-field">
                                      <span class="wv-field__name">{{ f.name }}</span>
                                      <span class="wv-field__type">{{ f.type }}</span>
                                      <span class="wv-field__flags">
                                        @if (f.minOccurs !== '0') { <span class="wv-req" matTooltip="Required">*</span> }
                                        @if (f.maxOccurs === 'unbounded') { <span class="wv-arr" matTooltip="Array">[]</span> }
                                        @if (f.nillable) { <span class="wv-nil" matTooltip="Nillable">?</span> }
                                      </span>
                                    </div>
                                  }
                                } @else {
                                  <div class="wv-field wv-field--ref">
                                    <mat-icon>data_object</mat-icon>
                                    <span>{{ part.ref || part.name }}</span>
                                  </div>
                                }
                              }
                            } @else {
                              <div class="wv-io__empty">No parameters</div>
                            }
                          </div>
                        </div>
                      }

                      <div class="wv-io-arrow">
                        <mat-icon>arrow_forward</mat-icon>
                      </div>

                      @if (op.output) {
                        <div class="wv-io wv-io--out">
                          <div class="wv-io__hd">
                            <mat-icon>output</mat-icon>
                            <span>Response</span>
                            <span class="wv-io__msg">{{ op.output.messageName }}</span>
                          </div>
                          <div class="wv-io__bd">
                            @let parts = op.output.parts;
                            @if (parts.length) {
                              @for (part of parts; track part.name) {
                                @if (part.fields.length) {
                                  @for (f of part.fields; track f.name) {
                                    <div class="wv-field">
                                      <span class="wv-field__name">{{ f.name }}</span>
                                      <span class="wv-field__type">{{ f.type }}</span>
                                      <span class="wv-field__flags">
                                        @if (f.minOccurs !== '0') { <span class="wv-req">*</span> }
                                        @if (f.maxOccurs === 'unbounded') { <span class="wv-arr">[]</span> }
                                        @if (f.nillable) { <span class="wv-nil">?</span> }
                                      </span>
                                    </div>
                                  }
                                } @else {
                                  <div class="wv-field wv-field--ref">
                                    <mat-icon>data_object</mat-icon>
                                    <span>{{ part.ref || part.name }}</span>
                                  </div>
                                }
                              }
                            } @else {
                              <div class="wv-io__empty">No parameters</div>
                            }
                          </div>
                        </div>
                      }
                    </div>

                    <!-- Faults -->
                    @if (op.faults.length) {
                      <div class="wv-faults">
                        <mat-icon>warning_amber</mat-icon>
                        <span class="wv-faults__lbl">Faults</span>
                        @for (f of op.faults; track f.name) {
                          <span class="wv-fault-tag">{{ f.name }}</span>
                        }
                      </div>
                    }
                  </div>
                </mat-expansion-panel>
              }

              @if (filter() && filteredOps(pt).length === 0) {
                <div class="wv-no-results">
                  <mat-icon>search_off</mat-icon>
                  No operations match "{{ filter() }}"
                </div>
              }
            </mat-accordion>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    /* ── Host & layout ─────────────────────────────────────────────────── */
    app-wsdl-viewer {
      display: flex; flex-direction: column; height: 100%; overflow: hidden;
      --wv-bg:           #f4f3f7;
      --wv-bg-card:      #ffffff;
      --wv-bg-op:        #ffffff;
      --wv-bg-op-hdr:    #f8f7fc;
      --wv-bg-in-hd:     #e3f0fb;
      --wv-bg-out-hd:    #e6f4ea;
      --wv-bg-field-odd: #fafafa;
      --wv-bg-field-ev:  #ffffff;
      --wv-text:         #1c1b1f;
      --wv-text-2:       #49454e;
      --wv-text-muted:   #79747e;
      --wv-text-type:    #5b4397;
      --wv-text-in:      #1565c0;
      --wv-text-out:     #2e7d32;
      --wv-text-req:     #b71c1c;
      --wv-text-arr:     #0277bd;
      --wv-text-nil:     #6a1b9a;
      --wv-border:       #e0dde7;
      --wv-border-in:    #90caf9;
      --wv-border-out:   #a5d6a7;
      --wv-badge-bg:     #ede7f6;
      --wv-badge-text:   #512da8;
      --wv-shadow:       0 1px 4px rgba(0,0,0,.10), 0 0 1px rgba(0,0,0,.06);
      --wv-mono:         'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;
      background: var(--wv-bg);
      color: var(--wv-text);
      font-family: Inter, system-ui, sans-serif;
      font-size: 13px;
    }

    /* Dark host */
    app-wsdl-viewer.wv-dark {
      --wv-bg:           #141218;
      --wv-bg-card:      #1d1b20;
      --wv-bg-op:        #1d1b20;
      --wv-bg-op-hdr:    #252230;
      --wv-bg-in-hd:     #0d1a2d;
      --wv-bg-out-hd:    #0d1f0d;
      --wv-bg-field-odd: #1d1b20;
      --wv-bg-field-ev:  #141218;
      --wv-text:         #e6e0e9;
      --wv-text-2:       #cac4d0;
      --wv-text-muted:   #938f99;
      --wv-text-type:    #d0bcff;
      --wv-text-in:      #90caf9;
      --wv-text-out:     #81c784;
      --wv-text-req:     #ef9a9a;
      --wv-text-arr:     #80d8ff;
      --wv-text-nil:     #ce93d8;
      --wv-border:       #49454e;
      --wv-border-in:    #1565c0;
      --wv-border-out:   #2e7d32;
      --wv-badge-bg:     #311b92;
      --wv-badge-text:   #d0bcff;
      --wv-shadow:       0 1px 4px rgba(0,0,0,.4), 0 0 1px rgba(0,0,0,.3);
    }

    /* ── Toolbar ────────────────────────────────────────────────────────── */
    .wv-toolbar {
      display: flex; align-items: center; gap: 12px; flex-shrink: 0;
      padding: 10px 16px;
      background: var(--wv-bg-card);
      border-bottom: 1px solid var(--wv-border);
      z-index: 1;
    }
    .wv-proto-badge {
      padding: 3px 10px; border-radius: 12px;
      background: var(--wv-badge-bg); color: var(--wv-badge-text);
      font-size: 11px; font-weight: 600; letter-spacing: .5px; text-transform: uppercase;
    }

    /* ── Error state ────────────────────────────────────────────────────── */
    .wv-error {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      height: 100%; gap: 12px; color: var(--wv-text-muted); font-size: 14px;
    }
    .wv-error mat-icon { font-size: 48px; width: 48px; height: 48px; }

    /* ── Scrollable body ────────────────────────────────────────────────── */
    .wv-body { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 16px; }

    /* ── Summary cards ──────────────────────────────────────────────────── */
    .wv-summary-grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
    }
    @media (max-width: 700px) { .wv-summary-grid { grid-template-columns: 1fr; } }

    .wv-card {
      background: var(--wv-bg-card);
      border: 1px solid var(--wv-border);
      border-radius: 10px;
      box-shadow: var(--wv-shadow);
      overflow: hidden;
    }
    .wv-card__hd {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 14px;
      background: color-mix(in srgb, var(--wv-badge-bg) 40%, var(--wv-bg-card));
      border-bottom: 1px solid var(--wv-border);
      font-size: 12px; font-weight: 600; color: var(--wv-text-2);
      letter-spacing: .3px; text-transform: uppercase;
    }
    .wv-card__hd mat-icon { font-size: 15px; width: 15px; height: 15px; color: var(--wv-badge-text); }
    .wv-card__bd { padding: 10px 14px; display: flex; flex-direction: column; gap: 8px; }

    .wv-count {
      display: inline-flex; align-items: center; justify-content: center;
      min-width: 20px; height: 18px; padding: 0 5px; border-radius: 9px;
      background: var(--wv-badge-bg); color: var(--wv-badge-text);
      font-size: 10px; font-weight: 700;
    }

    /* ── Property rows ──────────────────────────────────────────────────── */
    .wv-prop {
      display: flex; align-items: center; gap: 8px; min-height: 22px;
    }
    .wv-prop__lbl {
      flex-shrink: 0; min-width: 120px;
      font-size: 11px; font-weight: 500; color: var(--wv-text-muted);
      text-transform: uppercase; letter-spacing: .4px;
    }
    .wv-prop__val {
      flex: 1; color: var(--wv-text); font-size: 12px;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }

    /* ── Endpoints ──────────────────────────────────────────────────────── */
    .wv-endpoint { display: flex; flex-direction: column; gap: 4px; padding: 6px 0; border-bottom: 1px solid var(--wv-border); }
    .wv-endpoint:last-child { border-bottom: none; }
    .wv-endpoint__name {
      display: flex; align-items: center; gap: 4px;
      font-size: 12px; font-weight: 600; color: var(--wv-text);
    }
    .wv-endpoint__icon { font-size: 13px; width: 13px; height: 13px; color: var(--wv-text-muted); }
    .wv-endpoint__row {
      display: flex; align-items: center; gap: 6px; padding-left: 17px;
    }
    .wv-endpoint__url {
      flex: 1; font-size: 11px; color: var(--wv-text-2); min-width: 0;
    }
    .wv-proto-tag {
      flex-shrink: 0; padding: 1px 6px; border-radius: 4px;
      font-size: 10px; font-weight: 700; letter-spacing: .3px;
    }
    .wv-proto-tag--soap11 { background: #e3f2fd; color: #1565c0; }
    .wv-proto-tag--soap12 { background: #e8eaf6; color: #3949ab; }
    app-wsdl-viewer.wv-dark .wv-proto-tag--soap11 { background: #0d1a2d; color: #90caf9; }
    app-wsdl-viewer.wv-dark .wv-proto-tag--soap12 { background: #1a1548; color: #c5cae9; }

    /* ── Operations section ─────────────────────────────────────────────── */
    .wv-ops-section { display: flex; flex-direction: column; gap: 0; }
    .wv-ops-hd {
      display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
      padding: 10px 14px;
      background: var(--wv-bg-card);
      border: 1px solid var(--wv-border);
      border-bottom: none;
      border-radius: 10px 10px 0 0;
    }
    .wv-ops-title {
      display: flex; align-items: center; gap: 8px;
      font-size: 12px; font-weight: 600; color: var(--wv-text-2);
      text-transform: uppercase; letter-spacing: .3px;
    }
    .wv-ops-title mat-icon { font-size: 15px; width: 15px; height: 15px; color: var(--wv-badge-text); }
    .wv-pt-name {
      padding: 1px 7px; border-radius: 4px;
      background: var(--wv-badge-bg); color: var(--wv-badge-text);
      font-size: 10px; font-weight: 600;
    }
    .wv-filter {
      margin-left: auto; display: flex; align-items: center; gap: 4px;
      background: var(--wv-bg); border: 1px solid var(--wv-border);
      border-radius: 6px; padding: 2px 8px;
    }
    .wv-filter mat-icon { font-size: 15px; width: 15px; height: 15px; color: var(--wv-text-muted); }
    .wv-filter__input {
      background: transparent; border: none; outline: none;
      color: var(--wv-text); font-size: 12px; font-family: inherit;
      width: 160px;
    }
    .wv-filter__input::placeholder { color: var(--wv-text-muted); }
    .wv-filter__clear { --mdc-icon-button-state-layer-size: 24px !important; width: 24px; height: 24px; }
    .wv-filter__clear mat-icon { font-size: 14px; }

    /* ── Accordion ──────────────────────────────────────────────────────── */
    .wv-accordion {
      border: 1px solid var(--wv-border);
      border-radius: 0 0 10px 10px;
      overflow: hidden;
    }
    .wv-accordion .mat-expansion-panel {
      background: var(--wv-bg-op);
      border-radius: 0 !important;
      border-bottom: 1px solid var(--wv-border);
      box-shadow: none !important;
      margin: 0 !important;
    }
    .wv-accordion .mat-expansion-panel:last-child { border-bottom: none; }
    .wv-accordion .mat-expansion-panel-header { background: var(--wv-bg-op-hdr) !important; }
    .wv-accordion .mat-expansion-panel-header:hover { background: color-mix(in srgb, var(--wv-badge-bg) 20%, var(--wv-bg-op-hdr)) !important; }
    .wv-accordion .mat-expansion-panel.mat-expanded .mat-expansion-panel-header { background: var(--wv-bg-op) !important; border-bottom: 1px solid var(--wv-border); }
    .wv-accordion .mat-expansion-panel-body { padding: 0 !important; }

    /* ── Operation header ───────────────────────────────────────────────── */
    .wv-op__hdr { height: 44px !important; }
    .wv-op__title {
      display: flex; align-items: center; gap: 8px;
      font-size: 13px; font-weight: 600; color: var(--wv-text); flex: 1;
    }
    .wv-op__icon {
      font-size: 16px !important; width: 16px !important; height: 16px !important;
      color: var(--wv-badge-text);
    }
    .wv-op__name { font-family: var(--wv-mono); }
    .wv-op__desc {
      display: flex; align-items: center; gap: 8px;
      flex: 1; overflow: hidden;
    }
    .wv-op__action {
      font-size: 11px; color: var(--wv-text-muted);
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .wv-op__chevron {
      font-size: 18px !important; width: 18px !important; height: 18px !important;
      color: var(--wv-text-muted); margin-left: auto; flex-shrink: 0;
      transition: transform 200ms ease;
    }
    .mat-expanded .wv-op__chevron { transform: rotate(180deg); }

    .wv-fault-badge {
      display: inline-flex; align-items: center; gap: 2px;
      padding: 1px 5px; border-radius: 10px;
      background: #fff3e0; color: #e65100;
      font-size: 10px; font-weight: 700;
    }
    .wv-fault-badge mat-icon { font-size: 11px; width: 11px; height: 11px; }
    app-wsdl-viewer.wv-dark .wv-fault-badge { background: #2d1a00; color: #ffb74d; }

    /* ── Operation body ─────────────────────────────────────────────────── */
    .wv-op__body { padding: 12px 16px; display: flex; flex-direction: column; gap: 12px; }

    .wv-meta-row { display: flex; flex-wrap: wrap; gap: 12px 24px; }
    .wv-meta { display: flex; align-items: center; gap: 6px; }
    .wv-meta__lbl {
      font-size: 10px; font-weight: 600; text-transform: uppercase;
      letter-spacing: .4px; color: var(--wv-text-muted);
    }
    .wv-meta__val { font-size: 12px; color: var(--wv-text-2); }

    .wv-op__doc {
      margin: 0; font-size: 12px; color: var(--wv-text-2); font-style: italic;
      padding: 6px 10px; background: var(--wv-bg);
      border-left: 3px solid var(--wv-border); border-radius: 0 4px 4px 0;
    }

    /* ── I/O grid ───────────────────────────────────────────────────────── */
    .wv-io-grid {
      display: grid; grid-template-columns: 1fr 32px 1fr; gap: 8px; align-items: start;
    }
    .wv-io-arrow {
      display: flex; align-items: flex-start; justify-content: center;
      padding-top: 36px; color: var(--wv-text-muted);
    }
    .wv-io-arrow mat-icon { font-size: 18px; }

    .wv-io {
      border: 1px solid var(--wv-border);
      border-radius: 8px; overflow: hidden;
    }
    .wv-io__hd {
      display: flex; align-items: center; gap: 6px;
      padding: 7px 10px;
      font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .4px;
    }
    .wv-io__hd mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .wv-io--in  .wv-io__hd { background: var(--wv-bg-in-hd);  color: var(--wv-text-in);  border-bottom: 1px solid var(--wv-border-in); }
    .wv-io--out .wv-io__hd { background: var(--wv-bg-out-hd); color: var(--wv-text-out); border-bottom: 1px solid var(--wv-border-out); }
    .wv-io__msg {
      margin-left: auto; font-size: 10px; font-weight: 500;
      opacity: .75; font-family: var(--wv-mono); text-transform: none; letter-spacing: 0;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .wv-io__bd { display: flex; flex-direction: column; }
    .wv-io__empty {
      padding: 10px 12px; font-size: 11px; color: var(--wv-text-muted); font-style: italic;
    }

    /* ── Fields ─────────────────────────────────────────────────────────── */
    .wv-field {
      display: flex; align-items: center; gap: 6px;
      padding: 5px 10px; border-bottom: 1px solid var(--wv-border);
      min-height: 28px;
    }
    .wv-field:nth-child(odd)  { background: var(--wv-bg-field-odd); }
    .wv-field:nth-child(even) { background: var(--wv-bg-field-ev); }
    .wv-field:last-child { border-bottom: none; }
    .wv-field--ref { color: var(--wv-text-2); font-size: 12px; }
    .wv-field--ref mat-icon { font-size: 14px; width: 14px; height: 14px; color: var(--wv-text-muted); }
    .wv-field__name {
      flex: 1; font-size: 12px; font-weight: 500;
      color: var(--wv-text); font-family: var(--wv-mono);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .wv-field__type {
      font-size: 11px; font-family: var(--wv-mono); color: var(--wv-text-type);
      white-space: nowrap;
    }
    .wv-field__flags { display: flex; gap: 3px; flex-shrink: 0; }
    .wv-req { font-size: 11px; font-weight: 700; color: var(--wv-text-req); }
    .wv-arr { font-size: 10px; font-weight: 700; color: var(--wv-text-arr); font-family: var(--wv-mono); }
    .wv-nil { font-size: 11px; color: var(--wv-text-nil); }

    /* ── Faults ─────────────────────────────────────────────────────────── */
    .wv-faults {
      display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
      padding: 6px 8px; border-radius: 6px;
      background: #fff3e0; color: #bf360c;
      font-size: 11px;
    }
    app-wsdl-viewer.wv-dark .wv-faults { background: #1a0e00; color: #ffb74d; }
    .wv-faults mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .wv-faults__lbl { font-weight: 600; font-size: 10px; text-transform: uppercase; letter-spacing: .4px; }
    .wv-fault-tag {
      padding: 1px 7px; border-radius: 4px;
      background: rgba(0,0,0,.08); font-size: 11px; font-family: var(--wv-mono);
    }
    app-wsdl-viewer.wv-dark .wv-fault-tag { background: rgba(255,255,255,.1); }

    /* ── No results ─────────────────────────────────────────────────────── */
    .wv-no-results {
      display: flex; align-items: center; justify-content: center; gap: 8px;
      padding: 24px; color: var(--wv-text-muted); font-size: 13px;
    }

    /* ── Utilities ──────────────────────────────────────────────────────── */
    .wv-mono    { font-family: var(--wv-mono); }
    .wv-truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .wv-muted   { color: var(--wv-text-muted); font-size: 12px; }
    .wv-capitalize { text-transform: capitalize; }
    .wv-copy {
      --mdc-icon-button-state-layer-size: 24px !important;
      width: 24px !important; height: 24px !important; flex-shrink: 0;
      color: var(--wv-text-muted) !important;
    }
    .wv-copy mat-icon { font-size: 14px !important; width: 14px !important; height: 14px !important; }
  `],
})
export class WsdlViewerComponent {
  readonly xmlText = input.required<string>();
  readonly isDark  = input.required<boolean>();

  protected readonly filter = signal('');

  private readonly parsed = computed<WsdlModel | null>(() => {
    try { return parseWsdl(this.xmlText()); }
    catch { return null; }
  });

  protected readonly model      = this.parsed;
  protected readonly parseError = computed(() => this.parsed() === null);

  protected readonly totalOps = computed(() =>
    this.model()?.portTypes.reduce((s, pt) => s + pt.operations.length, 0) ?? 0
  );

  constructor(private readonly host: ElementRef<HTMLElement>) {
    effect(() => {
      host.nativeElement.classList.toggle('wv-dark', this.isDark());
    });
  }

  protected filteredOps(pt: { operations: WsdlOperation[] }): WsdlOperation[] {
    const f = this.filter().toLowerCase().trim();
    return f
      ? pt.operations.filter(op => op.name.toLowerCase().includes(f))
      : pt.operations;
  }

  protected copy(text: string): void {
    navigator.clipboard.writeText(text).catch(() => {});
  }
}
