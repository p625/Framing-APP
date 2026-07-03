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

export const DEFAULT_CROP_SETTINGS: CropSettings = {
  crop: { x: 0, y: 0 },
  zoom: 1,
  croppedAreaPixels: null,
};
