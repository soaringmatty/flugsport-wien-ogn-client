export interface HistoryEntry {
    timestamp: string | number, // TODO komplett auf string umstellen
    latitude: number,
    longitude: number,
    altitude: number,
    speed: number,
    verticalSpeed: number
}