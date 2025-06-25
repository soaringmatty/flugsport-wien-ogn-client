import { Injectable } from '@angular/core';
import { MapSettings } from '../models/settings.model';
import { GliderType } from '../models/glider-type';
import { MapType } from '../models/map-type';
import config from '../../../package.json';
import { MarkerColorScheme } from '../models/marker-color-scheme';
import { GliderFilter } from '../models/glider-filter';
import { DepartureListFilter } from '../models/departure-list-filter.model';

export const defaultSettings: MapSettings = {
  version: config.version,
  gliderFilterOnMap: GliderFilter.allAirplanes,
  hideGlidersOnGround: false,
  hideUnregisteredAircraft: false,
  mapType: MapType.osm,
  onlyShowLastFlight: true,
  gliderFilterInLists: GliderFilter.club,
  showChangelogForNewVersion: true,
  markerColorScheme: MarkerColorScheme.highlightKnownGliders,
  useUtcTimeInDepartureList: true,
  reduceDataUsage: false,
  flightPathExcludeFaultySignals: true,
};

export const defaultDepartureListFilter: DepartureListFilter = {
  knownGlidersOnly: false,
  includeLaunchTypeWinch: true,
  includeLaunchTypeAerotow: true,
  includeLaunchTypeMotorized: true,
  includeLaunchTypeUnknown: true,
  flarmId: null,
  towPlaneFlarmId: null,
  utcTimestamps: true,
};

export function getRefreshTimeout(reduceDataUsage: boolean): number {
  return reduceDataUsage ? 10000 : 5000;
}

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  private readonly settingsKey = 'ogn_config';
  private readonly departureListFilterKey = 'departure_list_filter';

  isNewVersion = false;

  loadSettings(): MapSettings {
    const raw = localStorage.getItem(this.settingsKey);
    if (!raw) {
      this.saveSettings(defaultSettings);
      return defaultSettings;
    }

    const parsed = JSON.parse(raw);
    if (parsed.version !== config.version) {
      this.isNewVersion = true;
      const migrated = this.migrate(parsed);
      this.saveSettings(migrated);
      return migrated;
    }

    return parsed;
  }

  saveSettings(settings: MapSettings): void {
    localStorage.setItem(this.settingsKey, JSON.stringify(settings));
  }

  loadDepartureListFilter(): DepartureListFilter {
    const raw = localStorage.getItem(this.departureListFilterKey);
    if (!raw) {
      this.saveDepartureListFilter(defaultDepartureListFilter);
      return defaultDepartureListFilter;
    }
    return JSON.parse(raw);
  }

  saveDepartureListFilter(filter: DepartureListFilter): void {
    localStorage.setItem(this.departureListFilterKey, JSON.stringify(filter));
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
