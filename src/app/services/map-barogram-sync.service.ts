import { EventEmitter, Injectable } from '@angular/core';
import { HistoryEntry } from '../models/history-entry.model';

export interface MarkerLocationUpdate {
  longitude: number;
  latitude: number;
  rotation: number;
}

@Injectable({
  providedIn: 'root',
})
export class MapBarogramSyncService {
  markerLocationUpdateRequested: EventEmitter<MarkerLocationUpdate> = new EventEmitter();

  calculateRotation(current: HistoryEntry, previous?: HistoryEntry, next?: HistoryEntry): number {
    let dx: number;
    let dy: number;

    if (next && previous) {
      dx = next.longitude - previous.longitude;
      dy = next.latitude - previous.latitude;
    } else if (next) {
      dx = next.longitude - current.longitude;
      dy = next.latitude - current.latitude;
    } else if (previous) {
      dx = current.longitude - previous.longitude;
      dy = current.latitude - previous.latitude;
    } else {
      return 0;
    }

    let angleRad = Math.atan2(dx, dy);
    let angleDeg = angleRad * (180 / Math.PI);
    if (angleDeg < 0) {
      angleDeg += 360;
    }
    return angleDeg;
  }
}
