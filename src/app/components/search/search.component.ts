import { AfterViewInit, ChangeDetectionStrategy, Component, effect, ElementRef, inject, OnDestroy, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { OgnStore } from '../../store/ogn.store';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { SearchResultItem } from '../../models/search-result-item.model';
import { interval, Subscription } from 'rxjs';

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
  private searchTimerSub: Subscription | null = null;
  private currentSearchText: string = '';

  ngAfterViewInit() {
    setTimeout(() => {
      this.searchInputRef.nativeElement.focus();
    }, 0);
  }

  searchAircraft(event: Event): void {
    this.currentSearchText = (event.target as HTMLInputElement).value.trim();
    if (this.currentSearchText === '') {
      this.stopSearchTimer();
      this.store.clearSearchResult();
    }
    else {
      this.store.searchAircraft(this.currentSearchText);
      this.restartSearchTimer();
    }
  }

  showAircraftOnMap(item: SearchResultItem): void {
    // TODO
  }

  getTimeAgoString(timestamp: number): string {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    const intervals: { [key: string]: number } = {
      'Tag': 86400,
      'Stunde': 3600,
      'Minute': 60,
      'Sekunde': 1,
    };
    for (const unit in intervals) {
      const counter = Math.floor(seconds / intervals[unit]);
      if (counter > 0) {
        const pluralPostfix = unit === 'Tag' ? 'en' : 'n'
        const plural = counter === 1 ? '' : pluralPostfix;
        return `vor ${counter} ${unit}${plural}`;
      }
    }
    return 'gerade eben';
  }

  

  private restartSearchTimer(): void {
    this.stopSearchTimer();

    this.searchTimerSub = interval(3000).subscribe(() => {
      if (this.currentSearchText !== '') {
        this.store.searchAircraft(this.currentSearchText);
      }
    });
  }

  private stopSearchTimer(): void {
    this.searchTimerSub?.unsubscribe();
    this.searchTimerSub = null;
  }

  ngOnDestroy(): void {
    this.stopSearchTimer();
    this.store.clearSearchResult();
  }
}
