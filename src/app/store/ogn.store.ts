import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { Flight } from '../models/flight.model';
import { HistoryEntry } from '../models/history-entry.model';
import { MapSettings } from '../models/settings.model';
import { computed, inject, signal } from '@angular/core';
import { NotificationService } from '../services/notification.service';
import { ApiService } from '../services/api.service';
import { NotificationType } from '../models/notification-type';
import { messages } from '../constants/messages';
import {
  defaultDepartureListFilter,
  defaultSettings,
  SettingsService,
} from '../services/settings.service';
import { DepartureListItem } from '../models/departure-list-item.model';
import { SearchResultItem } from '../models/search-result-item.model';
import { MapTarget } from '../models/map-target.model';
import { FlightStatus } from '../models/flight-status';
import { GliderType } from '../models/glider-type';
import { AircraftType } from '../models/aircraft-type';
import { DepartureListFilter } from '../models/departure-list-filter.model';
import { FlightAnalysationService } from '../services/flight-analysation.service';

type OgnState = {
  flights: Flight[];
  selectedAircraft: string | null;
  selectedAircraftFlightData: Flight | null;
  flightHistory: HistoryEntry[];
  settings: MapSettings;
  departureList: DepartureListItem[];
  departureListFilter: DepartureListFilter;
  searchText: string;
  searchResult: SearchResultItem[];
  mapTarget: MapTarget | null;
  historicFlightTarget: { flarmId: string; start?: string; end?: string } | null;
};

const initialState: OgnState = {
  flights: [],
  selectedAircraft: null,
  selectedAircraftFlightData: null,
  flightHistory: [],
  settings: defaultSettings,
  departureList: [],
  departureListFilter: defaultDepartureListFilter,
  searchText: '',
  searchResult: [],
  mapTarget: null,
  historicFlightTarget: null,
};

