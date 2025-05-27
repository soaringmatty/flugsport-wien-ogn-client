import { environment } from "./environment";

export const api = {
    getFlights: environment.api + 'flights',
    getFlightHistory: environment.api + 'flights/{id}/history',
    getGliderList: environment.api + 'gliders/status?includePrivateGliders={pg}',
    getDepartureList: environment.api + 'flightbook/loxn?includePrivateGliders={pg}',
}
