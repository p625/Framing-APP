import type { FrameCornerCalibration, NormalizedRect, Point } from "../framing.types";

export type CornerQuadrant = "top-left" | "top-right" | "bottom-right" | "bottom-left";

const CORNER_INDEX: Record<CornerQuadrant, number> = {
  "top-left": 0,
  "top-right": 1,
  "bottom-right": 2,
  "bottom-left": 3,
};

export interface AxisFlip {
  flipX: boolean;
  flipY: boolean;
}

export function detectPhotographedCorner(inner: Point, outer: Point): CornerQuadrant {
  if (inner.x >= outer.x && inner.y >= outer.y) {
    return "top-left";
  }

  if (inner.x < outer.x && inner.y >= outer.y) {
    return "top-right";
  }

  if (inner.x >= outer.x && inner.y < outer.y) {
    return "bottom-left";
  }

  return "bottom-right";
}

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

export function getRailFlips(photoCorner: CornerQuadrant): Record<
  "top" | "bottom" | "left" | "right",
  AxisFlip
> {
  const isTopPhoto =
    photoCorner === "top-left" || photoCorner === "top-right";
  const isLeftPhoto =
    photoCorner === "top-left" || photoCorner === "bottom-left";

  return {
    top: { flipX: false, flipY: !isTopPhoto },
    bottom: { flipX: false, flipY: isTopPhoto },
    left: { flipX: !isLeftPhoto, flipY: false },
    right: { flipX: isLeftPhoto, flipY: false },
  };
}

export function isFrameCornerCalibrationComplete(
  calibration: FrameCornerCalibration | null,
): boolean {
  if (!calibration) {
    return false;
  }

  const { horizontalStrip, verticalStrip } = calibration;

  return (
    horizontalStrip.width > 0.01 &&
    horizontalStrip.height > 0.01 &&
    verticalStrip.width > 0.01 &&
    verticalStrip.height > 0.01
  );
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
  innerTowardPositiveThickness: boolean;
}

export function resolveHorizontalRailStrip(
  strip: { x: number; y: number; width: number; height: number },
  frameThicknessPx: number,
  inner: Point,
  outer: Point,
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
    innerTowardPositiveThickness: inner.y > outer.y,
  };
}

export function resolveVerticalRailStrip(
  strip: { x: number; y: number; width: number; height: number },
  frameThicknessPx: number,
  inner: Point,
  outer: Point,
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
    innerTowardPositiveThickness: inner.x > outer.x,
  };
}

export function getCalibratedRailFlip(
  railId: "top" | "bottom" | "left" | "right",
  innerTowardPositiveThickness: boolean,
): AxisFlip {
  switch (railId) {
    case "top":
      return { flipX: false, flipY: !innerTowardPositiveThickness };
    case "bottom":
      return { flipX: false, flipY: innerTowardPositiveThickness };
    case "left":
      return { flipX: !innerTowardPositiveThickness, flipY: false };
    case "right":
      return { flipX: innerTowardPositiveThickness, flipY: false };
    default:
      return { flipX: false, flipY: false };
  }
}

export function getCalibratedCornerSource(
  calibration: FrameCornerCalibration,
  imageWidth: number,
  imageHeight: number,
): { x: number; y: number; width: number; height: number } {
  const innerX = calibration.innerCorner.x * imageWidth;
  const innerY = calibration.innerCorner.y * imageHeight;
  const outerX = calibration.outerCorner.x * imageWidth;
  const outerY = calibration.outerCorner.y * imageHeight;
  const photoCorner = detectPhotographedCorner(
    calibration.innerCorner,
    calibration.outerCorner,
  );
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
