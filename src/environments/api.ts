import { environment } from "./environment";

export const api = {
    getFlights: environment.api + 'flights',
    getFlightHistory: environment.api + 'flights/{id}/history',
    getGliderList: environment.api + 'gliders/status?includePrivateGliders={pg}',
    getDepartureList: environment.api + 'flightbook/loxn?knownGlidersOnly={0}',
    getDepartureListGlidernet: environment.api + 'flightbook/loxn/glidernet?knownGlidersOnly={0}',
    searchAircraft: environment.api + 'flights/find/{0}',
}
