import { ChangeDetectionStrategy, Component, effect, input, output, signal, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import { FlightInfoSheetComponent } from '../flight-info-sheet/flight-info-sheet.component';
import { CommonModule } from '@angular/common';
import { BarogramComponent } from "../barogram/barogram.component";
import { Flight } from '../../models/flight.model';
import { Subscription, timer } from 'rxjs';
import { getTimeAgoString } from '../../utils/time.utils';
import { register } from 'swiper/element/bundle';
import { OgnStore } from '../../store/ogn.store';

// Register web components for swiper
register();

@Component({
  selector: 'app-detail-view-mobile',
  imports: [CommonModule, FlightInfoSheetComponent, BarogramComponent],
  templateUrl: './detail-view-mobile.component.html',
  styleUrl: './detail-view-mobile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class DetailViewMobileComponent {
  private readonly store = inject(OgnStore);

  flight = input<Flight>()
  close = output<void>();
  activePage = signal(0);
  totalPages = 2;
  timeAgo = signal('');
  copied = signal(false);
  historicFlightTarget = this.store.historicFlightTarget;
  private timerSub: Subscription | null = null;
  private readonly copyTooltipShowTime = 1200;

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

  copyFlightLink(): void {
    const flarmId = this.flight()?.flarmId;
    if (!flarmId) return;
    const url = `${location.origin}/map?flarmId=${flarmId}`;
    navigator.clipboard.writeText(url);
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), this.copyTooltipShowTime);
  }

  onSwipeLeft() {
    if (this.activePage() < this.totalPages - 1) {
      this.activePage.update(i => i + 1);
    }
  }

  onSwipeRight() {
    if (this.activePage() > 0) {
      this.activePage.update(i => i - 1);
    }
  }

  getTimeAgoString = getTimeAgoString
}
