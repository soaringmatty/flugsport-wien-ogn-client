export interface DepartureListItem {
  flarmId: string;
  registration: string;
  registrationShort: string;
  model: string;
  departureTimestamp?: number;
  landingTimestamp?: number;
  launchType: 'winch' | 'aerotow' | 'motorized' | 'unknown';
  launchHeight?: number;
}
