import type { EnvironmentCalibration, EnvironmentPlacement } from "../framing.types";
import type { ImageLayout } from "../utils/imageLayout";
import {
  computeFramedArtworkDisplayPx,
  computeObjectCoverLayout,
} from "../utils/environmentCalibration";

function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number,
): ImageLayout {
  const layout = computeObjectCoverLayout(
    width,
    height,
    image.naturalWidth,
    image.naturalHeight,
  );

  ctx.drawImage(
    image,
    layout.offsetX,
    layout.offsetY,
    layout.displayWidth,
    layout.displayHeight,
  );

  return layout;
}

export interface EnvironmentComposeInput {
  outputWidth: number;
  outputHeight: number;
  environmentImage: HTMLImageElement;
  framedCanvas: HTMLCanvasElement;
  placement: EnvironmentPlacement;
  calibration: EnvironmentCalibration;
  framedWidthCm: number;
  framedHeightCm: number;
}

export function composeEnvironmentPreview(
  ctx: CanvasRenderingContext2D,
  input: EnvironmentComposeInput,
): void {
  const {
    outputWidth,
    outputHeight,
    environmentImage,
    framedCanvas,
    placement,
    calibration,
    framedWidthCm,
    framedHeightCm,
  } = input;

  ctx.clearRect(0, 0, outputWidth, outputHeight);
  const layout = drawCoverImage(ctx, environmentImage, outputWidth, outputHeight);

  const displaySize = computeFramedArtworkDisplayPx(
    calibration,
    layout,
    environmentImage.naturalWidth,
    environmentImage.naturalHeight,
    framedWidthCm,
    framedHeightCm,
    placement.fineScale,
  );

  const centerX = (placement.x / 100) * outputWidth;
  const centerY = (placement.y / 100) * outputHeight;
  const renderScale = displaySize.width / framedCanvas.width;

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.shadowColor = "rgba(0, 0, 0, 0.38)";
  ctx.shadowBlur = Math.max(12, displaySize.width * 0.04);
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = Math.max(6, displaySize.height * 0.02);
  ctx.drawImage(
    framedCanvas,
    (-framedCanvas.width * renderScale) / 2,
    (-framedCanvas.height * renderScale) / 2,
    framedCanvas.width * renderScale,
    framedCanvas.height * renderScale,
  );
  ctx.restore();
}

export function exportEnvironmentPreviewDataUrl(
  input: EnvironmentComposeInput,
  maxDimension = 2400,
): string {
  const { environmentImage } = input;
  const aspect = environmentImage.naturalWidth / environmentImage.naturalHeight;
  let width = maxDimension;
  let height = Math.round(maxDimension / aspect);

  if (aspect < 1) {
    height = maxDimension;
    width = Math.round(maxDimension * aspect);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return input.framedCanvas.toDataURL("image/png");
  }

  composeEnvironmentPreview(ctx, {
    ...input,
    outputWidth: width,
    outputHeight: height,
  });
  return canvas.toDataURL("image/png");
}
