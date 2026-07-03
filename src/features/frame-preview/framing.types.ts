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
  lockToArtworkRatio: boolean;
}

export interface CanvasSize {
  widthCm: number;
  heightCm: number;
}

export interface MatSettings {
  enabled: boolean;
  color: string;
  widthCm: number;
}

export type FrameSampleMode = "texture" | "corner";

export interface FrameDefinition {
  id: string;
  name: string;
  textureUrl?: string;
  fallbackColor: string;
  sampleMode?: FrameSampleMode;
}

export interface PerspectiveCorners {
  topLeft: { x: number; y: number };
  topRight: { x: number; y: number };
  bottomRight: { x: number; y: number };
  bottomLeft: { x: number; y: number };
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
  correctedArtworkUrl: string | null;
  artworkImageUrl: string | null;
  perspectiveCorners: PerspectiveCorners;
  cropSettings: CropSettings;
  croppedArtworkUrl: string | null;
  canvasSize: CanvasSize;
  selectedFrameId: string | null;
  customFrameTextureUrl: string | null;
  customFrameFile: File | null;
  frameSampleMode: FrameSampleMode;
  frameWidthCm: number;
  textureScale: number;
  matSettings: MatSettings;
}

export interface FramingActions {
  setArtworkFile: (file: File | null) => void;
  setPerspectiveCorners: (corners: PerspectiveCorners) => void;
  straightenArtwork: () => Promise<void>;
  resetPerspective: () => void;
  setCropSettings: (settings: Partial<CropSettings>) => void;
  applyCrop: () => Promise<void>;
  resetCrop: () => void;
  setCanvasSize: (size: Partial<CanvasSize>) => void;
  setSelectedFrameId: (id: string | null) => void;
  setCustomFrameFile: (file: File | null) => void;
  setFrameSampleMode: (mode: FrameSampleMode) => void;
  setFrameWidthCm: (width: number) => void;
  setTextureScale: (scale: number) => void;
  setMatSettings: (settings: Partial<MatSettings>) => void;
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
  matEnabled: boolean;
  matColor: string;
  matX: number;
  matY: number;
  matOuterPxW: number;
  matOuterPxH: number;
  matPxH: number;
  matPxV: number;
}

export interface Point {
  x: number;
  y: number;
}

export const DEFAULT_CROP_SETTINGS: CropSettings = {
  crop: { x: 0, y: 0 },
  zoom: 1,
  croppedAreaPixels: null,
  lockToArtworkRatio: false,
};

export const DEFAULT_TEXTURE_SCALE = TEXTURE_SCALE_PRESETS.medium;

export const DEFAULT_MAT_SETTINGS: MatSettings = {
  enabled: false,
  color: "#f5f0e8",
  widthCm: 5,
};

export const DEFAULT_PERSPECTIVE_CORNERS: PerspectiveCorners = {
  topLeft: { x: 0.08, y: 0.08 },
  topRight: { x: 0.92, y: 0.08 },
  bottomRight: { x: 0.92, y: 0.92 },
  bottomLeft: { x: 0.08, y: 0.92 },
};

export const MAT_COLOR_PRESETS = [
  { label: "Ivory", value: "#f5f0e8" },
  { label: "White", value: "#ffffff" },
  { label: "Black", value: "#1a1a1a" },
  { label: "Cream", value: "#efe6d4" },
] as const;
