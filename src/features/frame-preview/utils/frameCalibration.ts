import type {
  FrameCornerCalibration,
  NormalizedRect,
  Point,
  RailSourceMode,
  RailSourceSide,
  SourceCornerSetting,
} from "../framing.types";
import { DEFAULT_FRAME_CORNER_CALIBRATION } from "../framing.types";

export type CornerQuadrant = "top-left" | "top-right" | "bottom-right" | "bottom-left";

const CORNER_INDEX: Record<CornerQuadrant, number> = {
  "top-left": 0,
  "top-right": 1,
  "bottom-right": 2,
  "bottom-left": 3,
};

const CORNER_DETECTION_THRESHOLD = 0.02;

export interface AxisFlip {
  flipX: boolean;
  flipY: boolean;
}

export type CornerRotation = 0 | 90 | 180 | 270;

export interface CornerTransform {
  rotation: CornerRotation;
  flipX: boolean;
  flipY: boolean;
}

export interface SourceCornerDetection {
  corner: CornerQuadrant | null;
  ambiguous: boolean;
}

export interface ResolvedSourceCorner {
  corner: CornerQuadrant;
  ambiguous: boolean;
  fromManualSelection: boolean;
}

export const CORNER_QUADRANT_LABELS: Record<CornerQuadrant, string> = {
  "top-left": "Top-left",
  "top-right": "Top-right",
  "bottom-right": "Bottom-right",
  "bottom-left": "Bottom-left",
};

export function detectSourceCorner(inner: Point, outer: Point): SourceCornerDetection {
  const dx = inner.x - outer.x;
  const dy = inner.y - outer.y;

  if (Math.abs(dx) < CORNER_DETECTION_THRESHOLD && Math.abs(dy) < CORNER_DETECTION_THRESHOLD) {
    return { corner: null, ambiguous: true };
  }

  if (Math.abs(dx) < CORNER_DETECTION_THRESHOLD || Math.abs(dy) < CORNER_DETECTION_THRESHOLD) {
    return { corner: null, ambiguous: true };
  }

  if (dx > 0 && dy > 0) {
    return { corner: "top-left", ambiguous: false };
  }

  if (dx < 0 && dy > 0) {
    return { corner: "top-right", ambiguous: false };
  }

  if (dx < 0 && dy < 0) {
    return { corner: "bottom-right", ambiguous: false };
  }

  return { corner: "bottom-left", ambiguous: false };
}

/** @deprecated Use detectSourceCorner */
export function detectPhotographedCorner(inner: Point, outer: Point): CornerQuadrant {
  const detected = detectSourceCorner(inner, outer);
  return detected.corner ?? "top-left";
}

export function resolveSourceCorner(
  calibration: FrameCornerCalibration,
): ResolvedSourceCorner {
  if (calibration.sourceCorner !== "auto") {
    return {
      corner: calibration.sourceCorner,
      ambiguous: false,
      fromManualSelection: true,
    };
  }

  const detected = detectSourceCorner(
    calibration.innerCorner,
    calibration.outerCorner,
  );

  if (detected.ambiguous || !detected.corner) {
    return {
      corner: "top-left",
      ambiguous: true,
      fromManualSelection: false,
    };
  }

  return {
    corner: detected.corner,
    ambiguous: false,
    fromManualSelection: false,
  };
}

export function getCornerTransform(
  sourceCorner: CornerQuadrant,
  targetCorner: CornerQuadrant,
): CornerTransform {
  const steps = (CORNER_INDEX[targetCorner] - CORNER_INDEX[sourceCorner] + 4) % 4;

  return {
    rotation: (steps * 90) as CornerRotation,
    flipX: false,
    flipY: false,
  };
}

export function getRailFlipFromSourceCorner(
  sourceCorner: CornerQuadrant,
  railId: "top" | "bottom" | "left" | "right",
): AxisFlip {
  const isTopSource =
    sourceCorner === "top-left" || sourceCorner === "top-right";
  const isLeftSource =
    sourceCorner === "top-left" || sourceCorner === "bottom-left";

  switch (railId) {
    case "top":
      return { flipX: false, flipY: !isTopSource };
    case "bottom":
      return { flipX: false, flipY: isTopSource };
    case "left":
      return { flipX: !isLeftSource, flipY: false };
    case "right":
      return { flipX: isLeftSource, flipY: false };
    default:
      return { flipX: false, flipY: false };
  }
}

/** @deprecated Use getCornerTransform for calibrated rendering */
export function getCornerFlipForFramePosition(
  photoCorner: CornerQuadrant,
  frameCorner: CornerQuadrant,
): AxisFlip {
  const rotation = (CORNER_INDEX[frameCorner] - CORNER_INDEX[photoCorner] + 4) % 4;

  switch (rotation) {
    case 1:
      return { flipX: true, flipY: false };
    case 2:
      return { flipX: true, flipY: true };
    case 3:
      return { flipX: false, flipY: true };
    default:
      return { flipX: false, flipY: false };
  }
}

