import { LaunchType } from "./launch-type";

export interface DepartureListItem {
  flarmId: string;
  registration: string;
  registrationShort: string;
  model: string;
  departureTimestamp?: string;
  landingTimestamp?: string;
  launchType: LaunchType;
  launchHeight?: number;
}
