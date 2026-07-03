import type { EnvironmentCalibration, NormalizedRect } from "../framing.types";
import {
  computeObjectContainLayout,
  type ImageLayout,
} from "./imageLayout";

export function computeObjectCoverLayout(
  containerWidth: number,
  containerHeight: number,
  imageWidth: number,
  imageHeight: number,
): ImageLayout {
  if (imageWidth <= 0 || imageHeight <= 0) {
    return {
      offsetX: 0,
      offsetY: 0,
      displayWidth: containerWidth,
      displayHeight: containerHeight,
    };
  }

  const scale = Math.max(
    containerWidth / imageWidth,
    containerHeight / imageHeight,
  );
  const displayWidth = imageWidth * scale;
  const displayHeight = imageHeight * scale;

  return {
    offsetX: (containerWidth - displayWidth) / 2,
    offsetY: (containerHeight - displayHeight) / 2,
    displayWidth,
    displayHeight,
  };
}

export function normalizedRectToScreenPx(
  rect: NormalizedRect,
  imageWidth: number,
  imageHeight: number,
  layout: ImageLayout,
): { x: number; y: number; width: number; height: number } {
  const scale = layout.displayWidth / imageWidth;

  return {
    x: layout.offsetX + rect.x * imageWidth * scale,
    y: layout.offsetY + rect.y * imageHeight * scale,
    width: rect.width * imageWidth * scale,
    height: rect.height * imageHeight * scale,
  };
}

export function computeFramedArtworkDisplayPx(
  calibration: EnvironmentCalibration,
  layout: ImageLayout,
  imageWidth: number,
  imageHeight: number,
  framedWidthCm: number,
  framedHeightCm: number,
  fineScale: number,
): { width: number; height: number } {
  const wallScreen = normalizedRectToScreenPx(
    calibration.wallRect,
    imageWidth,
    imageHeight,
    layout,
  );

  return {
    width:
      (framedWidthCm / calibration.realWallWidthCm) * wallScreen.width * fineScale,
    height:
      (framedHeightCm / calibration.realWallHeightCm) * wallScreen.height * fineScale,
  };
}

export function wallRectCenterPercent(
  calibration: EnvironmentCalibration,
  containerWidth: number,
  containerHeight: number,
  imageWidth: number,
  imageHeight: number,
): { x: number; y: number } {
  const layout = computeObjectCoverLayout(
    containerWidth,
    containerHeight,
    imageWidth,
    imageHeight,
  );
  const wall = normalizedRectToScreenPx(
    calibration.wallRect,
    imageWidth,
    imageHeight,
    layout,
  );

  return {
    x: ((wall.x + wall.width / 2) / containerWidth) * 100,
    y: ((wall.y + wall.height / 2) / containerHeight) * 100,
  };
}

export function approximateWallCenterPlacement(
  calibration: EnvironmentCalibration,
): { x: number; y: number } {
  return {
    x: (calibration.wallRect.x + calibration.wallRect.width / 2) * 100,
    y: (calibration.wallRect.y + calibration.wallRect.height / 2) * 100,
  };
}

export function containerPointToNormalized(
  localX: number,
  localY: number,
  containerWidth: number,
  containerHeight: number,
  imageWidth: number,
  imageHeight: number,
): { x: number; y: number } | null {
  const layout = computeObjectContainLayout(
    containerWidth,
    containerHeight,
    imageWidth,
    imageHeight,
  );
  const scale = layout.displayWidth / imageWidth;
  const imageX = (localX - layout.offsetX) / scale;
  const imageY = (localY - layout.offsetY) / scale;

  if (imageX < 0 || imageY < 0 || imageX > imageWidth || imageY > imageHeight) {
    return null;
  }

  return {
    x: imageX / imageWidth,
    y: imageY / imageHeight,
  };
}

export function normalizedRectToContainScreen(
  rect: NormalizedRect,
  containerWidth: number,
  containerHeight: number,
  imageWidth: number,
  imageHeight: number,
): { x: number; y: number; width: number; height: number } {
  const layout = computeObjectContainLayout(
    containerWidth,
    containerHeight,
    imageWidth,
    imageHeight,
  );
  return normalizedRectToScreenPx(rect, imageWidth, imageHeight, layout);
}

export const DEFAULT_ENVIRONMENT_CALIBRATION: EnvironmentCalibration = {
  wallRect: { x: 0.1, y: 0.1, width: 0.8, height: 0.65 },
  realWallWidthCm: 200,
  realWallHeightCm: 150,
};

export function isEnvironmentCalibrationValid(
  calibration: EnvironmentCalibration | null | undefined,
): calibration is EnvironmentCalibration {
  if (!calibration) {
    return false;
  }
  const { wallRect, realWallWidthCm, realWallHeightCm } = calibration;
  return (
    wallRect.width > 0.02 &&
    wallRect.height > 0.02 &&
    realWallWidthCm > 0 &&
    realWallHeightCm > 0
  );
}
