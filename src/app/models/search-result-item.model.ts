import { FlightStatus } from './flight-status';

export interface SearchResultItem {
  flarmId: string;
  registration: string;
  registrationShort: string;
  model: string;
  //type: GliderOwnership;
  //aircraftType: AircraftType;
  latitude: number;
  longitude: number;
  altitude: number;
  timestamp: string;
  flightStatus: FlightStatus;
  priority: number;
  matchRank: number;
}
