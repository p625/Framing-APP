import type { CanvasSize, FramedLayout, Point } from "../framing.types";

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
  textureScale: number;
}

interface FrameRail {
  id: "top" | "right" | "bottom" | "left";
  points: Point[];
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

function getFrameRails(layout: FramedLayout): FrameRail[] {
  const {
    offsetX: ox,
    offsetY: oy,
    totalPxW,
    totalPxH,
    artX,
    artY,
    artworkPxW,
    artworkPxH,
  } = layout;

  const outerRight = ox + totalPxW;
  const outerBottom = oy + totalPxH;
  const innerRight = artX + artworkPxW;
  const innerBottom = artY + artworkPxH;

  return [
    {
      id: "top",
      points: [
        { x: ox, y: oy },
        { x: outerRight, y: oy },
        { x: innerRight, y: artY },
        { x: artX, y: artY },
      ],
    },
    {
      id: "right",
      points: [
        { x: outerRight, y: oy },
        { x: outerRight, y: outerBottom },
        { x: innerRight, y: innerBottom },
        { x: innerRight, y: artY },
      ],
    },
    {
      id: "bottom",
      points: [
        { x: outerRight, y: outerBottom },
        { x: ox, y: outerBottom },
        { x: artX, y: innerBottom },
        { x: innerRight, y: innerBottom },
      ],
    },
    {
      id: "left",
      points: [
        { x: ox, y: outerBottom },
        { x: ox, y: oy },
        { x: artX, y: artY },
        { x: artX, y: innerBottom },
      ],
    },
  ];
}

function tracePolygon(ctx: CanvasRenderingContext2D, points: Point[]): void {
  ctx.moveTo(points[0].x, points[0].y);
  for (let index = 1; index < points.length; index += 1) {
    ctx.lineTo(points[index].x, points[index].y);
  }
  ctx.closePath();
}

function getPolygonBounds(points: Point[]) {
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

function createScaledPattern(
  ctx: CanvasRenderingContext2D,
  textureImage: HTMLImageElement,
  textureScale: number,
): CanvasPattern | null {
  const tileWidth = Math.max(1, Math.round(textureImage.naturalWidth * textureScale));
  const tileHeight = Math.max(1, Math.round(textureImage.naturalHeight * textureScale));

  const tileCanvas = document.createElement("canvas");
  tileCanvas.width = tileWidth;
  tileCanvas.height = tileHeight;

  const tileCtx = tileCanvas.getContext("2d");
  if (!tileCtx) {
    return null;
  }

  tileCtx.drawImage(textureImage, 0, 0, tileWidth, tileHeight);
  return ctx.createPattern(tileCanvas, "repeat");
}

function createFrameFill(
  ctx: CanvasRenderingContext2D,
  frameTextureImage: HTMLImageElement | null,
  frameFallbackColor: string,
  textureScale: number,
): string | CanvasPattern {
  if (!frameTextureImage) {
    return frameFallbackColor;
  }

  const pattern = createScaledPattern(ctx, frameTextureImage, textureScale);
  return pattern ?? frameFallbackColor;
}

function fillRail(
  ctx: CanvasRenderingContext2D,
  rail: FrameRail,
  fill: string | CanvasPattern,
): void {
  const bounds = getPolygonBounds(rail.points);

  ctx.save();
  ctx.beginPath();
  tracePolygon(ctx, rail.points);
  ctx.clip();
  ctx.fillStyle = fill;
  ctx.fillRect(
    bounds.x - 1,
    bounds.y - 1,
    bounds.width + 2,
    bounds.height + 2,
  );
  ctx.restore();
}

function drawMiteredFrame(
  ctx: CanvasRenderingContext2D,
  layout: FramedLayout,
  fill: string | CanvasPattern,
  fallbackColor: string,
  withShadow: boolean,
): void {
  const rails = getFrameRails(layout);

  ctx.save();

  if (withShadow) {
    ctx.shadowColor = "rgba(0, 0, 0, 0.32)";
    ctx.shadowBlur = layout.totalPxW * 0.028;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = layout.totalPxW * 0.014;
  }

  for (const rail of rails) {
    ctx.beginPath();
    tracePolygon(ctx, rail.points);
    ctx.fillStyle = fallbackColor;
    ctx.fill();
  }

  ctx.restore();

  if (!withShadow) {
    for (const rail of rails) {
      fillRail(ctx, rail, fill);
    }
  }
}

function drawCornerSeams(
  ctx: CanvasRenderingContext2D,
  layout: FramedLayout,
): void {
  const { offsetX: ox, offsetY: oy, totalPxW, totalPxH, framePxH, framePxV } =
    layout;
  const outerRight = ox + totalPxW;
  const outerBottom = oy + totalPxH;
  const lineWidth = Math.max(0.5, Math.min(framePxH, framePxV) * 0.045);

  const seams: [Point, Point][] = [
    [
      { x: ox + framePxH, y: oy },
      { x: ox, y: oy + framePxV },
    ],
    [
      { x: outerRight - framePxH, y: oy },
      { x: outerRight, y: oy + framePxV },
    ],
    [
      { x: outerRight, y: outerBottom - framePxV },
      { x: outerRight - framePxH, y: outerBottom },
    ],
    [
      { x: ox, y: outerBottom - framePxV },
      { x: ox + framePxH, y: outerBottom },
    ],
  ];

  ctx.save();
  ctx.strokeStyle = "rgba(0, 0, 0, 0.2)";
  ctx.lineWidth = lineWidth;

  for (const [start, end] of seams) {
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  }

  ctx.restore();
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
    textureScale,
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
  const frameFill = createFrameFill(
    ctx,
    frameTextureImage,
    frameFallbackColor,
    textureScale,
  );

  drawMiteredFrame(ctx, layout, frameFill, frameFallbackColor, true);
  drawMiteredFrame(ctx, layout, frameFill, frameFallbackColor, false);
  drawCornerSeams(ctx, layout);

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
