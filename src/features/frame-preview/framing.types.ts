export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
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
  cropRect: CropRect | null;
  canvasSize: CanvasSize;
  selectedFrameId: string | null;
  customFrameTextureUrl: string | null;
  customFrameFile: File | null;
  frameWidthCm: number;
}

export interface FramingActions {
  setArtworkFile: (file: File | null) => void;
  setCropRect: (rect: CropRect | null) => void;
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
