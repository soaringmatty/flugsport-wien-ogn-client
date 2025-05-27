import { AircraftType } from "./aircraft-type";
import { GliderType } from "./glider-type";

export interface Flight {
  flarmId: string;
  displayName: string;
  registration: string;
  type: GliderType;
  aircraftType: AircraftType;
  model: string;
  latitude: number;
  longitude: number;
  heightMSL: number;
  heightAGL: number;
  timestamp: number;
  speed: number;
  vario: number;
  varioAverage: number;
}
