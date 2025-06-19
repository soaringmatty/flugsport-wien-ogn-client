import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  OnInit,
  Signal,
  signal,
  untracked,
  ViewChild,
} from '@angular/core';
import { Flight } from '../../models/flight.model';
import { MapSettings } from '../../models/settings.model';
import { GliderMarkerProperties } from '../../models/glider-marker-properties.model';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { OgnStore } from '../../store/ogn.store';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// OpenLayers Imports
import OlMap from 'ol/Map';
import View from 'ol/View';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import LineString from 'ol/geom/LineString';
import { Coordinate } from 'ol/coordinate';
import { fromLonLat, toLonLat, transformExtent } from 'ol/proj';
import VectorSource from 'ol/source/Vector';
import TileSource from 'ol/source/Tile';
import OSM from 'ol/source/OSM';
import VectorLayer from 'ol/layer/Vector';
import TileLayer from 'ol/layer/Tile';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { GliderMarkerService } from '../../services/glider-marker.service';
import { GliderFilter } from '../../models/glider-filter';
import { coordinates } from '../../constants/coordinates';
import { defaultSettings, getRefreshTimeout } from '../../services/settings.service';
import { HistoryEntry } from '../../models/history-entry.model';
import { chaikinsAlgorithm } from '../../utils/flight-path.utils';
import { GliderType } from '../../models/glider-type';
import { defaults as defaultControls } from 'ol/control';
import { FlightInfoSheetComponent } from '../flight-info-sheet/flight-info-sheet.component';
import { NgClass } from '@angular/common';
import { MapType } from '../../models/map-type';
import { FlightStatus } from '../../models/flight-status';
import { DetailViewMobileComponent } from '../detail-view-mobile/detail-view-mobile.component';
import {
  MapBarogramSyncService,
  MarkerLocationUpdate,
} from '../../services/map-barogram-sync.service';

