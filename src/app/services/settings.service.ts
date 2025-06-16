import { Injectable } from '@angular/core';
import { MapSettings } from '../models/settings.model';
import { GliderType } from '../models/glider-type';
import { MapType } from '../models/map-type';
import config from '../../../package.json';
import { MarkerColorScheme } from '../models/marker-color-scheme';
import { GliderFilter } from '../models/glider-filter';

export const defaultSettings: MapSettings = {
  version: config.version,
  gliderFilterOnMap: GliderFilter.allAirplanes,
  hideGlidersOnGround: false,
  hideUnregisteredAircraft: false,
  mapType: MapType.osm,
  useFlightPathSmoothing: true,
  onlyShowLastFlight: false,
  gliderFilterInLists: GliderFilter.club,
  showChangelogForNewVersion: true,
  markerColorScheme: MarkerColorScheme.highlightKnownGliders,
  useUtcTimeInDepartureList: true,
  reduceDataUsage: false,
  useNewDepartureList: false
}

export function getRefreshTimeout(reduceDataUsage: boolean): number {
  return reduceDataUsage ? 10000 : 5000;
}

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private readonly settingsKey = 'ogn_config';

  isNewVersion = false;

  loadSettings(): MapSettings {
    const raw = localStorage.getItem(this.settingsKey);
    if (!raw) return this.saveSettings(defaultSettings);

    const parsed = JSON.parse(raw);
    if (parsed.version !== config.version) {
      this.isNewVersion = true;
      const migrated = this.migrate(parsed);
      return this.saveSettings(migrated);
    }

    return parsed;
  }

  saveSettings(settings: MapSettings): MapSettings {
    localStorage.setItem(this.settingsKey, JSON.stringify(settings));
    return settings;
  }

  private migrate(oldSettings: any): MapSettings {
    const updated: any = { ...defaultSettings };
    for (const key in updated) {
      if (oldSettings[key] !== undefined && key !== 'version') {
        updated[key] = oldSettings[key];
      }
    }
    return updated;
  }
}
