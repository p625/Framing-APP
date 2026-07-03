import type { EnvironmentPlacement } from "../framing.types";

function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number,
): void {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const drawW = image.naturalWidth * scale;
  const drawH = image.naturalHeight * scale;
  const x = (width - drawW) / 2;
  const y = (height - drawH) / 2;
  ctx.drawImage(image, x, y, drawW, drawH);
}

export function composeEnvironmentPreview(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  environmentImage: HTMLImageElement,
  framedCanvas: HTMLCanvasElement,
  placement: EnvironmentPlacement,
): void {
  ctx.clearRect(0, 0, width, height);
  drawCoverImage(ctx, environmentImage, width, height);

  const centerX = (placement.x / 100) * width;
  const centerY = (placement.y / 100) * height;
  const frameW = framedCanvas.width * placement.scale;
  const frameH = framedCanvas.height * placement.scale;

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate((placement.rotation * Math.PI) / 180);
  ctx.shadowColor = "rgba(0, 0, 0, 0.38)";
  ctx.shadowBlur = Math.max(12, frameW * 0.04);
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = Math.max(6, frameH * 0.02);
  ctx.drawImage(framedCanvas, -frameW / 2, -frameH / 2, frameW, frameH);
  ctx.restore();
}

export function exportEnvironmentPreviewDataUrl(
  environmentImage: HTMLImageElement,
  framedCanvas: HTMLCanvasElement,
  placement: EnvironmentPlacement,
  maxDimension = 2400,
): string {
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
    return framedCanvas.toDataURL("image/png");
  }

  composeEnvironmentPreview(ctx, width, height, environmentImage, framedCanvas, placement);
  return canvas.toDataURL("image/png");
}
