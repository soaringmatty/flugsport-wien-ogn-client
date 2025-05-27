import { AfterViewInit, ChangeDetectionStrategy, Component, effect, inject, OnInit, Signal, signal, untracked, ViewChild } from '@angular/core';
import { Flight } from '../../models/flight.model';
import { MapSettings } from '../../models/settings.model';
import { GliderMarkerProperties } from '../../models/glider-marker-properties.model';
import { Subject, Subscription } from 'rxjs';
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
import Style from 'ol/style/Style';
import Icon from 'ol/style/Icon';
import { ActivatedRoute } from '@angular/router';
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

@Component({
  selector: 'app-map',
  imports: [FlightInfoSheetComponent],
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MapComponent implements OnInit, AfterViewInit {
  // Dependencies (via inject)
  private readonly ognStore = inject(OgnStore);
  private readonly route = inject(ActivatedRoute);
  //private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly gliderMarkerService = inject(GliderMarkerService);
  //private readonly flightAnalysationService = inject(FlightAnalysationService);
  //private readonly mapBarogramSyncService = inject(MapBarogramSyncService);

  // Public properties
  isMobilePortrait = signal(false);
  showBarogram = signal(false);
  selectedFlight = this.ognStore.selectedFlight as Signal<Flight | undefined>;
  settings = this.ognStore.settings;
  flights = this.ognStore.flights;
  flightHistory = this.ognStore.flightHistory;

  private markerDictionary: Map<string, GliderMarkerProperties> = new Map();
  private reloadIntervalId: any;
  private mapChangeTriggerTimeout: any;

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

    // this.breakpointObserver
    //     .observe(mobileLayoutBreakpoints)
    //     .pipe(takeUntilDestroyed())
    //     .subscribe(result => this.isMobilePortrait.set(result.matches));

    // Update marker whenever flights are loaded or settings are updated
    effect(() => {
      console.debug('effect - Update marker whenever flights are loaded or settings are updated');
      const flights = this.flights();
      const settings = this.settings();
      if (flights && settings) this.updateGliderPositionsOnMap(flights);
    });

    // Draw flight path on map if marker is selected or datapoint is added to flight position history
    effect(() => {
      console.debug('effect - Draw flight path on map if marker is selected or datapoint is added to flight position history');
      const history = this.flightHistory();
      const selected = this.selectedFlight();
      if (selected && history) this.drawFlightPathFromHistory(history);
    });

    // Update map and load flights when settings are updated
    effect(() => {
      console.debug('effect - Update map and load flights when settings are updated');
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

    // effect(() => {
    //     this.mapBarogramSyncService.markerLocationUpdateRequested
    //         .pipe(takeUntilDestroyed())
    //         .subscribe(markerLocation => {
    //             if (markerLocation) this.drawMarkerOnFlightPath(markerLocation);
    //         });
    // });

    // effect(() => {
    //   this.route.paramMap
    //     .pipe(takeUntilDestroyed())
    //     .subscribe(params => {
    //       const lat = params.get('lat');
    //       const lon = params.get('lon');
    //       if (lat && lon) {
    //         const coordinate = fromLonLat([+lon, +lat]);
    //         this.map.getView().setCenter(coordinate);
    //         this.map.getView().setZoom(13);
    //       }
    //     });
    // });
  }

  ngOnInit(): void {
    this.initializeMap();
    this.initiallyLoadData();
  }

  ngAfterViewInit(): void {
    this.map.updateSize();
  }

  ngOnDestroy(): void {
    clearInterval(this.reloadIntervalId);
  }

  //   toggleBarogram(value: boolean) {
  //     this.showBarogram.set(value);
  //     if (!value) this.mapBarogramSyncService.updateLocationMarkerOnMap();
  //   }

  private loadFlightsWithFilter(settings: MapSettings) {
    const extent = this.map.getView().calculateExtent(this.map.getSize());
    const [minLng, minLat, maxLng, maxLat] = transformExtent(extent, 'EPSG:3857', 'EPSG:4326');
    this.ognStore.loadFlights(
      maxLat,
      minLat,
      maxLng,
      minLng,
      this.selectedFlight()?.flarmId,
      settings.gliderFilterOnMap !== GliderFilter.allAirplanes,
      settings.gliderFilterOnMap === GliderFilter.club
    );
  }

  private setMapTilesAccordingToSettings(settings: MapSettings) {
    // const source = settings.mapType === MapType.stamen
    //     ? new Stamen({ layer: 'terrain' })
    //     : new OSM();
    const source = new OSM();
    this.mapTileLayer.setSource(source);
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
        zoom: false
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
    if (this.selectedFlight()?.flarmId === flarmId) {
      return;
    }
    const previousSelectedFlight = this.selectedFlight();
    const flight = this.flights().find((x) => x.flarmId === flarmId);
    if (!flight) {
      console.warn(`Failed to select marker with flarmId ${flarmId} since it does not exist in list of flights`);
      return;
    }
    this.ognStore.selectFlight(flight);
    if (previousSelectedFlight) {
      // Update previous selected marker style to unselected
      this.updateSingleMarkerOnMap(previousSelectedFlight);
    }
    this.updateSingleMarkerOnMap(flight);
    this.ognStore.loadFlightHistory(flarmId);
  }

  // Removes focus from currently selected glider, clears flight path from map and closes info card and barogram
  unselectGlider(): void {
    if (!this.selectedFlight()) {
      return;
    }
    this.showBarogram.set(false);
    this.ognStore.selectFlight(null);
    this.updateSingleMarkerOnMap(this.selectedFlight() as Flight)
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

  private setupTimerForGliderPositionUpdates() {
    clearInterval(this.reloadIntervalId);
    this.reloadIntervalId = setInterval(() => {
      this.loadFlightsWithFilter(this.settings());
    }, getRefreshTimeout(this.settings().reduceDataUsage));
  }

  private initiallyLoadData() {
    //document.fonts.load('bold 26px Roboto').then(() => {
    this.loadFlightsWithFilter(this.settings());
    this.setupTimerForGliderPositionUpdates();
    //});
  }

  // private drawMarkerOnFlightPath(markerLocationUpdate: MarkerLocationUpdate) {
  //     this.flightPathMarkerLayer.getSource()?.clear();
  //     if (!markerLocationUpdate) return;

  //     const marker = new Feature({
  //         geometry: new Point(fromLonLat([markerLocationUpdate.longitude, markerLocationUpdate.latitude]))
  //     });
  //     marker.setStyle(new Style({
  //         image: new Icon({
  //             anchor: [0.5, 0.5],
  //             src: 'assets/glider.png',
  //             rotateWithView: false,
  //             rotation: markerLocationUpdate.rotation * (Math.PI / 180),
  //             scale: 0.15
  //         })
  //     }));
  //     this.flightPathMarkerLayer.getSource()?.addFeature(marker);
  // }

  private drawFlightPathFromHistory(historyEntries: HistoryEntry[]) {
    const settings = this.settings();
    // const entries = settings.onlyShowLastFlight
    //     ? this.flightAnalysationService.getHistorySinceLastTakeoff(historyEntries)
    //     : historyEntries;
    const entries = historyEntries;
    if (!historyEntries || !historyEntries?.length) {
      return;
    }

    const coords = entries.map(e => fromLonLat([e.longitude, e.latitude]));
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
    flights.forEach(flight => {
      this.updateSingleMarkerOnMap(flight);
    });
    this.removeObsoleteGliderMarkers(flights);
  }

  private async updateSingleMarkerOnMap(flight: Flight) {
    if (!flight?.longitude || !flight.latitude) return;

    const layer = this.getLayerByGliderType(flight.type);
    const source = layer.getSource();
    const existingFeature = source?.getFeatureById(flight.flarmId);

    const iconStyle = await this.gliderMarkerService.getGliderMarkerStyle(flight, this.settings(), this.selectedFlight()?.flarmId === flight.flarmId);

    if (existingFeature) {
      existingFeature.setGeometry(new Point(fromLonLat([flight.longitude, flight.latitude])));
      existingFeature.setStyle(iconStyle);
    } else {
      const feature = new Feature({
        geometry: new Point(fromLonLat([flight.longitude, flight.latitude]))
      });
      feature.setId(flight.flarmId);
      feature.setStyle(iconStyle);
      source?.addFeature(feature);
    }

    this.markerDictionary.set(flight.flarmId, {
      isSelected: this.selectedFlight()?.flarmId === flight.flarmId,
      opacity: this.gliderMarkerService.getMarkerOpacity(flight.timestamp),
      altitudeLayer: Math.floor(flight.heightMSL / 250)
    });
  }

  private removeObsoleteGliderMarkers(flights: Flight[]) {
    const allLayers = [this.clubGlidersLayer, this.privateGlidersLayer, this.foreignGlidersLayer];
    for (const layer of allLayers) {
      const source = layer.getSource();
      source?.getFeatures().forEach(f => {
        const id = f.getId();
        if (id && !flights.find(flight => flight.flarmId === id)) {
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
