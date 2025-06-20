import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom, map, Observable } from 'rxjs';
import { Flight } from '../models/flight.model';
import { api } from '../../environments/api';
import { HistoryEntry } from '../models/history-entry.model';
import { DepartureListItem } from '../models/departure-list-item.model';
import { SearchResultItem } from '../models/search-result-item.model';
import { DepartureListFilter } from '../models/departure-list-filter.model';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly http = inject(HttpClient);

  async getFlights(
    maxLat: number,
    minLat: number,
    maxLng: number,
    minLng: number,
    selectedFlarmId?: string,
    glidersOnly?: boolean,
    clubGlidersOnly?: boolean,
  ): Promise<Flight[]> {
    let params = new HttpParams()
      .set('maxLat', maxLat.toString())
      .set('minLat', minLat.toString())
      .set('maxLng', maxLng.toString())
      .set('minLng', minLng.toString());

    if (selectedFlarmId) {
      params = params.set('selectedFlarmId', selectedFlarmId);
    }
    if (glidersOnly) {
      params = params.set('glidersOnly', glidersOnly.toString());
    }
    if (clubGlidersOnly) {
      params = params.set('clubGlidersOnly', clubGlidersOnly.toString());
    }

    return await firstValueFrom(this.http.get<Flight[]>(api.getFlights, { params }));
  }

  async getFlightHistory(
    flarmId: string,
    startTimestamp?: string,
    endTimestamp?: string,
  ): Promise<HistoryEntry[]> {
    const url = api.getFlightHistory.replace('{id}', flarmId);
    let params = new HttpParams();
    if (startTimestamp) {
      params = params.append('startTimestamp', startTimestamp);
    }
    if (endTimestamp) {
      params = params.append('endTimestamp', endTimestamp);
    }
    const response = await firstValueFrom(this.http.get<number[][]>(url, { params }));
    return response.map(([timestamp, lat, lng, alt, speed, vario]) => ({
      timestamp,
      latitude: lat,
      longitude: lng,
      altitude: alt,
      speed,
      verticalSpeed: vario,
    }));
  }

  async getFlightHistoryJson(flarmId: string): Promise<HistoryEntry[]> {
    const url = api.getFlightHistory.replace('{id}', flarmId);
    const response = await firstValueFrom(this.http.get<HistoryEntry[]>(url));
    return response;
  }

  async getDepartureList(filter: DepartureListFilter): Promise<DepartureListItem[]> {
    let params = new HttpParams();
    if (filter.knownGlidersOnly) {
      params = params.set('knownGlidersOnly', 'true');
    }
    if (!filter.includeLaunchTypeWinch) {
      params = params.set('includeLaunchTypeWinch', 'false');
    }
    if (!filter.includeLaunchTypeAerotow) {
      params = params.set('includeLaunchTypeAerotow', 'false');
    }
    if (!filter.includeLaunchTypeMotorized) {
      params = params.set('includeLaunchTypeMotorized', 'false');
    }
    if (!filter.includeLaunchTypeUnknown) {
      params = params.set('includeLaunchTypeUnknown', 'false');
    }
    if (filter.flarmId) {
      params = params.set('flarmId', filter.flarmId);
    }
    if (filter.towPlaneFlarmId) {
      params = params.set('towPlaneFlarmId', filter.towPlaneFlarmId);
    }
    const request = this.http.get<DepartureListItem[]>(api.getDepartureList, { params });
    return await firstValueFrom(request);
  }

  async searchAircraft(searchText: string): Promise<SearchResultItem[]> {
    const url = api.searchAircraft.replace('{0}', searchText);
    const params = new HttpParams().append('take', 21); // 21 so that we know if there are more elements because UI only renders 20
    const request = this.http.get<SearchResultItem[]>(url, { params });
    return await firstValueFrom(request);
  }
}
