import { Injectable } from '@angular/core';
import { HistoryEntry } from '../models/history-entry.model';

@Injectable({
  providedIn: 'root',
})
export class FlightAnalysationService {
  private readonly takeoffSpeedThreshold = 50; // km/h
  private readonly maxAllowedDistance = 2000; // m
  private readonly maxAllowedAltitudeJump = 300; // m
  private readonly maxDeltaTimeSec = 20; // s

  getHistorySinceLastTakeoff(historyEntries: HistoryEntry[]): HistoryEntry[] {
    if (!historyEntries || historyEntries.length < 4) return historyEntries;

    for (let i = historyEntries.length - 4; i >= 0; i--) {
      const e1 = historyEntries[i];
      const e2 = historyEntries[i + 1];
      const e3 = historyEntries[i + 2];
      const e4 = historyEntries[i + 3];

      const isTakeoff =
        e1.speed < this.takeoffSpeedThreshold &&
        e2.speed < this.takeoffSpeedThreshold &&
        e3.speed >= this.takeoffSpeedThreshold &&
        e4.speed >= this.takeoffSpeedThreshold;

      if (isTakeoff) {
        const filteredHistory = historyEntries.slice(i);
        console.log('filtered', filteredHistory.length);
        return filteredHistory;
      }
    }
    return historyEntries;
  }

  public removeOutliers(entries: HistoryEntry[]): HistoryEntry[] {
    if (entries.length < 3) return entries;

    const filtered: HistoryEntry[] = [entries[0]];

    for (let i = 1; i < entries.length - 1; i++) {
      const prev = entries[i - 1];
      const curr = entries[i];
      const next = entries[i + 1];

      const dtPrev =
        Math.abs(new Date(curr.timestamp).getTime() - new Date(prev.timestamp).getTime()) / 1000;

      const dtNext =
        Math.abs(new Date(next.timestamp).getTime() - new Date(curr.timestamp).getTime()) / 1000;

      const distPrev = this.getDistance(curr, prev);
      const distNext = this.getDistance(curr, next);

      const altDiffPrev = Math.abs(curr.altitude - prev.altitude);
      const altDiffNext = Math.abs(curr.altitude - next.altitude);

      const isSpike =
        dtPrev < this.maxDeltaTimeSec &&
        dtNext < this.maxDeltaTimeSec &&
        distPrev > this.maxAllowedDistance &&
        distNext > this.maxAllowedDistance &&
        altDiffPrev > this.maxAllowedAltitudeJump &&
        altDiffNext > this.maxAllowedAltitudeJump;

      if (!isSpike) {
        filtered.push(curr);
      }
    }

    filtered.push(entries[entries.length - 1]);
    return filtered;
  }

  private getDistance(a: HistoryEntry, b: HistoryEntry): number {
    const R = 6371000; // Earth radius in meters
    const toRad = (deg: number) => (deg * Math.PI) / 180;

    const lat1 = toRad(a.latitude);
    const lon1 = toRad(a.longitude);
    const lat2 = toRad(b.latitude);
    const lon2 = toRad(b.longitude);

    const dLat = lat2 - lat1;
    const dLon = lon2 - lon1;

    const sinDLat = Math.sin(dLat / 2);
    const sinDLon = Math.sin(dLon / 2);

    const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;

    const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
    return R * c;
  }
}
