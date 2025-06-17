import { FlightStatus } from './flight-status';

export interface MapTarget {
  flarmId: string;
  lat: number;
  lng: number;
  flightStatus: FlightStatus;
}
