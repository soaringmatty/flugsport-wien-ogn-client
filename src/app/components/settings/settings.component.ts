import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MapSettings } from '../../models/settings.model';
import { OgnStore } from '../../store/ogn.store';
import config from '../../../../package.json';
import { MapType } from '../../models/map-type';
import { GliderFilter } from '../../models/glider-filter';
import { NgFor, NgIf } from '@angular/common';
import { MarkerColorScheme } from '../../models/marker-color-scheme';
import { FormsModule } from '@angular/forms';
import { defaultSettings } from '../../services/settings.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [NgIf, NgFor, FormsModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsComponent {
  private readonly store = inject(OgnStore);

  settings = signal<MapSettings>(defaultSettings);

  readonly versionNumber = config.version;
  readonly MapType = MapType;
  readonly GliderFilter = GliderFilter;
  readonly MarkerColorScheme = MarkerColorScheme;

  // UI Hilfsdaten
  gliderFilters = [
    { value: GliderFilter.clubAndprivate, label: 'Nur Vereinsflugzeuge' },
    { value: GliderFilter.allGliders, label: 'Alle Segelflugzeuge' },
    { value: GliderFilter.allAirplanes, label: 'Keine Einschränkung' },
    { value: GliderFilter.custom, label: 'Benutzerdefiniert' },
  ];

  markerColorSchemes = [
    { value: MarkerColorScheme.highlightKnownGliders, label: 'Vereinsflugzeuge hervorheben' },
    { value: MarkerColorScheme.altitude, label: 'Je nach Flughöhe' },
    { value: MarkerColorScheme.aircraftType, label: 'Luftfahrzeugtypen (Glide & Seek)' },
  ];

  customTypes = ['Segelflugzeuge', 'Motorflugzeuge', 'Paragleiter', 'Helikopter', 'Drohnen'];

  constructor() {
    this.store.loadSettings();
    this.settings.set({ ...this.store.settings() })
  }

  save(): void {
    this.store.saveSettings(this.settings());
  }

  onMapTypeChange(event: Event) {
    console.log(event)
    const select = event.target as HTMLSelectElement;
    const mapType = Number(select.value) as MapType;
    console.log(mapType);
    this.settings.update(prev => ({ ...prev, mapType }));
    this.save();
  }

  onHideGlidersOnGroundChange(event: Event) {
    const hideGlidersOnGround = (event.target as HTMLInputElement).checked;
    this.settings.update(prev => ({ ...prev, hideGlidersOnGround }));
    this.save();
  }

  onAircraftFilterChange(gliderFilterOnMap: GliderFilter) {
    this.settings.update(prev => ({ ...prev, gliderFilterOnMap }));
    this.save();
  }

  onMarkerColorSchemeChange(markerColorScheme: MarkerColorScheme) {
    this.settings.update(prev => ({ ...prev, markerColorScheme }));
    this.save();
  }
}