/** @deprecated Use getRailFlipFromSourceCorner for fallback corner mode */
export function getRailFlips(photoCorner: CornerQuadrant): Record<
  "top" | "bottom" | "left" | "right",
  AxisFlip
> {
  return {
    top: getRailFlipFromSourceCorner(photoCorner, "top"),
    bottom: getRailFlipFromSourceCorner(photoCorner, "bottom"),
    left: getRailFlipFromSourceCorner(photoCorner, "left"),
    right: getRailFlipFromSourceCorner(photoCorner, "right"),
  };
}

export function isHorizontalStripValid(calibration: FrameCornerCalibration): boolean {
  const { horizontalStrip } = calibration;
  return horizontalStrip.width > 0.01 && horizontalStrip.height > 0.01;
}

export function isVerticalStripValid(calibration: FrameCornerCalibration): boolean {
  const { verticalStrip } = calibration;
  return verticalStrip.width > 0.01 && verticalStrip.height > 0.01;
}

export function isFrameCornerCalibrationComplete(
  calibration: FrameCornerCalibration | null,
): boolean {
  if (!calibration) {
    return false;
  }

  switch (calibration.railSourceMode) {
    case "horizontal-all":
      return isHorizontalStripValid(calibration);
    case "vertical-all":
      return isVerticalStripValid(calibration);
    default:
      return isHorizontalStripValid(calibration) && isVerticalStripValid(calibration);
  }
}

export function denormalizeRect(
  rect: NormalizedRect,
  imageWidth: number,
  imageHeight: number,
): { x: number; y: number; width: number; height: number } {
  return {
    x: rect.x * imageWidth,
    y: rect.y * imageHeight,
    width: rect.width * imageWidth,
    height: rect.height * imageHeight,
  };
}

export interface ResolvedRailStrip {
  sourceX: number;
  sourceY: number;
  sourceLength: number;
  sourceThickness: number;
  lengthAlongX: boolean;
  scale: number;
  tileLength: number;
  tileThickness: number;
}

export function resolveMasterRailStrip(
  strip: { x: number; y: number; width: number; height: number },
  frameThicknessPx: number,
): ResolvedRailStrip {
  const lengthAlongX = strip.width >= strip.height;
  const sourceLength = lengthAlongX ? strip.width : strip.height;
  const sourceThickness = lengthAlongX ? strip.height : strip.width;
  const scale = frameThicknessPx / Math.max(sourceThickness, 1);

  return {
    sourceX: strip.x,
    sourceY: strip.y,
    sourceLength,
    sourceThickness,
    lengthAlongX,
    scale,
    tileLength: sourceLength * scale,
    tileThickness: frameThicknessPx,
  };
}

export function resolveHorizontalRailStrip(
  strip: { x: number; y: number; width: number; height: number },
  frameThicknessPx: number,
): ResolvedRailStrip {
  return resolveMasterRailStrip(strip, frameThicknessPx);
}

export function resolveVerticalRailStrip(
  strip: { x: number; y: number; width: number; height: number },
  frameThicknessPx: number,
): ResolvedRailStrip {
  return resolveMasterRailStrip(strip, frameThicknessPx);
}

export interface RailTransform {
  rotation: CornerRotation;
  flipX: boolean;
  flipY: boolean;
  tileAlong: "horizontal" | "vertical";
}

export function getRailTransform(
  sourceSide: RailSourceSide,
  targetSide: RailSourceSide,
): RailTransform {
  const steps = (RAIL_SIDE_INDEX[targetSide] - RAIL_SIDE_INDEX[sourceSide] + 4) % 4;
  const tileAlong: "horizontal" | "vertical" =
    targetSide === "top" || targetSide === "bottom" ? "horizontal" : "vertical";

  let rotation: CornerRotation = 0;
  let flipX = false;
  let flipY = false;

  if (steps === 2) {
    // Opposite side: mirror profile across thickness (inner still faces artwork).
    if (sourceSide === "left" || sourceSide === "right") {
      flipX = true;
    } else {
      flipY = true;
    }
  } else if (steps !== 0) {
    rotation = (steps * 90) as CornerRotation;
    if (steps === 1) {
      if (sourceSide === "left" || sourceSide === "right") {
        flipY = true;
      } else {
        flipX = true;
      }
    }
  }

  return { rotation, flipX, flipY, tileAlong };
}

export interface CalibratedRailDrawPlan {
  resolved: ResolvedRailStrip;
  transform: RailTransform;
  sourceSide: RailSourceSide;
  targetSide: RailSourceSide;
  unifiedMaster: boolean;
}

