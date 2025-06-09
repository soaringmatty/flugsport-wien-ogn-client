import { ChangeDetectionStrategy, Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { DepartureListItem } from '../../models/departure-list-item.model';
import { NgFor } from '@angular/common';
import { DepartureListItemComponent } from "../departure-list-item/departure-list-item.component";
import { OgnStore } from '../../store/ogn.store';
import { interval, Subject, takeUntil } from 'rxjs';
import { LaunchType } from '../../models/launch-type';

@Component({
    selector: 'app-departure-list',
    imports: [NgFor, DepartureListItemComponent],
    templateUrl: './departure-list.component.html',
    styleUrl: './departure-list.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush

})
export class DepartureListComponent implements OnInit, OnDestroy {
    private readonly ognStore = inject(OgnStore);
    private readonly destroy$ = new Subject<void>();

    departureList = this.ognStore.departureList;
    //departureList = signal<DepartureListItem[]>([]);
    expandedItemIndex = signal<number | null>(null);
    filteredFlarmId = signal<string | null>(null);

    filteredList = computed(() => {
        return this.filteredFlarmId() ? this.departureList().filter(f => f.flarmId === this.filteredFlarmId()) : this.departureList();
    });

    isListFiltered = computed(() => {
        return !!this.filteredFlarmId()
    })

    ngOnInit(): void {
        interval(10_000).pipe(takeUntil(this.destroy$)).subscribe(() => {
            this.ognStore.loadDepartureList(false);
        });
        this.ognStore.loadDepartureList(false);
        //this.departureList.set(this.demoList);
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    toggleExpanded(index: number) {
        this.expandedItemIndex.update(i => (i === index ? null : index));
    }

    showFlightOnMap(listItem: DepartureListItem): void {
        // TODO
    }

    filterForAircraft(flarmId: string | null): void {
        if (!flarmId) {
            this.filteredFlarmId.set(null);
        }
        this.filteredFlarmId.set(flarmId);
    }

    demoList: DepartureListItem[] = [
        {
            flarmId: '440524',
            registration: 'OE-9466',
            registrationShort: '466',
            model: 'Dimona HK 36 TTC',
            departureTimestamp: 1749136500000,
            landingTimestamp: 1749138600000,
            launchType: LaunchType.motorized,
        },
        {
            flarmId: 'DD9EA3',
            registration: 'D-2526',
            registrationShort: 'DL',
            model: 'LS4',
            departureTimestamp: 1749135600000,
            launchType: LaunchType.unknown,
        },
        {
            flarmId: 'DDAD0C',
            registration: 'D-3931',
            registrationShort: 'DZ',
            model: 'ASK 21',
            departureTimestamp: 1749134400000,
            landingTimestamp: 1749136200000,
            launchType: LaunchType.winch,
            launchHeight: 530,
        },
        {
            flarmId: '440523',
            registration: 'OE-CBB',
            registrationShort: 'CBB',
            model: 'Katana DA 20 A1',
            departureTimestamp: 1749133200000,
            landingTimestamp: 1749135300000,
            launchType: LaunchType.motorized,
        },
        {
            flarmId: 'DD98B4',
            registration: 'D-0544',
            registrationShort: 'DR',
            model: 'Ventus 2b',
            departureTimestamp: 1749132000000,
            landingTimestamp: 1749134400000,
            launchType: LaunchType.aerotow,
            launchHeight: 600,
        },
        {
            flarmId: 'DDAD0C',
            registration: 'D-3931',
            registrationShort: 'DZ',
            model: 'ASK 21',
            departureTimestamp: 1749131400000,
            landingTimestamp: 1749132900000,
            launchType: LaunchType.aerotow,
            launchHeight: 400,
        },
        {
            flarmId: '440524',
            registration: 'OE-9466',
            registrationShort: '466',
            model: 'Dimona HK 36 TTC',
            departureTimestamp: 1749130800000,
            landingTimestamp: 1749132600000,
            launchType: LaunchType.motorized,
        },
        {
            flarmId: 'DD98B4',
            registration: 'D-0544',
            registrationShort: 'DR',
            model: 'Ventus 2b',
            departureTimestamp: 1749130200000,
            launchType: LaunchType.winch,
            launchHeight: 510,
        },
        {
            flarmId: 'DD9EA3',
            registration: 'D-2526',
            registrationShort: 'DL',
            model: 'LS4',
            departureTimestamp: 1749129600000,
            launchType: LaunchType.winch,
            launchHeight: 470,
        },
        {
            flarmId: 'DDAD0C',
            registration: 'D-3931',
            registrationShort: 'DZ',
            model: 'ASK 21',
            departureTimestamp: 1749128400000,
            landingTimestamp: 1749129900000,
            launchType: LaunchType.aerotow,
            launchHeight: 300,
        }
    ];
}