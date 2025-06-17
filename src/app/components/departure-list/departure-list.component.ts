import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { DepartureListItem } from '../../models/departure-list-item.model';
import { NgFor } from '@angular/common';
import { DepartureListItemComponent } from '../departure-list-item/departure-list-item.component';
import { OgnStore } from '../../store/ogn.store';
import { interval, Subject, takeUntil } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-departure-list',
  imports: [NgFor, DepartureListItemComponent],
  templateUrl: './departure-list.component.html',
  styleUrl: './departure-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DepartureListComponent implements OnInit, OnDestroy {
  private readonly ognStore = inject(OgnStore);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();

  departureList = this.ognStore.departureList;
  expandedItemIndex = signal<number | null>(null);
  filteredFlarmId = signal<string | null>(null);

  filteredList = computed(() => {
    return this.filteredFlarmId()
      ? this.departureList().filter((f) => f.flarmId === this.filteredFlarmId())
      : this.departureList();
  });

  isListFiltered = computed(() => {
    return !!this.filteredFlarmId();
  });

  ngOnInit(): void {
    interval(10_000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.ognStore.loadDepartureList(false);
      });
    this.ognStore.loadDepartureList(false);
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
    if (!flarmId) {
      this.filteredFlarmId.set(null);
    }
    this.filteredFlarmId.set(flarmId);
  }
}
