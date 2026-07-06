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
  cropEditorKey: number;
  canvasSize: CanvasSize;
  lockCanvasAspectRatio: boolean;
  artworkAspectRatio: number | null;
  selectedFrameId: string | null;
  customFrameTextureUrl: string | null;
  customFrameOriginalUrl: string | null;
  correctedCustomFrameUrl: string | null;
  customFrameFile: File | null;
  frameSamplePerspectiveCorners: PerspectiveCorners;
  frameSampleMode: FrameSampleMode;
  frameCornerCalibration: FrameCornerCalibration | null;
  frameWidthCm: number;
  textureScale: number;
  matSettings: MatSettings;
  customFrameFallbackColor: string | null;
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
  setLockCanvasAspectRatio: (locked: boolean) => void;
  setSelectedFrameId: (id: string | null) => void;
  setCustomFrameFile: (file: File | null) => void;
  setFrameSamplePerspectiveCorners: (corners: PerspectiveCorners) => void;
  straightenCustomFrame: () => Promise<void>;
  resetCustomFramePerspective: () => void;
  setFrameSampleMode: (mode: FrameSampleMode) => void;
  setFrameCornerCalibration: (calibration: FrameCornerCalibration) => void;
  resetFrameCornerCalibration: () => void;
  resetAll: () => void;
  setFrameWidthCm: (width: number) => void;
  setTextureScale: (scale: number) => void;
  setMatSettings: (settings: Partial<MatSettings>) => void;
  exportSerializableProject: () => Promise<SerializableProject>;
  importSerializableProject: (project: SerializableProject) => void;
  exportFrameProfile: () => Promise<SerializableFrameProfile | null>;
  importFrameProfile: (profile: SerializableFrameProfile) => void;
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

export interface NormalizedRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FrameCornerCalibration {
  innerCorner: Point;
  outerCorner: Point;
  /** Full corner sample area including outer lip, body, and inner lip. When null, derived from points and strips. */
  cornerCropRect: NormalizedRect | null;
  horizontalStrip: NormalizedRect;
  verticalStrip: NormalizedRect;
  sourceCorner: SourceCornerSetting;
  railSourceMode: RailSourceMode;
  railSourceSide: RailSourceSide;
}

export type RailSourceMode = "separate" | "horizontal-all" | "vertical-all";

export type RailSourceSide = "top" | "right" | "bottom" | "left";

export type SourceCornerSetting =
  | "auto"
  | "top-left"
  | "top-right"
  | "bottom-right"
  | "bottom-left";

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
  topLeft: { x: 0, y: 0 },
  topRight: { x: 1, y: 0 },
  bottomRight: { x: 1, y: 1 },
  bottomLeft: { x: 0, y: 1 },
};

export const DEFAULT_FRAME_CORNER_CALIBRATION: FrameCornerCalibration = {
  innerCorner: { x: 0.58, y: 0.58 },
  outerCorner: { x: 0.08, y: 0.08 },
  cornerCropRect: null,
  horizontalStrip: { x: 0.12, y: 0.44, width: 0.5, height: 0.08 },
  verticalStrip: { x: 0.44, y: 0.12, width: 0.08, height: 0.5 },
  sourceCorner: "auto",
  railSourceMode: "separate",
  railSourceSide: "top",
};

export const MAT_COLOR_PRESETS = [
  { label: "Ivory", value: "#f5f0e8" },
  { label: "White", value: "#ffffff" },
  { label: "Black", value: "#1a1a1a" },
  { label: "Cream", value: "#efe6d4" },
] as const;

export const DEFAULT_CUSTOM_FRAME_FALLBACK_COLOR = "#71717a";

export const SERIALIZABLE_PROJECT_VERSION = 1 as const;
export const SERIALIZABLE_FRAME_PROFILE_VERSION = 1 as const;

export interface StoredImagePayload {
  blob: Blob;
  name: string;
  type: string;
}

export interface SerializableProject {
  version: typeof SERIALIZABLE_PROJECT_VERSION;
  perspectiveCorners: PerspectiveCorners;
  cropSettings: CropSettings;
  canvasSize: CanvasSize;
  lockCanvasAspectRatio?: boolean;
  selectedFrameId: string | null;
  frameSampleMode: FrameSampleMode;
  frameCornerCalibration: FrameCornerCalibration | null;
  frameWidthCm: number;
  textureScale: number;
  matSettings: MatSettings;
  customFrameFallbackColor: string | null;
  artworkOriginal: StoredImagePayload | null;
  correctedArtwork: Blob | null;
  croppedArtwork: Blob | null;
  customFrame: StoredImagePayload | null;
}

export interface SerializableFrameProfile {
  version: typeof SERIALIZABLE_FRAME_PROFILE_VERSION;
  frameSampleMode: FrameSampleMode;
  frameCornerCalibration: FrameCornerCalibration;
  frameWidthCm: number;
  textureScale: number;
  fallbackColor: string;
  frameImage: StoredImagePayload;
}

export interface SavedProjectSummary {
  id: string;
  name: string;
  savedAt: number;
}

export interface SavedFrameProfileSummary {
  id: string;
  name: string;
  savedAt: number;
}

export interface SavedEnvironmentSummary {
  id: string;
  name: string;
  updatedAt: number;
  hasCalibration?: boolean;
}

export interface EnvironmentCalibration {
  wallRect: NormalizedRect;
  realWallWidthCm: number;
  realWallHeightCm: number;
}

export interface EnvironmentPlacement {
  x: number;
  y: number;
  fineScale: number;
}

export const ENVIRONMENT_FINE_SCALE_MIN = 0.95;
export const ENVIRONMENT_FINE_SCALE_MAX = 1.05;

export const DEFAULT_ENVIRONMENT_PLACEMENT: EnvironmentPlacement = {
  x: 50,
  y: 45,
  fineScale: 1,
};

export type EnvironmentSelection =
  | { kind: "builtin"; id: string }
  | { kind: "saved"; id: string }
  | null;
