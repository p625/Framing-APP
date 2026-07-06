import {
  SERIALIZABLE_FRAME_PROFILE_VERSION,
  TEXTURE_SCALE_PRESETS,
  type FrameCornerCalibration,
  type FrameSampleMode,
  type SerializableFrameProfile,
} from "../framing.types";

export const FRAME_PROFILE_CATEGORIES = [
  "Wood",
  "Modern",
  "Ornate",
  "Metal",
  "Classic",
  "Gallery",
] as const;

export type FrameProfileCategory = (typeof FRAME_PROFILE_CATEGORIES)[number];

export interface DefaultFrameProfile {
  id: string;
  name: string;
  category: FrameProfileCategory;
  thumbnailUrl: string;
  sampleImageUrl: string;
  frameSampleMode: FrameSampleMode;
  frameCornerCalibration: FrameCornerCalibration;
  frameWidthCm: number;
  textureScale: number;
  fallbackColor: string;
}

const RAIL_92_CALIBRATION: FrameCornerCalibration = {
  innerCorner: { x: 0.09, y: 0.09 },
  outerCorner: { x: 0.02, y: 0.02 },
  horizontalStrip: { x: 0.05, y: 0.03, width: 0.45, height: 0.065 },
  verticalStrip: { x: 0.03, y: 0.05, width: 0.065, height: 0.45 },
  sourceCorner: "top-left",
  railSourceMode: "separate",
  railSourceSide: "top",
};

const RAIL_72_CALIBRATION: FrameCornerCalibration = {
  innerCorner: { x: 0.07, y: 0.07 },
  outerCorner: { x: 0.02, y: 0.02 },
  horizontalStrip: { x: 0.05, y: 0.028, width: 0.45, height: 0.052 },
  verticalStrip: { x: 0.028, y: 0.05, width: 0.052, height: 0.45 },
  sourceCorner: "top-left",
  railSourceMode: "separate",
  railSourceSide: "top",
};

const RAIL_118_CALIBRATION: FrameCornerCalibration = {
  innerCorner: { x: 0.115, y: 0.115 },
  outerCorner: { x: 0.02, y: 0.02 },
  horizontalStrip: { x: 0.05, y: 0.045, width: 0.45, height: 0.085 },
  verticalStrip: { x: 0.045, y: 0.05, width: 0.085, height: 0.45 },
  sourceCorner: "top-left",
  railSourceMode: "separate",
  railSourceSide: "top",
};

export const DEFAULT_FRAME_PROFILES: DefaultFrameProfile[] = [
  {
    id: "default-natural-oak",
    name: "Natural Oak",
    category: "Wood",
    thumbnailUrl: "/frame-profiles/natural-oak-corner.svg",
    sampleImageUrl: "/frame-profiles/natural-oak-corner.svg",
    frameSampleMode: "corner",
    frameCornerCalibration: RAIL_92_CALIBRATION,
    frameWidthCm: 3,
    textureScale: TEXTURE_SCALE_PRESETS.medium,
    fallbackColor: "#c4a574",
  },
  {
    id: "default-classic-walnut",
    name: "Classic Walnut",
    category: "Wood",
    thumbnailUrl: "/frame-profiles/classic-walnut-corner.svg",
    sampleImageUrl: "/frame-profiles/classic-walnut-corner.svg",
    frameSampleMode: "corner",
    frameCornerCalibration: RAIL_92_CALIBRATION,
    frameWidthCm: 3,
    textureScale: TEXTURE_SCALE_PRESETS.medium,
    fallbackColor: "#5c4033",
  },
  {
    id: "default-matte-black",
    name: "Matte Black",
    category: "Modern",
    thumbnailUrl: "/frame-profiles/matte-black-corner.svg",
    sampleImageUrl: "/frame-profiles/matte-black-corner.svg",
    frameSampleMode: "corner",
    frameCornerCalibration: RAIL_72_CALIBRATION,
    frameWidthCm: 2,
    textureScale: TEXTURE_SCALE_PRESETS.small,
    fallbackColor: "#1a1a1a",
  },
  {
    id: "default-gold-ornate",
    name: "Gold Ornate",
    category: "Ornate",
    thumbnailUrl: "/frame-profiles/gold-ornate-corner.svg",
    sampleImageUrl: "/frame-profiles/gold-ornate-corner.svg",
    frameSampleMode: "corner",
    frameCornerCalibration: RAIL_118_CALIBRATION,
    frameWidthCm: 4,
    textureScale: TEXTURE_SCALE_PRESETS.large,
    fallbackColor: "#c9a227",
  },
];

export function getDefaultFrameProfile(id: string): DefaultFrameProfile | undefined {
  return DEFAULT_FRAME_PROFILES.find((profile) => profile.id === id);
}

export function isDefaultFrameProfileId(id: string): boolean {
  return DEFAULT_FRAME_PROFILES.some((profile) => profile.id === id);
}

export function defaultFrameProfileToSerializable(
  profile: DefaultFrameProfile,
  frameImage: SerializableFrameProfile["frameImage"],
): SerializableFrameProfile {
  return {
    version: SERIALIZABLE_FRAME_PROFILE_VERSION,
    frameSampleMode: profile.frameSampleMode,
    frameCornerCalibration: profile.frameCornerCalibration,
    frameWidthCm: profile.frameWidthCm,
    textureScale: profile.textureScale,
    fallbackColor: profile.fallbackColor,
    frameImage,
  };
}
