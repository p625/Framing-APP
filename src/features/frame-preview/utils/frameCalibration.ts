import type { FrameCornerCalibration, NormalizedRect } from "../framing.types";

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

  const minX = Math.min(innerX, outerX);
  const minY = Math.min(innerY, outerY);
  const maxX = Math.max(innerX, outerX);
  const maxY = Math.max(innerY, outerY);
  const size = Math.max(maxX - minX, maxY - minY, 1);

  return {
    x: minX,
    y: minY,
    width: size,
    height: size,
  };
}
