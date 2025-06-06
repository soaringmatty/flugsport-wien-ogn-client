import { DatePipe, NgClass, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DepartureListItem } from '../../models/departure-list-item.model';

@Component({
    selector: 'app-departure-list-item',
    imports: [NgClass, DatePipe],
    templateUrl: './departure-list-item.component.html',
    styleUrl: './departure-list-item.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DepartureListItemComponent {
    flight = input<DepartureListItem>();



    formatTimestamp(timestamp?: number): string {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    getLaunchLabel(type?: string): string {
        switch (type) {
            case 'winch':
                return 'Winde';
            case 'aerotow':
                return 'F-Schlepp';
            case 'motorized':
                return 'Eigenstart';
            case 'unknown':
            default:
                return 'Unbekannt';
        }
    }

    getLaunchIcon(type?: string): string {
        switch (type) {
            case 'winch':
                return 'delivery_truck_bolt';
            case 'aerotow':
                return 'connecting_airports';
            case 'motorized':
                return 'travel';
            case 'unknown':
            default:
                return 'help_outline';
        }
    }

    getFlightDurationText(departure?: number, landing?: number): string {
        if (!departure) return '';
        const end = landing ?? Date.now();
        const diff = end - departure;

        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;

        return `${hours > 0 ? hours + ' h ' : ''}${mins} min`;
    }

    getFlightDurationTime(departure?: number, landing?: number): string {
        if (!departure) return '';
        const end = landing ?? Date.now();
        const diff = end - departure;

        const totalMinutes = Math.floor(diff / 60000);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        const pad = (n: number) => n.toString().padStart(2, '0');

        return `${pad(hours)}:${pad(minutes)}`;
    }

}
