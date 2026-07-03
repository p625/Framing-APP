import type { CanvasSize, FramedLayout } from "../framing.types";

const BACKGROUND_COLOR = "#e8e8ec";
const PLACEHOLDER_ART_COLOR = "#fafafa";
const PLACEHOLDER_BORDER_COLOR = "#d4d4d8";
const PLACEHOLDER_TEXT_COLOR = "#a1a1aa";

export interface DrawFramedArtworkOptions {
  ctx: CanvasRenderingContext2D;
  canvasWidth: number;
  canvasHeight: number;
  artworkImage: HTMLImageElement | null;
  cropRect: { x: number; y: number; width: number; height: number } | null;
  canvasSize: CanvasSize;
  frameFallbackColor: string;
  frameTextureImage: HTMLImageElement | null;
  frameWidthCm: number;
}

export function computeFramedLayout(
  canvasWidth: number,
  canvasHeight: number,
  canvasSize: CanvasSize,
  frameWidthCm: number,
): FramedLayout {
  const { widthCm: canvasWidthCm, heightCm: canvasHeightCm } = canvasSize;
  const totalWidthCm = canvasWidthCm + frameWidthCm * 2;
  const totalHeightCm = canvasHeightCm + frameWidthCm * 2;
  const totalAspect = totalWidthCm / totalHeightCm;

  const padding = Math.min(canvasWidth, canvasHeight) * 0.08;
  const availW = Math.max(canvasWidth - padding * 2, 1);
  const availH = Math.max(canvasHeight - padding * 2, 1);

  let totalPxW: number;
  let totalPxH: number;

  if (totalAspect >= availW / availH) {
    totalPxW = availW;
    totalPxH = availW / totalAspect;
  } else {
    totalPxH = availH;
    totalPxW = availH * totalAspect;
  }

  const artworkPxW = totalPxW * (canvasWidthCm / totalWidthCm);
  const artworkPxH = totalPxH * (canvasHeightCm / totalHeightCm);
  const framePxH = (artworkPxW * frameWidthCm) / canvasWidthCm;
  const framePxV = (artworkPxH * frameWidthCm) / canvasHeightCm;

  const offsetX = (canvasWidth - totalPxW) / 2;
  const offsetY = (canvasHeight - totalPxH) / 2;

  return {
    offsetX,
    offsetY,
    totalPxW,
    totalPxH,
    artworkPxW,
    artworkPxH,
    framePxH,
    framePxV,
    artX: offsetX + framePxH,
    artY: offsetY + framePxV,
  };
}

function fillFrameBorder(
  ctx: CanvasRenderingContext2D,
  layout: FramedLayout,
  fill: string | CanvasPattern,
): void {
  const { offsetX, offsetY, totalPxW, totalPxH, framePxH, framePxV } = layout;

  ctx.fillStyle = fill;

  ctx.fillRect(offsetX, offsetY, totalPxW, framePxV);
  ctx.fillRect(offsetX, offsetY + totalPxH - framePxV, totalPxW, framePxV);
  ctx.fillRect(offsetX, offsetY + framePxV, framePxH, totalPxH - framePxV * 2);
  ctx.fillRect(
    offsetX + totalPxW - framePxH,
    offsetY + framePxV,
    framePxH,
    totalPxH - framePxV * 2,
  );
}

function drawInnerShadow(
  ctx: CanvasRenderingContext2D,
  layout: FramedLayout,
): void {
  const { artX, artY, artworkPxW, artworkPxH, framePxH, framePxV } = layout;
  const lineWidth = Math.max(1, Math.min(framePxH, framePxV) * 0.07);

  ctx.save();
  ctx.strokeStyle = "rgba(0, 0, 0, 0.22)";
  ctx.lineWidth = lineWidth;
  ctx.strokeRect(
    artX + lineWidth / 2,
    artY + lineWidth / 2,
    artworkPxW - lineWidth,
    artworkPxH - lineWidth,
  );
  ctx.restore();
}

function drawArtworkPlaceholder(
  ctx: CanvasRenderingContext2D,
  layout: FramedLayout,
  scale: number,
): void {
  const { artX, artY, artworkPxW, artworkPxH } = layout;

  ctx.fillStyle = PLACEHOLDER_ART_COLOR;
  ctx.fillRect(artX, artY, artworkPxW, artworkPxH);
  ctx.strokeStyle = PLACEHOLDER_BORDER_COLOR;
  ctx.lineWidth = Math.max(1, scale);
  ctx.strokeRect(artX, artY, artworkPxW, artworkPxH);

  ctx.fillStyle = PLACEHOLDER_TEXT_COLOR;
  ctx.font = `${Math.max(12, artworkPxW * 0.04)}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Upload artwork", artX + artworkPxW / 2, artY + artworkPxH / 2);
}

export function drawFramedArtwork(options: DrawFramedArtworkOptions): void {
  const {
    ctx,
    canvasWidth,
    canvasHeight,
    artworkImage,
    cropRect,
    canvasSize,
    frameFallbackColor,
    frameTextureImage,
    frameWidthCm,
  } = options;

  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  ctx.fillStyle = BACKGROUND_COLOR;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  const layout = computeFramedLayout(
    canvasWidth,
    canvasHeight,
    canvasSize,
    frameWidthCm,
  );
  const scale = layout.totalPxW / 800;

  const frameFill: string | CanvasPattern =
    frameTextureImage !== null
      ? (ctx.createPattern(frameTextureImage, "repeat") ?? frameFallbackColor)
      : frameFallbackColor;

  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.32)";
  ctx.shadowBlur = layout.totalPxW * 0.028;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = layout.totalPxW * 0.014;
  fillFrameBorder(ctx, layout, frameFill);
  ctx.restore();

  const { artX, artY, artworkPxW, artworkPxH } = layout;

  if (artworkImage) {
    const source = cropRect ?? {
      x: 0,
      y: 0,
      width: artworkImage.naturalWidth,
      height: artworkImage.naturalHeight,
    };

    ctx.drawImage(
      artworkImage,
      source.x,
      source.y,
      source.width,
      source.height,
      artX,
      artY,
      artworkPxW,
      artworkPxH,
    );
  } else {
    drawArtworkPlaceholder(ctx, layout, scale);
  }

  drawInnerShadow(ctx, layout);
}

export function computeRenderDimensions(
  canvasSize: CanvasSize,
  frameWidthCm: number,
  maxDimension = 2400,
): { width: number; height: number } {
  const totalW = canvasSize.widthCm + frameWidthCm * 2;
  const totalH = canvasSize.heightCm + frameWidthCm * 2;
  const aspect = totalW / totalH;

  if (aspect >= 1) {
    return {
      width: maxDimension,
      height: Math.round(maxDimension / aspect),
    };
  }

  return {
    width: Math.round(maxDimension * aspect),
    height: maxDimension,
  };
}