@Component({
  selector: 'app-map',
  imports: [RouterLink, DetailViewMobileComponent],
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapComponent implements OnInit, AfterViewInit {
  // Dependencies (via inject)
  private readonly store = inject(OgnStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly gliderMarkerService = inject(GliderMarkerService);
  private readonly mapBarogramSyncService = inject(MapBarogramSyncService);

  // Public properties
  selectedAircraft = this.store.selectedAircraft;
  selectedAircraftFlightData = this.store.selectedAircraftFlightData as Signal<Flight | undefined>;
  settings = this.store.settings;
  flights = this.store.flights;
  flightHistory = this.store.flightHistory;
  historicFlightTarget = this.store.historicFlightTarget;

  private markerDictionary: Map<string, GliderMarkerProperties> = new Map();
  private reloadIntervalId: any;
  private mapChangeTriggerTimeout: any;
  private destroy$ = new Subject<void>();

  // Map and Layers
  private map!: OlMap;
  private clubGlidersLayer!: VectorLayer<VectorSource>;
  private privateGlidersLayer!: VectorLayer<VectorSource>;
  private foreignGlidersLayer!: VectorLayer<VectorSource>;
  private flightPathStrokeLayer!: VectorLayer<VectorSource>;
  private flightPathLayer!: VectorLayer<VectorSource>;
  private flightPathMarkerLayer!: VectorLayer<VectorSource>;
  private mapTileLayer!: TileLayer<TileSource>;

  constructor() {
    // When map target is set (e.g. click on a search result item) -> move map to that point
    effect(() => {
      const target = this.store.mapTarget();
      if (target) {
        this.showFlarmIdOnMap(target.flarmId, target.lng, target.lat, target.flightStatus);
        this.store.clearMapTarget();
      }
    });

    // When historic flight target is set (e.g. show single flight from departure list) -> show flight path of that flight
    effect(() => {
      const target = this.historicFlightTarget();
      if (target) {
        this.unselectGlider();
        this.store.loadFlightHistory(target.flarmId, target.start, target.end);
      }
    });

    // Update marker whenever flights are loaded or settings are updated
    effect(() => {
      //console.debug('effect - Update marker whenever flights are loaded or settings are updated');
      const flights = this.flights();
      const settings = this.settings();
      if (flights && settings) this.updateGliderPositionsOnMap(flights);
    });

    // Draw flight path on map if marker is selected or datapoint is added to flight position history
    effect(() => {
      //console.debug('effect - Draw flight path on map if marker is selected or datapoint is added to flight position history');
      const history = this.flightHistory();
      const selected = this.selectedAircraftFlightData();
      if (selected && history) this.drawFlightPathFromHistory(history);
      if (this.historicFlightTarget()) this.fitMapToFlightPath(history);
    });

    // Update map and load flights when settings are updated
    effect(() => {
      //console.debug('effect - Update map and load flights when settings are updated');
      const settings = this.settings();
      this.setMapTilesAccordingToSettings(settings);
      this.markerDictionary.clear();
      this.clubGlidersLayer.getSource()?.clear();
      this.privateGlidersLayer.getSource()?.clear();
      this.foreignGlidersLayer.getSource()?.clear();
      untracked(() => {
        this.loadFlightsWithFilter(settings);
      });
    });
  }

  ngOnInit(): void {
    this.initializeMap();
    this.initiallyLoadData();

    // Select aircraft if flarmId is set in query params
    this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const flarmId = params.get('flarmId');
      if (flarmId && this.selectedAircraft() !== flarmId) {
        this.store.loadAndSetMapTarget(flarmId);
      }
    });

    // Sync marker on map with selected timestamp in barogram
    this.mapBarogramSyncService.markerLocationUpdateRequested
      .pipe(takeUntil(this.destroy$))
      .subscribe((markerLocationUpdate) => {
        markerLocationUpdate
          ? this.drawMarkerOnFlightPath(markerLocationUpdate)
          : this.flightPathMarkerLayer.getSource()?.clear();
      });
  }

  ngAfterViewInit(): void {
    this.map.updateSize();
  }

  ngOnDestroy(): void {
    clearInterval(this.reloadIntervalId);
    this.destroy$.next();
    this.destroy$.complete();
  }

  openSearchPage(): void {
    this.router.navigate(['./search']);
  }

  private showFlarmIdOnMap(flarmId: string, lng: number, lat: number, flightStatus: FlightStatus) {
    const coordinate = fromLonLat([lng, lat]);
    let mapZoom = 0;
    switch (flightStatus) {
      case FlightStatus.Flying:
      case FlightStatus.FlyingSignalLost:
        mapZoom = 11;
        break;
      default:
        mapZoom = 13;
        break;
    }
    this.map.getView().setCenter(coordinate);
    this.map.getView().setZoom(mapZoom);
    untracked(() => {
      this.unselectGlider();
      this.selectGlider(flarmId);
    });
  }

  private loadFlightsWithFilter(settings: MapSettings) {
    const extent = this.map.getView().calculateExtent(this.map.getSize());
    // Add 10% padding so that markers don't disappear unexpectedly when coming slightly out of screen
    const paddingFactor = 0.1;
    const width = extent[2] - extent[0];
    const height = extent[3] - extent[1];

    const paddedExtent = [
      extent[0] - width * paddingFactor,
      extent[1] - height * paddingFactor,
      extent[2] + width * paddingFactor,
      extent[3] + height * paddingFactor,
    ];

    const [minLng, minLat, maxLng, maxLat] = transformExtent(
      paddedExtent,
      'EPSG:3857',
      'EPSG:4326',
    );
    this.store.loadFlights(
      maxLat,
      minLat,
      maxLng,
      minLng,
      this.selectedAircraft() as string,
      settings.gliderFilterOnMap !== GliderFilter.allAirplanes,
      settings.gliderFilterOnMap === GliderFilter.clubAndprivate,
    );
  }

  private setMapTilesAccordingToSettings(settings: MapSettings) {
    // const source = settings.mapType === MapType.stamen
    //     ? new Stamen({ layer: 'terrain' })
    //     : new OSM();
    const source = new OSM();
    this.mapTileLayer.setSource(source);
  }

  private centerMapIfMarkerIsCovered(flight: Flight): void {
    const view = this.map.getView();
    const markerCoord = fromLonLat([flight.longitude, flight.latitude]);
    const markerPixel = this.map.getPixelFromCoordinate(markerCoord);
    const mapSize = this.map.getSize();
    if (!markerPixel || !mapSize) return;

    const [mapWidth, mapHeight] = mapSize;

    // Marker is only centered if it is in the lower 40% of the screen height
    const verticalThreshold = mapHeight * 0.6;

    const [markerX, markerY] = markerPixel;
    if (markerY > verticalThreshold) {
      // Marker is moved to 40% from top
      const desiredY = mapHeight * 0.4;
      const deltaY = markerY - desiredY;

      const currentCenterPixel = this.map.getPixelFromCoordinate(view.getCenter()!);
      const desiredCenterPixel: [number, number] = [markerX, currentCenterPixel[1] + deltaY];

      const newCenter = this.map.getCoordinateFromPixel(desiredCenterPixel);
      if (newCenter) {
        view.animate({
          center: newCenter,
          duration: 400,
          easing: (t) => t * (2 - t),
        });
      }
    }
  }

  private initializeMap() {
    const storedCenter = sessionStorage.getItem('mapCenter');
    const storedZoom = sessionStorage.getItem('mapZoom');
    const center = storedCenter ? JSON.parse(storedCenter) : coordinates.loxn;
    const zoom = storedZoom ? +storedZoom : 12;

    this.mapTileLayer = new TileLayer({ source: new OSM() });
    this.clubGlidersLayer = new VectorLayer({ source: new VectorSource() });
    this.privateGlidersLayer = new VectorLayer({ source: new VectorSource() });
    this.foreignGlidersLayer = new VectorLayer({ source: new VectorSource() });
    this.flightPathStrokeLayer = new VectorLayer({ source: new VectorSource() });
    this.flightPathLayer = new VectorLayer({ source: new VectorSource() });
    this.flightPathMarkerLayer = new VectorLayer({ source: new VectorSource() });

    const view = new View({
      center: fromLonLat(center),
      zoom,
      minZoom: 6,
      enableRotation: false,
    });

    view.on('change', () => {
      if (!this.settings().reduceDataUsage) {
        this.handleMapViewChange();
      } else {
        clearTimeout(this.mapChangeTriggerTimeout);
        this.mapChangeTriggerTimeout = setTimeout(() => this.handleMapViewChange(), 600);
      }
    });

    this.map = new OlMap({
      target: 'map',
      layers: [
        this.mapTileLayer,
        this.flightPathStrokeLayer,
        this.flightPathLayer,
        this.flightPathMarkerLayer,
        this.foreignGlidersLayer,
        this.privateGlidersLayer,
        this.clubGlidersLayer,
      ],
      view,
      controls: defaultControls({
        zoom: false,
      }),
    });

    this.map.on('pointermove', (e) => {
      const hit = this.map.hasFeatureAtPixel(e.pixel);
      this.map.getTargetElement().style.cursor = hit ? 'pointer' : '';
    });

    // Show information card and load flight path when marker is clicked
    this.map.on('click', (e) => {
      this.onMarkerClicked(e);
    });
  }

  // Selects specific glider marker bases on a map click event
  private onMarkerClicked(e: any) {
    const features = this.map.getFeaturesAtPixel(e.pixel, { hitTolerance: 4 });
    if (!features || features.length < 1) {
      return;
    }
    const feature = features[0];
    const flarmId = feature.getId() as string;
    if (flarmId) {
      this.selectGlider(flarmId);
    }
  }

  // Puts a specific glider on the map in focus
  // -> Updates selected flight in store (which causes the info card to open), updates marker style to selected, loads flight path to show on map
  private selectGlider(flarmId: string): void {
    if (this.selectedAircraft() === flarmId || !flarmId) {
      return;
    }
    this.store.clearHistoricFlightTarget();
    const previousSelectedFlightData = this.selectedAircraftFlightData();
    this.store.selectAircraft(flarmId);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { flarmId },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
    const flightData = this.flights().find((x) => x.flarmId === flarmId);
    if (flightData) {
      this.store.setSelectedAircraftFlightData(flightData);
      if (previousSelectedFlightData) {
        // Update previous selected marker style to unselected
        this.updateSingleMarkerOnMap(previousSelectedFlightData);
      }
      this.updateSingleMarkerOnMap(flightData);

      this.centerMapIfMarkerIsCovered(flightData);
    } else {
      this.loadFlightsWithFilter(this.settings());
    }
    this.store.loadFlightHistory(flarmId);
  }

  // Removes focus from currently selected glider, clears flight path from map and closes info card and barogram
  unselectGlider(): void {
    if (!this.selectedAircraftFlightData()) {
      return;
    }
    this.store.selectAircraft(null);
    this.updateSingleMarkerOnMap(this.selectedAircraftFlightData() as Flight);
    this.flightPathStrokeLayer.getSource()?.clear();
    this.flightPathLayer.getSource()?.clear();
    this.flightPathMarkerLayer.getSource()?.clear();
  }

  private handleMapViewChange() {
    const zoom = this.map.getView().getZoom();
    const center = this.map.getView().getCenter();
    let hasChanges = false;

    if (zoom !== undefined && sessionStorage.getItem('mapZoom') !== zoom.toString()) {
      sessionStorage.setItem('mapZoom', zoom.toString());
      hasChanges = true;
    }
    if (center && sessionStorage.getItem('mapCenter') !== JSON.stringify(toLonLat(center))) {
      sessionStorage.setItem('mapCenter', JSON.stringify(toLonLat(center)));
      hasChanges = true;
    }

    if (hasChanges) {
      this.setupTimerForGliderPositionUpdates();
      this.loadFlightsWithFilter(this.settings());
    }
  }

  closeDetailView(): void {
    this.unselectGlider();
    this.store.clearHistoricFlightTarget();
  }

  private setupTimerForGliderPositionUpdates() {
    clearInterval(this.reloadIntervalId);
    this.reloadIntervalId = setInterval(() => {
      this.loadFlightsWithFilter(this.settings());
    }, getRefreshTimeout(this.settings().reduceDataUsage));
  }

  private initiallyLoadData() {
    this.loadFlightsWithFilter(this.settings());
    this.setupTimerForGliderPositionUpdates();
  }

  private drawMarkerOnFlightPath(markerLocationUpdate: MarkerLocationUpdate) {
    this.flightPathMarkerLayer.getSource()?.clear();
    if (!markerLocationUpdate) return;

    const marker = new Feature({
      geometry: new Point(
        fromLonLat([markerLocationUpdate.longitude, markerLocationUpdate.latitude]),
      ),
    });
    marker.setStyle(
      this.gliderMarkerService.getFlightPathPositionMarkerStyle(markerLocationUpdate.rotation),
    );
    this.flightPathMarkerLayer.getSource()?.addFeature(marker);
  }

  // Adapt map zoom and center to perfectly fit flight path
  private fitMapToFlightPath(history: HistoryEntry[]): void {
    if (!history || history.length === 0) return;
    const coordinates = history
      .filter((h) => h.latitude && h.longitude)
      .map((h) => fromLonLat([h.longitude, h.latitude]));
    if (coordinates.length < 1) return;

    const extent = new LineString(coordinates).getExtent();
    this.map.getView().fit(extent, {
      padding: [30, 30, 230, 30], // 230 is bottom padding for mobile view
      maxZoom: 13,
    });
  }

  private drawFlightPathFromHistory(historyEntries: HistoryEntry[]) {
    const settings = this.settings();
    // const entries = settings.onlyShowLastFlight
    //     ? this.flightAnalysationService.getHistorySinceLastTakeoff(historyEntries)
    //     : historyEntries;
    const entries = historyEntries;
    if (!historyEntries || !historyEntries?.length) {
      return;
    }

    const coords = entries.map((e) => fromLonLat([e.longitude, e.latitude]));
    let geometry = new LineString(coords);

    if (settings.useFlightPathSmoothing) {
      const smooth = chaikinsAlgorithm(coords);
      if (smooth.length) geometry = new LineString(smooth);
    }

    const outer = new Feature(geometry);
    const inner = new Feature(geometry);
    outer.setStyle(this.gliderMarkerService.flightPathStrokeStyle);
    inner.setStyle(this.gliderMarkerService.flightPathStyle);

    this.flightPathStrokeLayer.getSource()?.clear();
    this.flightPathStrokeLayer.getSource()?.addFeature(outer);
    this.flightPathLayer.getSource()?.clear();
    this.flightPathLayer.getSource()?.addFeature(inner);
  }

  updateGliderPositionsOnMap(flights: Flight[]): void {
    const sortedFlights = this.gliderMarkerService.getSortedFlights(flights, this.settings());
    const baseZIndex = 1000;

    sortedFlights.forEach((flight, index) => {
      const zIndex = baseZIndex - index;
      this.updateSingleMarkerOnMap(flight, zIndex);
    });

    this.removeObsoleteGliderMarkers(flights);
  }

  private async updateSingleMarkerOnMap(flight: Flight, zIndex?: number) {
    if (!flight?.longitude || !flight.latitude) return;

    const layer = this.getLayerByGliderType(flight.type);
    const source = layer.getSource();
    const existingFeature = source?.getFeatureById(flight.flarmId);

    const isSelected = this.selectedAircraftFlightData()?.flarmId === flight.flarmId;

    const iconStyle = await this.gliderMarkerService.getGliderMarkerStyle(
      flight,
      this.settings(),
      isSelected,
    );

    if (zIndex) {
      iconStyle.setZIndex(isSelected ? 10000 : zIndex);
    }

    if (existingFeature) {
      existingFeature.setGeometry(new Point(fromLonLat([flight.longitude, flight.latitude])));
      existingFeature.setStyle(iconStyle);
    } else {
      const feature = new Feature({
        geometry: new Point(fromLonLat([flight.longitude, flight.latitude])),
      });
      feature.setId(flight.flarmId);
      feature.setStyle(iconStyle);
      source?.addFeature(feature);
    }

    this.markerDictionary.set(flight.flarmId, {
      isSelected,
      opacity: this.gliderMarkerService.getMarkerOpacity(flight.timestamp, isSelected),
      altitudeLayer: Math.floor(flight.heightMSL / 250),
    });
  }

  private removeObsoleteGliderMarkers(flights: Flight[]) {
    const allLayers = [this.clubGlidersLayer, this.privateGlidersLayer, this.foreignGlidersLayer];
    for (const layer of allLayers) {
      const source = layer.getSource();
      source?.getFeatures().forEach((f) => {
        const id = f.getId();
        if (id && !flights.find((flight) => flight.flarmId === id)) {
          source.removeFeature(f);
        }
      });
    }
  }

  private getLayerByGliderType(type: GliderType): VectorLayer<VectorSource> {
    switch (type) {
      case GliderType.club:
        return this.clubGlidersLayer;
      case GliderType.private:
        return this.privateGlidersLayer;
      default:
        return this.foreignGlidersLayer;
    }
  }
}