export function getCalibratedRailDrawPlan(
  calibration: FrameCornerCalibration,
  horizontalStripPx: { x: number; y: number; width: number; height: number },
  verticalStripPx: { x: number; y: number; width: number; height: number },
  framePxH: number,
  framePxV: number,
  sourceCorner: CornerQuadrant,
  targetRail: RailSourceSide,
): CalibratedRailDrawPlan {
  const isHorizontalRail = targetRail === "top" || targetRail === "bottom";
  const frameThicknessPx = isHorizontalRail ? framePxV : framePxH;

  if (calibration.railSourceMode !== "separate") {
    const masterStripPx =
      calibration.railSourceMode === "vertical-all"
        ? verticalStripPx
        : horizontalStripPx;
    const transform = getRailTransform(calibration.railSourceSide, targetRail);

    return {
      resolved: resolveMasterRailStrip(masterStripPx, frameThicknessPx),
      transform,
      sourceSide: calibration.railSourceSide,
      targetSide: targetRail,
      unifiedMaster: true,
    };
  }

  if (isHorizontalRail) {
    const flip = getRailFlipFromSourceCorner(sourceCorner, targetRail);

    return {
      resolved: resolveMasterRailStrip(horizontalStripPx, frameThicknessPx),
      transform: {
        rotation: 0,
        flipX: flip.flipX,
        flipY: flip.flipY,
        tileAlong: "horizontal",
      },
      sourceSide: targetRail,
      targetSide: targetRail,
      unifiedMaster: false,
    };
  }

  const flip = getRailFlipFromSourceCorner(sourceCorner, targetRail);

  return {
    resolved: resolveMasterRailStrip(verticalStripPx, frameThicknessPx),
    transform: {
      rotation: 0,
      flipX: flip.flipX,
      flipY: flip.flipY,
      tileAlong: "vertical",
    },
    sourceSide: targetRail,
    targetSide: targetRail,
    unifiedMaster: false,
  };
}

export function getMasterStripSourceRect(
  master: ResolvedRailStrip,
  srcLength: number,
): { x: number; y: number; width: number; height: number } {
  if (master.lengthAlongX) {
    return {
      x: master.sourceX,
      y: master.sourceY,
      width: srcLength,
      height: master.sourceThickness,
    };
  }

  return {
    x: master.sourceX,
    y: master.sourceY,
    width: master.sourceThickness,
    height: srcLength,
  };
}

const RAIL_SIDE_INDEX: Record<RailSourceSide, number> = {
  top: 0,
  right: 1,
  bottom: 2,
  left: 3,
};

export const RAIL_SOURCE_MODE_OPTIONS: RailSourceMode[] = [
  "separate",
  "horizontal-all",
  "vertical-all",
];

export const RAIL_SOURCE_MODE_LABELS: Record<RailSourceMode, string> = {
  separate: "Horizontal and vertical separately",
  "horizontal-all": "Horizontal rail for all sides",
  "vertical-all": "Vertical rail for all sides",
};

export const RAIL_SOURCE_SIDE_OPTIONS: RailSourceSide[] = [
  "top",
  "right",
  "bottom",
  "left",
];

export const RAIL_SOURCE_SIDE_LABELS: Record<RailSourceSide, string> = {
  top: "Top",
  right: "Right",
  bottom: "Bottom",
  left: "Left",
};

export function getCalibratedCornerSource(
  calibration: FrameCornerCalibration,
  imageWidth: number,
  imageHeight: number,
  sourceCorner?: CornerQuadrant,
): { x: number; y: number; width: number; height: number } {
  const innerX = calibration.innerCorner.x * imageWidth;
  const innerY = calibration.innerCorner.y * imageHeight;
  const outerX = calibration.outerCorner.x * imageWidth;
  const outerY = calibration.outerCorner.y * imageHeight;
  const photoCorner =
    sourceCorner ?? resolveSourceCorner(calibration).corner;
  const size = Math.max(Math.abs(innerX - outerX), Math.abs(innerY - outerY), 1);

  let x = outerX;
  let y = outerY;

  switch (photoCorner) {
    case "top-right":
      x = outerX - size;
      break;
    case "bottom-left":
      y = outerY - size;
      break;
    case "bottom-right":
      x = outerX - size;
      y = outerY - size;
      break;
    default:
      break;
  }

  x = Math.max(0, Math.min(x, imageWidth - size));
  y = Math.max(0, Math.min(y, imageHeight - size));

  return {
    x,
    y,
    width: size,
    height: size,
  };
}

export const SOURCE_CORNER_OPTIONS: SourceCornerSetting[] = [
  "auto",
  "top-left",
  "top-right",
  "bottom-right",
  "bottom-left",
];

export const SOURCE_CORNER_OPTION_LABELS: Record<SourceCornerSetting, string> = {
  auto: "Auto-detect",
  "top-left": "Top-left",
  "top-right": "Top-right",
  "bottom-right": "Bottom-right",
  "bottom-left": "Bottom-left",
};

export function getCalibrationOrDefault(
  calibration: FrameCornerCalibration | null,
): FrameCornerCalibration {
  if (!calibration) {
    return DEFAULT_FRAME_CORNER_CALIBRATION;
  }

  return {
    ...calibration,
    sourceCorner: calibration.sourceCorner ?? "auto",
    railSourceMode: calibration.railSourceMode ?? "separate",
    railSourceSide: calibration.railSourceSide ?? "top",
  };
}
