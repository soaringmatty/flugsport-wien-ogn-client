import { ChangeDetectionStrategy, Component, computed, effect, inject, input, Input, output, signal } from '@angular/core';
import { Flight } from '../../models/flight.model';
import { NgClass, NgIf } from '@angular/common';
import { Subscription, timer } from 'rxjs';

@Component({
  selector: 'app-flight-info-sheet',
  imports: [NgClass, NgIf],
  templateUrl: './flight-info-sheet.component.html',
  styleUrl: './flight-info-sheet.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FlightInfoSheetComponent {
  flight = input<Flight>()
  close = output<void>();
  timeAgo = signal('');

  private readonly varioMedium = 1.2;
  private readonly varioHigh = 3;

  private timerSub: Subscription | null = null;
  readonly isOpen = computed(() => this.flight());
  readonly varioIcon = computed(() => {
    if (!this.flight()) return;
    const vario = this.flight()?.vario as number;
    let base = vario >= 0 ? 'stat_' : 'stat_minus_';
    if (Math.abs(vario) >= this.varioHigh) 
      return `${base}3`;
    else if (Math.abs(vario) >= this.varioMedium) 
      return `${base}2`;
    else
      return `${base}1`;
  });
  readonly varioAverageIcon = computed(() => {
    if (!this.flight()) return;
    const vario = this.flight()?.varioAverage as number;
    let base = vario >= 0 ? 'stat_' : 'stat_minus_';
    if (Math.abs(vario) >= this.varioHigh) 
      return `${base}3`;
    else if (Math.abs(vario) >= this.varioMedium) 
      return `${base}2`;
    else
      return `${base}1`;
  });

  constructor() {
    // React to timestamp changes
    effect(() => {
      const timestamp = this.flight()?.timestamp;
      if (!timestamp) return;
      this.timerSub?.unsubscribe();

      if (!timestamp) {
        this.timeAgo.set('');
        return;
      }

      // Initial update
      this.timeAgo.set(this.getTimeAgoString(timestamp));

      // Start timer to update every second
      this.timerSub = timer(1000, 1000).subscribe(() => {
        this.timeAgo.set(this.getTimeAgoString(timestamp));
      });
    });
  }

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

  getTimeAgoString(timestamp: number): string {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    const intervals: { [key: string]: number } = {
      'Stunde': 3600,
      'Minute': 60,
      'Sekunde': 1,
    };
    for (const unit in intervals) {
      const counter = Math.floor(seconds / intervals[unit]);
      if (counter > 0) {
        const plural = counter === 1 ? '' : 'n';
        return `vor ${counter} ${unit}${plural}`;
      }
    }
    return 'gerade eben';
  }
}