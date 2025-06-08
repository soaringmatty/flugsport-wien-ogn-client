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


type OgnState = {
    flights: Flight[];
    selectedFlight: Flight | null;
    flightHistory: HistoryEntry[];
    settings: MapSettings;
    //gliderList: GliderListItem[];
    departureList: DepartureListItem[];
    searchResult: SearchResultItem[];
};

const initialState: OgnState = {
    flights: [],
    selectedFlight: null,
    flightHistory: [],
    settings: defaultSettings,
    //gliderList: [],
    departureList: [],
    searchResult: [],
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

                    const selected = state.selectedFlight();
                    const updatedSeletedFlight = flights.find(f => f.flarmId === selected?.flarmId);
                    const hasChanged = updatedSeletedFlight && updatedSeletedFlight.timestamp !== selected?.timestamp;

                    const flightHistory = state.flightHistory();
                    let updatedHistory = [...flightHistory];

                    if (updatedSeletedFlight && hasChanged) {
                        updatedHistory.push({
                            timestamp: updatedSeletedFlight.timestamp,
                            altitude: updatedSeletedFlight.heightMSL,
                            latitude: updatedSeletedFlight.latitude,
                            longitude: updatedSeletedFlight.longitude,
                            groundHeight: updatedSeletedFlight.heightMSL - updatedSeletedFlight.heightAGL
                        });
                    }

                    patchState(state, current => ({
                        ...current,
                        flights,
                        selectedFlight: updatedSeletedFlight || current.selectedFlight,
                        flightHistory: updatedSeletedFlight ? updatedHistory : current.flightHistory
                    }));
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

            selectFlight: (flight: Flight | null) => {
                if (flight) {
                    patchState(state, current => ({
                        ...current,
                        selectedFlight: flight,
                    }));
                }
                else {
                    patchState(state, current => ({
                        ...current,
                        selectedFlight: initialState.selectedFlight,
                        flightHistory: initialState.flightHistory
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
                    const departureList = await apiService.getDepartureList(knownGlidersOnly);
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
                    searchResult: initialState.searchResult
                }));
            },
        };
    })
);