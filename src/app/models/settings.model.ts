import { GliderFilter } from './glider-filter';
import { GliderType } from './glider-type';
import { MapType } from './map-type';
import { MarkerColorScheme } from './marker-color-scheme';

export interface MapSettings {
  version: string;
  gliderFilterOnMap: GliderFilter;
  hideUnregisteredAircraft: boolean;
  hideGlidersOnGround: boolean;
  mapType: MapType;
  onlyShowLastFlight: boolean;
  gliderFilterInLists: GliderFilter;
  showChangelogForNewVersion: boolean;
  markerColorScheme: MarkerColorScheme;
  useUtcTimeInDepartureList: boolean;
  reduceDataUsage: boolean;
  flightPathExcludeFaultySignals: boolean;
}
