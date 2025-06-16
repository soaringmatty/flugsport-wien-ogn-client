import { NgClass, NgFor } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';

@Component({
    selector: 'app-navigation-bar',
    imports: [NgFor, NgClass, RouterLink],
    templateUrl: './navigation-bar.component.html',
    styleUrl: './navigation-bar.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class NavigationBarComponent implements OnInit {
  public activeRoute = signal('/map');
  public readonly tabs: Array<{route: string, icon: string, name: string}> = [
    {
      route: '/map',
      icon: 'public',
      name: 'Karte'
    },
    {
      route: '/departures',
      icon: 'manage_search',
      name: 'Startliste'
    },
    {
      route: '/settings',
      icon: 'settings',
      name: 'Einstellungen'
    },
  ]

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Listen for route changes and update the active route
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.activeRoute.set(event.urlAfterRedirects);
      });
  }

  isActive(route: string): boolean {
    const activeRoute = this.activeRoute().split('?')[0];
    // In search -> map navigation point should also be active
    if (activeRoute === '/search' && route === '/map') {
      return true;
    }
    return activeRoute === route;
  }

  navigate(route: string) {
    this.router.navigateByUrl(route);
  }
}
