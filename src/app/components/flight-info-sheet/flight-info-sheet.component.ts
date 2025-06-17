import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  Input,
  output,
  signal,
} from '@angular/core';
import { Flight } from '../../models/flight.model';
import { NgClass, NgIf } from '@angular/common';
import { Subscription, timer } from 'rxjs';
import { getTimeAgoString } from '../../utils/time.utils';

@Component({
  selector: 'app-flight-info-sheet',
  imports: [NgClass, NgIf],
  templateUrl: './flight-info-sheet.component.html',
  styleUrl: './flight-info-sheet.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlightInfoSheetComponent {
  flight = input<Flight>();
  close = output<void>();

  private readonly varioMedium = 1.2;
  private readonly varioHigh = 3;

  readonly isOpen = computed(() => this.flight());
  readonly varioIcon = computed(() => {
    if (!this.flight()) return;
    const vario = this.flight()?.vario as number;
    let base = vario >= 0 ? 'stat_' : 'stat_minus_';
    if (Math.abs(vario) >= this.varioHigh) return `${base}3`;
    else if (Math.abs(vario) >= this.varioMedium) return `${base}2`;
    else return `${base}1`;
  });
  readonly varioAverageIcon = computed(() => {
    if (!this.flight()) return;
    const vario = this.flight()?.varioAverage as number;
    let base = vario >= 0 ? 'stat_' : 'stat_minus_';
    if (Math.abs(vario) >= this.varioHigh) return `${base}3`;
    else if (Math.abs(vario) >= this.varioMedium) return `${base}2`;
    else return `${base}1`;
  });

  getAircraftTypeLabel(type: number): string {
    switch (type) {
      case 1:
        return 'Segelflugzeug';
      case 2:
        return 'Schleppflugzeug';
      case 3:
        return 'Motorflugzeug';
      case 4:
        return 'Paragleiter / Hängegleiter';
      case 5:
        return 'Hubschrauber';
      default:
        return 'Unbekannt';
    }
  }
}
