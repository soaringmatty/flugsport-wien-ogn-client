import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom, map, Observable } from 'rxjs';
import { Flight } from '../models/flight.model';
import { api } from '../../environments/api';
import { HistoryEntry } from '../models/history-entry.model';

@Injectable({
  providedIn: 'root'
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
    clubGlidersOnly?: boolean
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

    return await firstValueFrom(
      this.http.get<Flight[]>(api.getFlights, { params })
    );
  }

  async getFlightHistory(flarmId: string): Promise<HistoryEntry[]> {
    const url = api.getFlightHistory.replace('{id}', flarmId);
    const response = await firstValueFrom(this.http.get<number[][]>(url));
    return response.map(([timestamp, , lat, lng, alt, ground]) => ({
      timestamp,
      latitude: lat,
      longitude: lng,
      altitude: alt,
      groundHeight: ground,
    }));
  }

  // getFlightHistory(flarmId: string): Observable<HistoryEntry[]> {
  //   const url = api.getFlightHistory.replace('{id}', flarmId)
  //   return this.http.get<number[][]>(url).pipe(
  //     map(response => response.map(rawEntry => {
  //       const historyEntry: HistoryEntry = {
  //         timestamp: rawEntry[0],
  //         latitude: rawEntry[2],
  //         longitude: rawEntry[3],
  //         altitude: rawEntry[4],
  //         groundHeight: rawEntry[5]
  //       }
  //       return historyEntry;
  //     }))
  //   );

  // getGliderList(includePrivateGliders: boolean = true): Observable<GliderListItem[]> {
  //   const url = api.getGliderList.replace('{pg}', includePrivateGliders.toString())
  //   return this.http.get<GliderListItem[]>(url);
  // }

  // getDepartureList(includePrivateGliders: boolean = true): Observable<DepartureListItem[]> {
  //   const url = api.getDepartureList.replace('{pg}', includePrivateGliders.toString())
  //   return this.http.get<DepartureListItem[]>(url);
  // }
}