export const OgnStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((state) => {
    const apiService = inject(ApiService);
    const settingsService = inject(SettingsService);
    const notificationService = inject(NotificationService);
    const flightAnalysationService = inject(FlightAnalysationService);

    return {
      loadFlights: async (
        maxLat: number,
        minLat: number,
        maxLng: number,
        minLng: number,
        selectedFlarmId?: string,
        glidersOnly?: boolean,
        clubGlidersOnly?: boolean,
      ) => {
        try {
          const flights = await apiService.getFlights(
            maxLat,
            minLat,
            maxLng,
            minLng,
            selectedFlarmId,
            glidersOnly,
            clubGlidersOnly,
          );

          const selected = state.selectedAircraftFlightData();
          const updatedSeletedFlight = flights.find((f) => f.flarmId === selectedFlarmId);
          const hasChanged =
            updatedSeletedFlight && updatedSeletedFlight.timestamp !== selected?.timestamp;

          const flightHistory = state.flightHistory();
          let updatedHistory = [...flightHistory];

          if (updatedSeletedFlight && hasChanged) {
            updatedHistory.push({
              timestamp: updatedSeletedFlight.timestamp,
              altitude: updatedSeletedFlight.heightMSL,
              latitude: updatedSeletedFlight.latitude,
              longitude: updatedSeletedFlight.longitude,
              speed: updatedSeletedFlight.speed,
              verticalSpeed: updatedSeletedFlight.vario,
            });
          }

          patchState(state, (current) => ({
            ...current,
            flights,
          }));
          // Do not update flight path and flight data if historicFlightTarget is set
          if (hasChanged && !state.historicFlightTarget()) {
            patchState(state, (current) => ({
              ...current,
              flightHistory: updatedSeletedFlight ? updatedHistory : current.flightHistory,
              selectedAircraftFlightData:
                updatedSeletedFlight || current.selectedAircraftFlightData,
            }));
          }
        } catch (error) {
          console.log(error);
          notificationService.notify({
            message: messages.defaultNetworkError,
            type: NotificationType.Error,
          });
        }
      },

      loadFlightHistory: async (
        flarmId: string,
        startTimestamp?: string,
        endTimestamp?: string,
      ) => {
        try {
          const history = await apiService.getFlightHistory(flarmId, startTimestamp, endTimestamp);
          let filteredHistory = state.settings.onlyShowLastFlight()
            ? flightAnalysationService.getHistorySinceLastTakeoff(history)
            : history;
          filteredHistory = state.settings.flightPathExcludeFaultySignals()
            ? flightAnalysationService.removeOutliers(filteredHistory)
            : filteredHistory;
          patchState(state, (current) => ({
            ...current,
            flightHistory: filteredHistory,
          }));
        } catch (error) {
          notificationService.notify({
            message: messages.defaultNetworkError,
            type: NotificationType.Error,
          });
        }
      },

      selectAircraft: (flarmId: string | null) => {
        if (flarmId) {
          patchState(state, (current) => ({
            ...current,
            selectedAircraft: flarmId,
          }));
        } else {
          patchState(state, (current) => ({
            ...current,
            selectedAircraft: initialState.selectedAircraft,
            selectedAircraftFlightData: state.historicFlightTarget()
              ? state.selectedAircraftFlightData()
              : initialState.selectedAircraftFlightData,
            flightHistory: initialState.flightHistory,
          }));
        }
      },

      setSelectedAircraftFlightData: (flightData: Flight | null) => {
        if (flightData) {
          patchState(state, (current) => ({
            ...current,
            selectedAircraftFlightData: flightData,
          }));
        }
      },

      saveSettings: (settings: MapSettings) => {
        settingsService.saveSettings(settings);
        patchState(state, (current) => ({
          ...current,
          settings,
        }));
      },

      loadSettings: () => {
        const loaded = settingsService.loadSettings();
        patchState(state, (current) => ({
          ...current,
          settings: loaded,
        }));
      },

      saveDepartureListFilter: (departureListFilter: DepartureListFilter) => {
        settingsService.saveDepartureListFilter(departureListFilter);
        patchState(state, (current) => ({
          ...current,
          departureListFilter,
        }));
      },

      loadDepartureListFilter: () => {
        const loaded = settingsService.loadDepartureListFilter();
        patchState(state, (current) => ({
          ...current,
          departureListFilter: loaded,
        }));
      },

      loadDepartureList: async () => {
        try {
          const departureList = await apiService.getDepartureList(state.departureListFilter());
          patchState(state, (current) => ({
            ...current,
            departureList,
          }));
        } catch (error) {
          notificationService.notify({
            message: messages.defaultNetworkError,
            type: NotificationType.Error,
          });
        }
      },

      searchAircraft: async (searchText: string) => {
        try {
          const searchResult = await apiService.searchAircraft(searchText);
          patchState(state, (current) => ({
            ...current,
            searchText,
            searchResult,
          }));
        } catch (error) {
          notificationService.notify({
            message: messages.defaultNetworkError,
            type: NotificationType.Error,
          });
        }
      },

      clearSearchResult: () => {
        patchState(state, (current) => ({
          ...current,
          searchText: initialState.searchText,
          searchResult: initialState.searchResult,
        }));
      },

      setMapTarget(flarmId: string, lat: number, lng: number, flightStatus: FlightStatus): void {
        patchState(state, (current) => ({
          ...current,
          mapTarget: { flarmId, lat, lng, flightStatus },
        }));
      },

      loadAndSetMapTarget: async (flarmId: string) => {
        try {
          const searchResult = await apiService.searchAircraft(flarmId);
          if (searchResult && searchResult.length > 0) {
            var aircraft = searchResult[0];
            patchState(state, (current) => ({
              ...current,
              mapTarget: {
                flarmId: aircraft.flarmId,
                lat: aircraft.latitude,
                lng: aircraft.longitude,
                flightStatus: aircraft.flightStatus,
              },
            }));
          }
        } catch (error) {
          notificationService.notify({
            message: messages.defaultNetworkError,
            type: NotificationType.Error,
          });
        }
      },

      clearMapTarget(): void {
        patchState(state, (current) => ({
          ...current,
          mapTarget: initialState.mapTarget,
        }));
      },

      setHistoricFlightTarget(departureListItem: DepartureListItem): void {
        patchState(state, (current) => ({
          ...current,
          historicFlightTarget: {
            flarmId: departureListItem.flarmId,
            start: departureListItem.departureTimestamp,
            end: departureListItem.landingTimestamp,
          },
          selectedAircraftFlightData: {
            flarmId: departureListItem.flarmId,
            displayName: departureListItem.registrationShort,
            registration: departureListItem.registration,
            // Irrelevant placeholder values -> its not displayed
            type: GliderType.foreign,
            aircraftType: AircraftType.unknown,
            model: '',
            latitude: 0,
            longitude: 0,
            heightMSL: 0,
            timestamp: '',
            speed: 0,
            vario: 0,
            varioAverage: 0,
          },
        }));
      },

      clearHistoricFlightTarget(): void {
        patchState(state, (current) => ({
          ...current,
          historicFlightTarget: initialState.historicFlightTarget,
          selectedAircraftFlightData: initialState.selectedAircraftFlightData,
        }));
      },
    };
  }),
);
