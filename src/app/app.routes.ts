import { Routes } from '@angular/router';
import { MapComponent } from './components/map/map.component';
import { DepartureListComponent } from './components/departure-list/departure-list.component';
import { SettingsComponent } from './components/settings/settings.component';
import { SearchComponent } from './components/search/search.component';

export const routes: Routes = [
  { path: 'map', component: MapComponent },
  { path: 'departures', component: DepartureListComponent },
  { path: 'settings', component: SettingsComponent },
  { path: 'search', component: SearchComponent },
  { path: '', redirectTo: 'map', pathMatch: 'full' }, // Default route
  { path: '**', redirectTo: 'map' }, // Default route
];
