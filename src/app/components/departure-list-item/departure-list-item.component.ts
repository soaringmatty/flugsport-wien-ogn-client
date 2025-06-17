import { DatePipe, NgClass, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DepartureListItem } from '../../models/departure-list-item.model';
import { LaunchType } from '../../models/launch-type';

@Component({
  selector: 'app-departure-list-item',
  imports: [NgClass, DatePipe],
  templateUrl: './departure-list-item.component.html',
  styleUrl: './departure-list-item.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DepartureListItemComponent {
  flight = input<DepartureListItem>();

  formatTimestamp(timestamp?: number): string {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  getLaunchLabel(type?: LaunchType): string {
    switch (type) {
      case LaunchType.winch:
        return 'Winde';
      case LaunchType.aerotow:
        return 'F-Schlepp';
      case LaunchType.motorized:
        return 'Eigenstart';
      case LaunchType.unknown:
      default:
        return 'Unbekannt';
    }
  }

  getLaunchIcon(type?: LaunchType): string {
    switch (type) {
      case LaunchType.winch:
        return 'delivery_truck_bolt';
      case LaunchType.aerotow:
        return 'connecting_airports';
      case LaunchType.motorized:
        return 'travel';
      case LaunchType.unknown:
      default:
        return 'help_outline';
    }
  }

  getFlightDurationTime(departure?: string, landing?: string): string {
    if (!departure) return '';

    const departureTime = new Date(departure).getTime();
    const landingTime = landing ? new Date(landing).getTime() : Date.now();

    const diff = landingTime - departureTime;

    const totalMinutes = Math.floor(diff / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    const pad = (n: number) => n.toString().padStart(2, '0');

    return `${pad(hours)}:${pad(minutes)}`;
  }
}
