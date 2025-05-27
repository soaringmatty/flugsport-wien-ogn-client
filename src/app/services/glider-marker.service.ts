import { Injectable } from '@angular/core';
import Style from 'ol/style/Style';
import Stroke from 'ol/style/Stroke';
import Icon from 'ol/style/Icon';
import { Flight } from '../models/flight.model';
import { MapSettings } from '../models/settings.model';
import { GliderType } from '../models/glider-type';
import { MarkerColorScheme } from '../models/marker-color-scheme';
import { AircraftType } from '../models/aircraft-type';

const flightPathStrokeWhite = '#FFFFFFA0';
const flightPathDarkRed = '#8B0000';

@Injectable({ providedIn: 'root' })
export class GliderMarkerService {
  private markerCache = new Map<string, HTMLCanvasElement>();

  readonly flightPathStrokeStyle = new Style({
    stroke: new Stroke({ color: flightPathStrokeWhite, width: 6 })
  });

  readonly flightPathStyle = new Style({
    stroke: new Stroke({ color: flightPathDarkRed, width: 2 })
  });

  async getGliderMarkerStyle(flight: Flight, settings: MapSettings, isSelected: boolean = false): Promise<Style> {
    const { displayName, type, aircraftType, heightMSL, timestamp } = flight;
    const markerKey = `${displayName}-${isSelected}-${settings.markerColorScheme}-${type}-${aircraftType}-${heightMSL}`;

    let canvas = this.markerCache.get(markerKey);
    if (!canvas) {
      canvas = await this.createLabelledGliderMarker(displayName, settings, isSelected, type, aircraftType, heightMSL, timestamp);
      this.markerCache.set(markerKey, canvas);
    }

    return new Style({
      image: new Icon({
        anchor: [0.5, 1],
        anchorXUnits: 'fraction',
        anchorYUnits: 'fraction',
        scale: 0.38,
        img: canvas,
        //imgSize: [88, 88]
      })
    });
  }

  getMarkerOpacity(lastUpdateTimestamp: number): number {
    const minutes = (Date.now() - lastUpdateTimestamp) / 60000;
    if (minutes > 20) return 0.4;
    if (minutes > 10) return 0.6;
    if (minutes > 3) return 0.8;
    return 1;
  }

  private resolveMarkerAppearance(
    settings: MapSettings,
    isSelected: boolean,
    gliderType: GliderType,
    aircraftType: AircraftType,
    altitude: number
  ): { imageSrc: string; textColor: string } {
    if (isSelected) {
      return { imageSrc: 'assets/marker_white.png', textColor: 'black' };
    }

    if (settings.markerColorScheme === MarkerColorScheme.highlightKnownGliders) {
      if (gliderType === GliderType.foreign) return { imageSrc: 'assets/marker_grey.png', textColor: 'white' };
      if (gliderType === GliderType.private) return { imageSrc: 'assets/marker_beige.png', textColor: 'black' };
      if (gliderType === GliderType.club && [AircraftType.towplane, AircraftType.motorplane].includes(aircraftType)) {
        return { imageSrc: 'assets/marker_red.png', textColor: 'white' };
      }
    }

    if (settings.markerColorScheme === MarkerColorScheme.aircraftType) {
      switch (aircraftType) {
        case AircraftType.glider: return { imageSrc: 'assets/marker_beige.png', textColor: 'black' };
        case AircraftType.towplane:
        case AircraftType.motorplane: return { imageSrc: 'assets/marker_blue.png', textColor: 'white' };
        case AircraftType.hangOrParaglider: return { imageSrc: 'assets/marker_red.png', textColor: 'white' };
        case AircraftType.helicopter: return { imageSrc: 'assets/marker_green.png', textColor: 'white' };
        case AircraftType.unknown: return { imageSrc: 'assets/marker_grey.png', textColor: 'white' };
      }
    }

    if (settings.markerColorScheme === MarkerColorScheme.altitude) {
      const thresholds = [500, 750, 1000, 1250, 1500, 1750, 2000, 2250, 2500, 2750, 3000];
      for (const t of thresholds) {
        if (altitude < t) {
          const label = `marker_height_${t}.png`;
          const darkText = t >= 1000 && t <= 2500;
          return { imageSrc: `assets/${label}`, textColor: darkText ? 'black' : 'white' };
        }
      }
      return { imageSrc: 'assets/marker_height_3500.png', textColor: 'white' };
    }

    return { imageSrc: 'assets/marker_blue.png', textColor: 'white' }; // default fallback
  }

  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = src;
    });
  }

  private async createLabelledGliderMarker(
    label: string,
    settings: MapSettings,
    isSelected: boolean,
    gliderType: GliderType,
    aircraftType: AircraftType,
    altitude: number,
    lastUpdateTimestamp: number
  ): Promise<HTMLCanvasElement> {
    const { imageSrc, textColor } = this.resolveMarkerAppearance(settings, isSelected, gliderType, aircraftType, altitude);
    const image = await this.loadImage(imageSrc);

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) throw new Error('Canvas context not available');

    const opacity = this.getMarkerOpacity(lastUpdateTimestamp);
    canvas.width = image.width;
    canvas.height = image.height;

    context.globalAlpha = opacity;
    context.drawImage(image, 0, 0);

    context.globalAlpha = 1;
    //context.font = 'bold 26px Roboto';
    const computedFont = getComputedStyle(document.body).fontFamily;
    context.font = `bold 26px ${computedFont}`;
    context.fillStyle = textColor;
    const textWidth = context.measureText(label).width;
    const x = (image.width - textWidth) / 2;
    const y = image.height / 2;
    context.fillText(label, x, y);

    return canvas;
  }
}
