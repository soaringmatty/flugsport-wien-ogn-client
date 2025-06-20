export interface DepartureListFilter {
  knownGlidersOnly: boolean;
  includeLaunchTypeWinch: boolean;
  includeLaunchTypeAerotow: boolean;
  includeLaunchTypeMotorized: boolean;
  includeLaunchTypeUnknown: boolean;
  flarmId?: string | null;
  towPlaneFlarmId?: string | null;
  utcTimestamps: boolean;
}
