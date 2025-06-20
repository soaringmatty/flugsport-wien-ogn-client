import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { DepartureListItem } from '../../models/departure-list-item.model';
import { CommonModule, NgFor } from '@angular/common';
import { DepartureListItemComponent } from '../departure-list-item/departure-list-item.component';
import { OgnStore } from '../../store/ogn.store';
import { interval, Subject, takeUntil } from 'rxjs';
import { Router } from '@angular/router';
import { DepartureListFilterComponent } from '../departure-list-filter/departure-list-filter.component';
import { defaultDepartureListFilter } from '../../services/settings.service';
import { DepartureListFilterTag } from '../../models/departure-list-filter-tag';

@Component({
  selector: 'app-departure-list',
  imports: [CommonModule, DepartureListItemComponent, DepartureListFilterComponent],
  templateUrl: './departure-list.component.html',
  styleUrl: './departure-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DepartureListComponent implements OnInit, OnDestroy {
  private readonly ognStore = inject(OgnStore);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();

  departureList = this.ognStore.departureList;
  filter = this.ognStore.departureListFilter;
  expandedItemIndex = signal<number | null>(null);
  showFilter = signal(false);

  filterTags = computed<DepartureListFilterTag[]>(() => {
    var filter = this.filter();
    const tags: DepartureListFilterTag[] = [];
    if (
      filter.includeLaunchTypeWinch &&
      filter.includeLaunchTypeAerotow &&
      filter.includeLaunchTypeMotorized &&
      filter.includeLaunchTypeUnknown
    ) {
      tags.push({ label: 'Alle Startarten', active: false });
    } else {
      if (filter.includeLaunchTypeWinch) tags.push({ label: 'Windenstarts', active: true });
      if (filter.includeLaunchTypeAerotow) tags.push({ label: 'F-Schlepps', active: true });
      if (filter.includeLaunchTypeMotorized) tags.push({ label: 'Eigenstarts', active: true });
    }
    if (filter.knownGlidersOnly) {
      tags.push({ label: 'Nur Vereinsflugzeuge', active: true });
    } else {
      tags.push({ label: 'Alle Flugzeuge', active: false });
    }
    if (filter.utcTimestamps) {
      tags.push({ label: 'UTC Zeiten', active: false });
    } else {
      tags.push({ label: 'Lokalzeit', active: true });
    }
    const aircraft = this.departureList().find((x) => x.flarmId === filter.flarmId);
    if (filter.flarmId && aircraft) {
      tags.push({ label: aircraft.registration, active: true, showClearButton: true });
    }
    return tags;
  });

  constructor() {
    this.ognStore.loadDepartureListFilter();
    effect(() => {
      this.filter();
      this.ognStore.loadDepartureList();
    });
  }

  ngOnInit(): void {
    interval(10_000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.ognStore.loadDepartureList();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleExpanded(index: number) {
    this.expandedItemIndex.update((i) => (i === index ? null : index));
  }

  showFlightOnMap(listItem: DepartureListItem): void {
    this.ognStore.setHistoricFlightTarget(listItem);
    this.router.navigate(['/map']);
  }

  filterForAircraft(flarmId: string | null): void {
    const updatedFilter = {
      ...this.filter(),
      flarmId,
    };
    this.ognStore.saveDepartureListFilter(updatedFilter);
  }
}
