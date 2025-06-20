import { Injectable } from '@angular/core';
import { HistoryEntry } from '../models/history-entry.model';

@Injectable({
  providedIn: 'root',
})
export class FlightAnalysationService {
  private readonly takeoffSpeedThreshold = 50; // km/h

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
}
