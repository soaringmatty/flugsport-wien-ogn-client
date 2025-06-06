import { Component } from '@angular/core';
import { DepartureListItem } from '../../models/departure-list-item.model';
import { DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { DepartureListItemComponent } from "../departure-list-item/departure-list-item.component";

@Component({
    selector: 'app-departure-list',
    imports: [NgIf, NgFor, NgClass, DatePipe, DepartureListItemComponent],
    templateUrl: './departure-list.component.html',
    styleUrl: './departure-list.component.scss'
})
export class DepartureListComponent {
    flights: DepartureListItem[] = [
        {
            flarmId: '440524',
            registration: 'OE-9466',
            registrationShort: '466',
            model: 'Dimona HK 36 TTC',
            departureTimestamp: 1749136500000,
            landingTimestamp: 1749138600000,
            launchType: 'motorized',
        },
        {
            flarmId: 'DD9EA3',
            registration: 'D-2526',
            registrationShort: 'DL',
            model: 'LS4',
            departureTimestamp: 1749135600000,
            launchType: 'unknown',
        },
        {
            flarmId: 'DDAD0C',
            registration: 'D-3931',
            registrationShort: 'DZ',
            model: 'ASK 21',
            departureTimestamp: 1749134400000,
            landingTimestamp: 1749136200000,
            launchType: 'winch',
            launchHeight: 530,
        },
        {
            flarmId: '440523',
            registration: 'OE-CBB',
            registrationShort: 'CBB',
            model: 'Katana DA 20 A1',
            departureTimestamp: 1749133200000,
            landingTimestamp: 1749135300000,
            launchType: 'motorized',
        },
        {
            flarmId: 'DD98B4',
            registration: 'D-0544',
            registrationShort: 'DR',
            model: 'Ventus 2b',
            departureTimestamp: 1749132000000,
            landingTimestamp: 1749134400000,
            launchType: 'aerotow',
            launchHeight: 600,
        },
        {
            flarmId: 'DDAD0C',
            registration: 'D-3931',
            registrationShort: 'DZ',
            model: 'ASK 21',
            departureTimestamp: 1749131400000,
            landingTimestamp: 1749132900000,
            launchType: 'aerotow',
            launchHeight: 400,
        },
        {
            flarmId: '440524',
            registration: 'OE-9466',
            registrationShort: '466',
            model: 'Dimona HK 36 TTC',
            departureTimestamp: 1749130800000,
            landingTimestamp: 1749132600000,
            launchType: 'motorized',
        },
        {
            flarmId: 'DD98B4',
            registration: 'D-0544',
            registrationShort: 'DR',
            model: 'Ventus 2b',
            departureTimestamp: 1749130200000,
            launchType: 'winch',
            launchHeight: 510,
        },
        {
            flarmId: 'DD9EA3',
            registration: 'D-2526',
            registrationShort: 'DL',
            model: 'LS4',
            departureTimestamp: 1749129600000,
            launchType: 'winch',
            launchHeight: 470,
        },
        {
            flarmId: 'DDAD0C',
            registration: 'D-3931',
            registrationShort: 'DZ',
            model: 'ASK 21',
            departureTimestamp: 1749128400000,
            landingTimestamp: 1749129900000,
            launchType: 'aerotow',
            launchHeight: 300,
        }
    ];
}