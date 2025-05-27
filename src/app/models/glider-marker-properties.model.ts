import { GliderType } from "./glider-type";

export interface GliderMarkerProperties {
  isSelected: boolean;
  gliderType?: GliderType;
  opacity?: number;
  altitudeLayer: number;
}