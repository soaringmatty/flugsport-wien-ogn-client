import { LaunchType } from "./launch-type";

export interface DepartureListItem {
  flarmId: string;
  registration: string;
  registrationShort: string;
  model: string;
  departureTimestamp?: number;
  landingTimestamp?: number;
  launchType: LaunchType;
  launchHeight?: number;
}
