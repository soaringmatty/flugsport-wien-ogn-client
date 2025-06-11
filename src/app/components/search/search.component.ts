import { AfterViewInit, ChangeDetectionStrategy, Component, effect, ElementRef, inject, OnDestroy, signal, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { OgnStore } from '../../store/ogn.store';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { SearchResultItem } from '../../models/search-result-item.model';
import { interval, Subscription } from 'rxjs';
import { getTimeAgoString } from '../../utils/time.utils';


@Component({
  selector: 'app-search',
  imports: [NgClass, NgFor],
  templateUrl: './search.component.html',
  styleUrl: './search.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchComponent implements AfterViewInit, OnDestroy {
  readonly router = inject(Router);
  readonly store = inject(OgnStore);
  

  @ViewChild('searchInput') searchInputRef!: ElementRef<HTMLInputElement>;

  searchResults = this.store.searchResult;
  currentSearchText = signal(this.store.searchText());
  private searchTimerSub: Subscription | null = null;
  private hasNavigatedToMap = false;

  ngAfterViewInit() {
    this.setFocusToSearchInput();
  }

  searchAircraft(event: Event): void {
    this.currentSearchText.set((event.target as HTMLInputElement).value.trim());
    if (this.currentSearchText() === '') {
      this.stopSearchTimer();
      this.store.clearSearchResult();
    }
    else {
      this.store.searchAircraft(this.currentSearchText());
      this.restartSearchTimer();
    }
  }

  clearSearchText(): void {
    this.currentSearchText.set('')
    this.stopSearchTimer();
    this.store.clearSearchResult();
    this.setFocusToSearchInput();
  }

  showAircraftOnMap(item: SearchResultItem): void {
    this.store.setMapTarget(item.flarmId, item.latitude, item.longitude, item.flightStatus);
    this.hasNavigatedToMap = true;
    this.router.navigate(['/map']);
  }

  getTimeAgoString = getTimeAgoString;

  private setFocusToSearchInput(): void {
    setTimeout(() => {
      this.searchInputRef.nativeElement.focus();
    }, 0);
  }

  private restartSearchTimer(): void {
    this.stopSearchTimer();

    this.searchTimerSub = interval(3000).subscribe(() => {
      if (this.currentSearchText() !== '') {
        this.store.searchAircraft(this.currentSearchText());
      }
    });
  }

  private stopSearchTimer(): void {
    this.searchTimerSub?.unsubscribe();
    this.searchTimerSub = null;
  }

  ngOnDestroy(): void {
    this.stopSearchTimer();
    // if (!this.hasNavigatedToMap) {
    //   this.store.clearSearchResult();
    // }
  }
}
