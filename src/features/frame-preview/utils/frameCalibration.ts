import type {
  FrameCornerCalibration,
  NormalizedRect,
  Point,
  RailSourceMode,
  RailSourceSide,
  SourceCornerSetting,
} from "../framing.types";

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
  scale: number;
  tileLength: number;
  tileThickness: number;
}

export function resolveHorizontalRailStrip(
  strip: { x: number; y: number; width: number; height: number },
  frameThicknessPx: number,
): ResolvedRailStrip {
  let sourceLength = strip.width;
  let sourceThickness = strip.height;

  if (strip.height > strip.width) {
    sourceLength = strip.height;
    sourceThickness = strip.width;
  }

  const scale = frameThicknessPx / Math.max(sourceThickness, 1);

  return {
    sourceX: strip.x,
    sourceY: strip.y,
    sourceLength,
    sourceThickness,
    scale,
    tileLength: sourceLength * scale,
    tileThickness: frameThicknessPx,
  };
}

export function resolveVerticalRailStrip(
  strip: { x: number; y: number; width: number; height: number },
  frameThicknessPx: number,
): ResolvedRailStrip {
  let sourceLength = strip.height;
  let sourceThickness = strip.width;

  if (strip.width > strip.height) {
    sourceLength = strip.width;
    sourceThickness = strip.height;
  }

  const scale = frameThicknessPx / Math.max(sourceThickness, 1);

  return {
    sourceX: strip.x,
    sourceY: strip.y,
    sourceLength,
    sourceThickness,
    scale,
    tileLength: sourceLength * scale,
    tileThickness: frameThicknessPx,
  };
}

export type StripOrientation = "horizontal" | "vertical";

const RAIL_SIDE_INDEX: Record<RailSourceSide, number> = {
  top: 0,
  right: 1,
  bottom: 2,
  left: 3,
};

export interface RailSideDrawParams {
  rotation: CornerRotation;
  flipX: boolean;
  flipY: boolean;
  tileAlong: "horizontal" | "vertical";
}

const HORIZONTAL_STRIP_SIDE_PARAMS: Record<number, RailSideDrawParams> = {
  0: { rotation: 0, flipX: false, flipY: false, tileAlong: "horizontal" },
  1: { rotation: 90, flipX: false, flipY: false, tileAlong: "vertical" },
  2: { rotation: 180, flipX: false, flipY: true, tileAlong: "horizontal" },
  3: { rotation: 270, flipX: false, flipY: false, tileAlong: "vertical" },
};

const VERTICAL_STRIP_SIDE_PARAMS: Record<number, RailSideDrawParams> = {
  0: { rotation: 0, flipX: false, flipY: false, tileAlong: "vertical" },
  1: { rotation: 90, flipX: false, flipY: false, tileAlong: "horizontal" },
  2: { rotation: 180, flipX: true, flipY: false, tileAlong: "vertical" },
  3: { rotation: 270, flipX: false, flipY: false, tileAlong: "horizontal" },
};

export function getRailSideDrawParams(
  stripOrientation: StripOrientation,
  declaredSide: RailSourceSide,
  targetSide: RailSourceSide,
): RailSideDrawParams {
  const steps = (RAIL_SIDE_INDEX[targetSide] - RAIL_SIDE_INDEX[declaredSide] + 4) % 4;
  const table =
    stripOrientation === "horizontal"
      ? HORIZONTAL_STRIP_SIDE_PARAMS
      : VERTICAL_STRIP_SIDE_PARAMS;

  return table[steps];
}

export function toCornerTransform(params: RailSideDrawParams): CornerTransform {
  return {
    rotation: params.rotation,
    flipX: params.flipX,
    flipY: params.flipY,
  };
}

export interface CalibratedRailDrawPlan {
  resolved: ResolvedRailStrip;
  transform: CornerTransform;
  tileAlong: "horizontal" | "vertical";
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

  if (calibration.railSourceMode === "horizontal-all") {
    const sideParams = getRailSideDrawParams(
      "horizontal",
      calibration.railSourceSide,
      targetRail,
    );

    return {
      resolved: resolveHorizontalRailStrip(horizontalStripPx, frameThicknessPx),
      transform: toCornerTransform(sideParams),
      tileAlong: sideParams.tileAlong,
    };
  }

  if (calibration.railSourceMode === "vertical-all") {
    const sideParams = getRailSideDrawParams(
      "vertical",
      calibration.railSourceSide,
      targetRail,
    );

    return {
      resolved: resolveVerticalRailStrip(verticalStripPx, frameThicknessPx),
      transform: toCornerTransform(sideParams),
      tileAlong: sideParams.tileAlong,
    };
  }

  if (isHorizontalRail) {
    const flip = getRailFlipFromSourceCorner(sourceCorner, targetRail);

    return {
      resolved: resolveHorizontalRailStrip(horizontalStripPx, frameThicknessPx),
      transform: { rotation: 0, flipX: flip.flipX, flipY: flip.flipY },
      tileAlong: "horizontal",
    };
  }

  const flip = getRailFlipFromSourceCorner(sourceCorner, targetRail);

  return {
    resolved: resolveVerticalRailStrip(verticalStripPx, frameThicknessPx),
    transform: { rotation: 0, flipX: flip.flipX, flipY: flip.flipY },
    tileAlong: "vertical",
  };
}

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
