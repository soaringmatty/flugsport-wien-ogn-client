import { patchState, signalStore, withMethods, withState } from "@ngrx/signals";
import { Flight } from "../models/flight.model";
import { HistoryEntry } from "../models/history-entry.model";
import { MapSettings } from "../models/settings.model";
import { computed, inject, signal } from "@angular/core";
import { NotificationService } from "../services/notification.service";
import { ApiService } from "../services/api.service";
import { NotificationType } from "../models/notification-type";
import { messages } from "../constants/messages";
import { defaultSettings, SettingsService } from "../services/settings.service";
import { DepartureListItem } from "../models/departure-list-item.model";
import { SearchResultItem } from "../models/search-result-item.model";
import { MapTarget } from "../models/map-target.model";
import { FlightStatus } from "../models/flight-status";


type OgnState = {
    flights: Flight[];
    selectedAircraft: string | null;
    selectedAircraftFlightData: Flight | null;
    flightHistory: HistoryEntry[];
    settings: MapSettings;
    //gliderList: GliderListItem[];
    departureList: DepartureListItem[];
    searchText: string;
    searchResult: SearchResultItem[];
    mapTarget: MapTarget | null;
};

const initialState: OgnState = {
    flights: [],
    selectedAircraft: null,
    selectedAircraftFlightData: null,
    flightHistory: [],
    settings: defaultSettings,
    //gliderList: [],
    departureList: [],
    searchText: '',
    searchResult: [],
    mapTarget: null,
};

export const OgnStore = signalStore(
    { providedIn: 'root' },
    withState(initialState),
    withMethods(state => {
        const apiService = inject(ApiService);
        const settingsService = inject(SettingsService);
        const notificationService = inject(NotificationService);

        // const filteredFlights = computed(() => {
        //   let list = state.flights();

        //   switch (state.settings().gliderFilterOnMap) {
        //     case GliderFilter.club:
        //       list = list.filter(f => clubGliders.some(g => g.FlarmId === f.flarmId));
        //       break;
        //     case GliderFilter.clubAndprivate:
        //       const club = list.filter(f => clubGliders.some(g => g.FlarmId === f.flarmId));
        //       const priv = list.filter(f => privateGliders.some(g => g.FlarmId === f.flarmId));
        //       list = [...club, ...priv];
        //       break;
        //   }

        //   if (state.settings().hideGlidersOnGround) {
        //     list = list.filter(f => f.speed > 10 && f.heightAGL > 10);
        //   }

        //   return list;
        // });

        return {
            //filteredFlights,

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
                        maxLat, minLat, maxLng, minLng,
                        selectedFlarmId, glidersOnly, clubGlidersOnly
                    );

                    const selected = state.selectedAircraftFlightData();
                    const updatedSeletedFlight = flights.find(f => f.flarmId === selectedFlarmId);
                    const hasChanged = updatedSeletedFlight && updatedSeletedFlight.timestamp !== selected?.timestamp;

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

                    patchState(state, current => ({
                        ...current,
                        flights,
                        selectedAircraftFlightData: updatedSeletedFlight || current.selectedAircraftFlightData,
                    }));
                    if (hasChanged) {
                        patchState(state, current => ({
                            ...current,
                            flightHistory: updatedSeletedFlight ? updatedHistory : current.flightHistory
                        }));
                    };
                } catch (error) {
                    console.log(error);
                    notificationService.notify({
                        message: messages.defaultNetworkError,
                        type: NotificationType.Error
                    });
                }
            },

            loadFlightHistory: async (flarmId: string) => {
                try {
                    const history = await apiService.getFlightHistory(flarmId);
                    patchState(state, current => ({
                        ...current,
                        flightHistory: history
                    }));
                } catch (error) {
                    notificationService.notify({
                        message: messages.defaultNetworkError,
                        type: NotificationType.Error
                    });
                }
            },

            selectAircraft: (flarmId: string | null) => {
                if (flarmId) {
                    patchState(state, current => ({
                        ...current,
                        selectedAircraft: flarmId,
                    }));
                }
                else {
                    patchState(state, current => ({
                        ...current,
                        selectedAircraft: initialState.selectedAircraft,
                        selectedAircraftFlightData: initialState.selectedAircraftFlightData,
                        flightHistory: initialState.flightHistory
                    }));
                }
            },

            setSelectedAircraftFlightData: (flightData: Flight | null) => {
                if (flightData) {
                    patchState(state, current => ({
                        ...current,
                        selectedAircraftFlightData: flightData,
                    }));
                }
            },

            saveSettings: (settings: MapSettings) => {
                settingsService.saveSettings(settings);
                patchState(state, current => ({
                    ...current,
                    settings
                }));
            },

            loadSettings: () => {
                const loaded = settingsService.loadSettings();
                patchState(state, current => ({
                    ...current,
                    settings: loaded
                }));
            },

            //   loadGliderList: (includePrivate: boolean) => {
            //     api.getGliderList(includePrivate).subscribe({
            //       next: list => state.gliderList.set(list),
            //       error: () => {
            //         notify.notify({ message: messages.defaultNetworkError, type: NotificationType.Error });
            //       },
            //     });
            //   },

            loadDepartureList: async (knownGlidersOnly: boolean) => {
                try {
                    const departureList = await apiService.getDepartureList(knownGlidersOnly, state.settings().useNewDepartureList);
                    patchState(state, current => ({
                        ...current,
                        departureList
                    }));
                } catch (error) {
                    notificationService.notify({
                        message: messages.defaultNetworkError,
                        type: NotificationType.Error
                    });
                }
            },

            searchAircraft: async (searchText: string) => {
                try {
                    const searchResult = await apiService.searchAircraft(searchText);
                    patchState(state, current => ({
                        ...current,
                        searchText,
                        searchResult
                    }));
                } catch (error) {
                    notificationService.notify({
                        message: messages.defaultNetworkError,
                        type: NotificationType.Error
                    });
                }
            },

            clearSearchResult: () => {
                patchState(state, current => ({
                    ...current,
                    searchText: initialState.searchText,
                    searchResult: initialState.searchResult
                }));
            },

            setMapTarget(flarmId: string, lat: number, lng: number, flightStatus: FlightStatus): void {
                patchState(state, current => ({
                    ...current,
                    mapTarget: { flarmId, lat, lng, flightStatus }
                }));
            },

            loadAndSetMapTarget: async (flarmId: string) => {
                try {
                    const searchResult = await apiService.searchAircraft(flarmId);
                    if (searchResult && searchResult.length > 0) {
                        var aircraft = searchResult[0];
                        patchState(state, current => ({
                            ...current,
                            mapTarget: {
                                flarmId: aircraft.flarmId,
                                lat: aircraft.latitude,
                                lng: aircraft.longitude,
                                flightStatus: aircraft.flightStatus
                            }
                        }));
                    }
                } catch (error) {
                    notificationService.notify({
                        message: messages.defaultNetworkError,
                        type: NotificationType.Error
                    });
                }
            },

            clearMapTarget(): void {
                patchState(state, current => ({
                    ...current,
                    mapTarget: initialState.mapTarget
                }));
            }
        };
    })
);