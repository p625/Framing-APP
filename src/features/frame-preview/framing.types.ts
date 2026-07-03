export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CropSettings {
  crop: { x: number; y: number };
  zoom: number;
  croppedAreaPixels: CropRect | null;
}

export interface CanvasSize {
  widthCm: number;
  heightCm: number;
}

export interface FrameDefinition {
  id: string;
  name: string;
  textureUrl?: string;
  fallbackColor: string;
}

export const TEXTURE_SCALE_PRESETS = {
  small: 0.5,
  medium: 1,
  large: 2,
} as const;

export type TextureScalePreset = keyof typeof TEXTURE_SCALE_PRESETS;

export interface FramingState {
  artworkFile: File | null;
  artworkPreviewUrl: string | null;
  artworkImageUrl: string | null;
  cropSettings: CropSettings;
  croppedArtworkUrl: string | null;
  canvasSize: CanvasSize;
  selectedFrameId: string | null;
  customFrameTextureUrl: string | null;
  customFrameFile: File | null;
  frameWidthCm: number;
  textureScale: number;
}

export interface FramingActions {
  setArtworkFile: (file: File | null) => void;
  setCropSettings: (settings: Partial<CropSettings>) => void;
  applyCrop: () => Promise<void>;
  resetCrop: () => void;
  setCanvasSize: (size: Partial<CanvasSize>) => void;
  setSelectedFrameId: (id: string | null) => void;
  setCustomFrameFile: (file: File | null) => void;
  setFrameWidthCm: (width: number) => void;
  setTextureScale: (scale: number) => void;
}

export type UseFramingStateReturn = FramingState & FramingActions;

export interface FramedLayout {
  offsetX: number;
  offsetY: number;
  totalPxW: number;
  totalPxH: number;
  artworkPxW: number;
  artworkPxH: number;
  framePxH: number;
  framePxV: number;
  artX: number;
  artY: number;
}

export interface Point {
  x: number;
  y: number;
}

export const DEFAULT_CROP_SETTINGS: CropSettings = {
  crop: { x: 0, y: 0 },
  zoom: 1,
  croppedAreaPixels: null,
};

export const DEFAULT_TEXTURE_SCALE = TEXTURE_SCALE_PRESETS.medium;
