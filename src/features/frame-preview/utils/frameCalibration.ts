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
