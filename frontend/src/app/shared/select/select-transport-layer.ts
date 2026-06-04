import { ChangeDetectionStrategy, Component, inject, input, OnInit, signal } from '@angular/core';
import { ControlContainer, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { TransportLayerService } from '../../transportlayer/service/transport-layer.service';
import { TransportLayerSummaryDto } from '../../transportlayer/model/transport-layer.model';

@Component({
  selector: 'atlas-select-transport-layer',
  templateUrl: './select-transport-layer.html',
  styleUrl: './select.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatSelectModule, MatIconModule],
  viewProviders: [{
    provide: ControlContainer,
    useFactory: () => inject(ControlContainer, { optional: true, skipSelf: true }),
  }],
})
export class AtlasSelectTransportLayer implements OnInit {
  private readonly service = inject(TransportLayerService);

  readonly label = input.required<string>();
  readonly controlName = input.required<string>();
  readonly nullOptionLabel = input('–');
  readonly subscriptSizing = input<'fixed' | 'dynamic'>('fixed');

  protected readonly transportLayers = signal<TransportLayerSummaryDto[]>([]);

  ngOnInit(): void {
    this.service.findAll({ active: true, size: 200, sort: 'name' })
      .subscribe(p => this.transportLayers.set(p.content));
  }
}
