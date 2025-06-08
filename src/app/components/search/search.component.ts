import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, inject, OnDestroy, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { OgnStore } from '../../store/ogn.store';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { SearchResultItem } from '../../models/search-result-item.model';

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

  ngAfterViewInit() {
    setTimeout(() => {
      this.searchInputRef.nativeElement.focus();
    }, 0);
  }

  searchAircraft(event: Event): void {
    const searchText = (event.target as HTMLInputElement).value.trim()
    this.store.searchAircraft(searchText);
  }

  showAircraftOnMap(item: SearchResultItem): void {

  }

  ngOnDestroy(): void {
    this.store.clearSearchResult();
  }  
}
