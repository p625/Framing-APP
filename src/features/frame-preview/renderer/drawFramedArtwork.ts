import type {
  CanvasSize,
  FrameCornerCalibration,
  FrameSampleMode,
  FramedLayout,
  MatSettings,
  Point,
} from "../framing.types";
import {
  denormalizeRect,
  getCalibratedCornerSource,
  getCalibratedRailDrawPlan,
  getCornerFlipForFramePosition,
  getCornerTransform,
  getMasterStripSourceRect,
  getRailFlips,
  resolveSourceCorner,
  isFrameCornerCalibrationComplete,
  type AxisFlip,
  type CalibratedRailDrawPlan,
  type CornerQuadrant,
  type CornerTransform,
  type ResolvedRailStrip,
} from "../utils/frameCalibration";

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
  frameSampleMode: FrameSampleMode;
  frameCornerCalibration: FrameCornerCalibration | null;
  frameWidthCm: number;
  textureScale: number;
  matSettings: MatSettings;
}

interface FrameRail {
  id: "top" | "right" | "bottom" | "left";
  points: Point[];
}

function getMatWidthCm(matSettings: MatSettings): number {
  return matSettings.enabled ? matSettings.widthCm : 0;
}

export function computeFramedLayout(
  canvasWidth: number,
  canvasHeight: number,
  canvasSize: CanvasSize,
  frameWidthCm: number,
  matSettings: MatSettings,
): FramedLayout {
  const { widthCm: artworkWidthCm, heightCm: artworkHeightCm } = canvasSize;
  const matWidthCm = getMatWidthCm(matSettings);
  const matOuterWidthCm = artworkWidthCm + matWidthCm * 2;
  const matOuterHeightCm = artworkHeightCm + matWidthCm * 2;
  const totalWidthCm = matOuterWidthCm + frameWidthCm * 2;
  const totalHeightCm = matOuterHeightCm + frameWidthCm * 2;
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

  const artworkPxW = totalPxW * (artworkWidthCm / totalWidthCm);
  const artworkPxH = totalPxH * (artworkHeightCm / totalHeightCm);
  const matOuterPxW = totalPxW * (matOuterWidthCm / totalWidthCm);
  const matOuterPxH = totalPxH * (matOuterHeightCm / totalHeightCm);
  const framePxH = (matOuterPxW * frameWidthCm) / matOuterWidthCm;
  const framePxV = (matOuterPxH * frameWidthCm) / matOuterHeightCm;

  const offsetX = (canvasWidth - totalPxW) / 2;
  const offsetY = (canvasHeight - totalPxH) / 2;
  const matX = offsetX + framePxH;
  const matY = offsetY + framePxV;

  const matPxH = matSettings.enabled
    ? (matOuterPxW * matWidthCm) / matOuterWidthCm
    : 0;
  const matPxV = matSettings.enabled
    ? (matOuterPxH * matWidthCm) / matOuterHeightCm
    : 0;

  const artX = matX + matPxH;
  const artY = matY + matPxV;

  return {
    offsetX,
    offsetY,
    totalPxW,
    totalPxH,
    artworkPxW,
    artworkPxH,
    framePxH,
    framePxV,
    artX,
    artY,
    matEnabled: matSettings.enabled,
    matColor: matSettings.color,
    matX,
    matY,
    matOuterPxW,
    matOuterPxH,
    matPxH,
    matPxV,
  };
}

function getFrameRails(layout: FramedLayout): FrameRail[] {
  const {
    offsetX: ox,
    offsetY: oy,
    totalPxW,
    totalPxH,
    matX,
    matY,
    matOuterPxW,
    matOuterPxH,
  } = layout;

  const outerRight = ox + totalPxW;
  const outerBottom = oy + totalPxH;
  const innerRight = matX + matOuterPxW;
  const innerBottom = matY + matOuterPxH;

  return [
    {
      id: "top",
      points: [
        { x: ox, y: oy },
        { x: outerRight, y: oy },
        { x: innerRight, y: matY },
        { x: matX, y: matY },
      ],
    },
    {
      id: "right",
      points: [
        { x: outerRight, y: oy },
        { x: outerRight, y: outerBottom },
        { x: innerRight, y: innerBottom },
        { x: innerRight, y: matY },
      ],
    },
    {
      id: "bottom",
      points: [
        { x: outerRight, y: outerBottom },
        { x: ox, y: outerBottom },
        { x: matX, y: innerBottom },
        { x: innerRight, y: innerBottom },
      ],
    },
    {
      id: "left",
      points: [
        { x: ox, y: outerBottom },
        { x: ox, y: oy },
        { x: matX, y: matY },
        { x: matX, y: innerBottom },
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

const CORNER_INSET_FACTOR = 2.5;
const MIN_STRAIGHT_RAIL_PX = 6;

interface FrameCornerInsets {
  cornerW: number;
  cornerH: number;
}

function computeFrameCornerInsets(layout: FramedLayout): FrameCornerInsets {
  const { framePxH, framePxV, totalPxW, totalPxH } = layout;
  const thickness = Math.max(framePxH, framePxV, 1);
  const desiredW = Math.max(thickness * CORNER_INSET_FACTOR, 8);
  const desiredH = Math.max(thickness * CORNER_INSET_FACTOR, 8);
  const maxCornerW = Math.max(0, (totalPxW - MIN_STRAIGHT_RAIL_PX) / 2);
  const maxCornerH = Math.max(0, (totalPxH - MIN_STRAIGHT_RAIL_PX) / 2);

  return {
    cornerW: Math.min(desiredW, maxCornerW),
    cornerH: Math.min(desiredH, maxCornerH),
  };
}

interface RailStraightSegment {
  x: number;
  y: number;
  width: number;
  height: number;
}

function getRailStraightSegment(
  railId: FrameRail["id"],
  layout: FramedLayout,
  insets: FrameCornerInsets,
): RailStraightSegment {
  const { offsetX: ox, offsetY: oy, totalPxW, totalPxH, framePxH, framePxV } =
    layout;
  const outerRight = ox + totalPxW;
  const outerBottom = oy + totalPxH;
  const { cornerW, cornerH } = insets;

  switch (railId) {
    case "top":
      return {
        x: ox + cornerW,
        y: oy,
        width: totalPxW - cornerW * 2,
        height: framePxV,
      };
    case "bottom":
      return {
        x: ox + cornerW,
        y: outerBottom - framePxV,
        width: totalPxW - cornerW * 2,
        height: framePxV,
      };
    case "left":
      return {
        x: ox,
        y: oy + cornerH,
        width: framePxH,
        height: totalPxH - cornerH * 2,
      };
    case "right":
      return {
        x: outerRight - framePxH,
        y: oy + cornerH,
        width: framePxH,
        height: totalPxH - cornerH * 2,
      };
  }
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

function fillRailSolid(
  ctx: CanvasRenderingContext2D,
  rail: FrameRail,
  color: string,
): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  tracePolygon(ctx, rail.points);
  ctx.fill();
}

function drawFrameShadow(
  ctx: CanvasRenderingContext2D,
  layout: FramedLayout,
  fallbackColor: string,
): void {
  const rails = getFrameRails(layout);

  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.32)";
  ctx.shadowBlur = layout.totalPxW * 0.028;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = layout.totalPxW * 0.014;

  for (const rail of rails) {
    fillRailSolid(ctx, rail, fallbackColor);
  }

  ctx.restore();
}

function drawTextureFrame(
  ctx: CanvasRenderingContext2D,
  layout: FramedLayout,
  fill: string | CanvasPattern,
): void {
  for (const rail of getFrameRails(layout)) {
    fillRail(ctx, rail, fill);
  }
}

function drawRailTileWithTransform(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
  sourceX: number,
  sourceY: number,
  sourceW: number,
  sourceH: number,
  transform: CornerTransform,
): void {
  if (width <= 0 || height <= 0 || sourceW <= 0 || sourceH <= 0) return;

  ctx.save();
  ctx.translate(x + width / 2, y + height / 2);
  ctx.rotate((transform.rotation * Math.PI) / 180);
  ctx.scale(transform.flipX ? -1 : 1, transform.flipY ? -1 : 1);
  ctx.drawImage(
    image,
    sourceX,
    sourceY,
    sourceW,
    sourceH,
    -width / 2,
    -height / 2,
    width,
    height,
  );
  ctx.restore();
}

function drawRailTile(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
  sourceX: number,
  sourceY: number,
  sourceW: number,
  sourceH: number,
  flip: AxisFlip = { flipX: false, flipY: false },
): void {
  if (width <= 0 || height <= 0 || sourceW <= 0 || sourceH <= 0) return;

  if (!flip.flipX && !flip.flipY) {
    ctx.drawImage(image, sourceX, sourceY, sourceW, sourceH, x, y, width, height);
    return;
  }

  ctx.save();
  ctx.translate(x + width / 2, y + height / 2);
  ctx.scale(flip.flipX ? -1 : 1, flip.flipY ? -1 : 1);
  ctx.drawImage(
    image,
    sourceX,
    sourceY,
    sourceW,
    sourceH,
    -width / 2,
    -height / 2,
    width,
    height,
  );
  ctx.restore();
}

function drawTiledRailStrip(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  destX: number,
  destY: number,
  destWidth: number,
  destHeight: number,
  sourceX: number,
  sourceY: number,
  sourceW: number,
  sourceH: number,
  flip: AxisFlip,
  axis: "horizontal" | "vertical",
  scale: number,
): void {
  if (destWidth <= 0 || destHeight <= 0 || sourceW <= 0 || sourceH <= 0) return;

  const tileW = sourceW * scale;
  const tileH = sourceH * scale;

  ctx.save();
  ctx.beginPath();
  ctx.rect(destX, destY, destWidth, destHeight);
  ctx.clip();

  if (axis === "horizontal") {
    let x = destX;
    const endX = destX + destWidth;
    while (x < endX - 1e-6) {
      const drawW = Math.min(tileW, endX - x);
      const srcW = drawW / scale;
      drawRailTile(
        ctx,
        image,
        x,
        destY,
        drawW,
        tileH,
        sourceX,
        sourceY,
        srcW,
        sourceH,
        flip,
      );
      x += tileW;
    }
  } else {
    let y = destY;
    const endY = destY + destHeight;
    while (y < endY - 1e-6) {
      const drawH = Math.min(tileH, endY - y);
      const srcH = drawH / scale;
      drawRailTile(
        ctx,
        image,
        destX,
        y,
        tileW,
        drawH,
        sourceX,
        sourceY,
        sourceW,
        srcH,
        flip,
      );
      y += tileH;
    }
  }

  ctx.restore();
}

function drawMasterRailTile(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  centerX: number,
  centerY: number,
  screenLength: number,
  screenThickness: number,
  master: ResolvedRailStrip,
  destLengthPx: number,
  transform: CornerTransform,
): void {
  const srcLength = destLengthPx / master.scale;
  const source = getMasterStripSourceRect(master, srcLength);

  let drawW = screenLength;
  let drawH = screenThickness;
  if (transform.rotation === 90 || transform.rotation === 270) {
    drawW = screenThickness;
    drawH = screenLength;
  }

  drawRailTileWithTransform(
    ctx,
    image,
    centerX - drawW / 2,
    centerY - drawH / 2,
    drawW,
    drawH,
    source.x,
    source.y,
    source.width,
    source.height,
    transform,
  );
}

function drawCalibratedTiledRail(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  rail: FrameRail,
  plan: CalibratedRailDrawPlan,
  segment: RailStraightSegment,
): void {
  if (segment.width <= 0 || segment.height <= 0) {
    return;
  }

  const { resolved, transform } = plan;
  const { tileLength, tileThickness } = resolved;

  ctx.save();
  ctx.beginPath();
  tracePolygon(ctx, rail.points);
  ctx.clip();

  if (transform.tileAlong === "horizontal") {
    let x = segment.x;
    const endX = segment.x + segment.width;
    const centerY = segment.y + segment.height / 2;
    while (x < endX - 1e-6) {
      const drawW = Math.min(tileLength, endX - x);
      drawMasterRailTile(
        ctx,
        image,
        x + drawW / 2,
        centerY,
        drawW,
        tileThickness,
        resolved,
        drawW,
        transform,
      );
      x += tileLength;
    }
  } else {
    let y = segment.y;
    const endY = segment.y + segment.height;
    const centerX = segment.x + segment.width / 2;
    while (y < endY - 1e-6) {
      const drawH = Math.min(tileLength, endY - y);
      drawMasterRailTile(
        ctx,
        image,
        centerX,
        y + drawH / 2,
        tileThickness,
        drawH,
        resolved,
        drawH,
        transform,
      );
      y += tileLength;
    }
  }

  ctx.restore();
}

function drawOrientedCornerPatch(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
  source: { x: number; y: number; width: number; height: number },
  transform: CornerTransform,
): void {
  ctx.save();
  ctx.translate(x + width / 2, y + height / 2);
  ctx.rotate((transform.rotation * Math.PI) / 180);
  ctx.scale(transform.flipX ? -1 : 1, transform.flipY ? -1 : 1);
  ctx.drawImage(
    image,
    source.x,
    source.y,
    source.width,
    source.height,
    -width / 2,
    -height / 2,
    width,
    height,
  );
  ctx.restore();
}

function drawCalibratedCornerSampleFrame(
  ctx: CanvasRenderingContext2D,
  layout: FramedLayout,
  cornerImage: HTMLImageElement,
  calibration: FrameCornerCalibration,
  fallbackColor: string,
): void {
  const rails = getFrameRails(layout);
  const { offsetX: ox, offsetY: oy, totalPxW, totalPxH, framePxH, framePxV } =
    layout;
  const outerRight = ox + totalPxW;
  const outerBottom = oy + totalPxH;
  const insets = computeFrameCornerInsets(layout);
  const { cornerW, cornerH } = insets;
  const imgW = cornerImage.naturalWidth;
  const imgH = cornerImage.naturalHeight;
  const horizontalStrip = denormalizeRect(
    calibration.horizontalStrip,
    imgW,
    imgH,
  );
  const verticalStrip = denormalizeRect(calibration.verticalStrip, imgW, imgH);
  const { corner: sourceCorner } = resolveSourceCorner(calibration);
  const cornerSource = getCalibratedCornerSource(
    calibration,
    imgW,
    imgH,
    sourceCorner,
  );

  for (const rail of rails) {
    fillRailSolid(ctx, rail, fallbackColor);
  }

  for (const rail of rails) {
    const plan = getCalibratedRailDrawPlan(
      calibration,
      horizontalStrip,
      verticalStrip,
      framePxH,
      framePxV,
      sourceCorner,
      rail.id,
    );
    const segment = getRailStraightSegment(rail.id, layout, insets);

    drawCalibratedTiledRail(ctx, cornerImage, rail, plan, segment);
  }

  const frameCorners: { corner: CornerQuadrant; x: number; y: number }[] = [
    { corner: "top-left", x: ox, y: oy },
    { corner: "top-right", x: outerRight - cornerW, y: oy },
    { corner: "bottom-right", x: outerRight - cornerW, y: outerBottom - cornerH },
    { corner: "bottom-left", x: ox, y: outerBottom - cornerH },
  ];

  for (const patch of frameCorners) {
    const transform = getCornerTransform(sourceCorner, patch.corner);
    drawOrientedCornerPatch(
      ctx,
      cornerImage,
      patch.x,
      patch.y,
      cornerW,
      cornerH,
      cornerSource,
      transform,
    );
  }
}

function drawCornerSampleFrame(
  ctx: CanvasRenderingContext2D,
  layout: FramedLayout,
  cornerImage: HTMLImageElement,
  fallbackColor: string,
): void {
  const rails = getFrameRails(layout);
  const { offsetX: ox, offsetY: oy, totalPxW, totalPxH, framePxH, framePxV } =
    layout;
  const outerRight = ox + totalPxW;
  const outerBottom = oy + totalPxH;
  const insets = computeFrameCornerInsets(layout);
  const { cornerW, cornerH } = insets;
  const imgW = cornerImage.naturalWidth;
  const imgH = cornerImage.naturalHeight;
  const stripSourceW = Math.max(1, Math.floor(imgW * 0.15));
  const stripSourceH = Math.max(1, Math.floor(imgH * 0.15));
  const photoCorner: CornerQuadrant = "top-left";
  const railFlips = getRailFlips(photoCorner);
  const fallbackScale = framePxV / stripSourceH;

  for (const rail of rails) {
    fillRailSolid(ctx, rail, fallbackColor);
  }

  const topStripY = oy;
  const bottomStripY = outerBottom - framePxV;
  const leftStripX = ox;
  const rightStripX = outerRight - framePxH;
  const topSegment = getRailStraightSegment("top", layout, insets);
  const bottomSegment = getRailStraightSegment("bottom", layout, insets);
  const leftSegment = getRailStraightSegment("left", layout, insets);
  const rightSegment = getRailStraightSegment("right", layout, insets);

  const horizontalSourceW = stripSourceW;
  const verticalSourceH = stripSourceH;

  drawTiledRailStrip(
    ctx,
    cornerImage,
    topSegment.x,
    topStripY,
    topSegment.width,
    framePxV,
    stripSourceW,
    0,
    horizontalSourceW,
    stripSourceH,
    railFlips.top,
    "horizontal",
    fallbackScale,
  );
  drawTiledRailStrip(
    ctx,
    cornerImage,
    bottomSegment.x,
    bottomStripY,
    bottomSegment.width,
    framePxV,
    stripSourceW,
    imgH - stripSourceH,
    horizontalSourceW,
    stripSourceH,
    railFlips.bottom,
    "horizontal",
    fallbackScale,
  );
  drawTiledRailStrip(
    ctx,
    cornerImage,
    leftStripX,
    leftSegment.y,
    framePxH,
    leftSegment.height,
    0,
    stripSourceH,
    stripSourceW,
    verticalSourceH,
    railFlips.left,
    "vertical",
    fallbackScale,
  );
  drawTiledRailStrip(
    ctx,
    cornerImage,
    rightStripX,
    rightSegment.y,
    framePxH,
    rightSegment.height,
    imgW - stripSourceW,
    stripSourceH,
    stripSourceW,
    verticalSourceH,
    railFlips.right,
    "vertical",
    fallbackScale,
  );

  const frameCorners: { corner: CornerQuadrant; x: number; y: number }[] = [
    { corner: "top-left", x: ox, y: oy },
    { corner: "top-right", x: outerRight - cornerW, y: oy },
    { corner: "bottom-right", x: outerRight - cornerW, y: outerBottom - cornerH },
    { corner: "bottom-left", x: ox, y: outerBottom - cornerH },
  ];

  for (const patch of frameCorners) {
    const flip = getCornerFlipForFramePosition(photoCorner, patch.corner);
    ctx.save();
    ctx.translate(patch.x + cornerW / 2, patch.y + cornerH / 2);
    ctx.scale(flip.flipX ? -1 : 1, flip.flipY ? -1 : 1);
    ctx.drawImage(cornerImage, -cornerW / 2, -cornerH / 2, cornerW, cornerH);
    ctx.restore();
  }
}

function drawCornerSeams(
  ctx: CanvasRenderingContext2D,
  layout: FramedLayout,
): void {
  const {
    offsetX: ox,
    offsetY: oy,
    totalPxW,
    totalPxH,
    framePxH,
    framePxV,
    matX,
    matY,
    matOuterPxW,
    matOuterPxH,
  } = layout;

  const outerRight = ox + totalPxW;
  const outerBottom = oy + totalPxH;
  const innerRight = matX + matOuterPxW;
  const innerBottom = matY + matOuterPxH;
  const lineWidth = Math.max(0.5, Math.min(framePxH, framePxV) * 0.045);

  const seams: [Point, Point][] = [
    [
      { x: matX, y: matY },
      { x: ox, y: oy },
    ],
    [
      { x: innerRight, y: matY },
      { x: outerRight, y: oy },
    ],
    [
      { x: innerRight, y: innerBottom },
      { x: outerRight, y: outerBottom },
    ],
    [
      { x: matX, y: innerBottom },
      { x: ox, y: outerBottom },
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

function drawMat(ctx: CanvasRenderingContext2D, layout: FramedLayout): void {
  if (!layout.matEnabled) {
    return;
  }

  const { matX, matY, matOuterPxW, matOuterPxH, matColor } = layout;
  ctx.fillStyle = matColor;
  ctx.fillRect(matX, matY, matOuterPxW, matOuterPxH);
}

function drawPaperShadow(
  ctx: CanvasRenderingContext2D,
  layout: FramedLayout,
): void {
  if (!layout.matEnabled) {
    return;
  }

  const { artX, artY, artworkPxW, artworkPxH } = layout;
  const lineWidth = Math.max(1, Math.min(artworkPxW, artworkPxH) * 0.006);

  ctx.save();
  ctx.strokeStyle = "rgba(0, 0, 0, 0.14)";
  ctx.lineWidth = lineWidth;
  ctx.shadowColor = "rgba(0, 0, 0, 0.18)";
  ctx.shadowBlur = lineWidth * 3;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = lineWidth * 1.5;
  ctx.strokeRect(
    artX + lineWidth / 2,
    artY + lineWidth / 2,
    artworkPxW - lineWidth,
    artworkPxH - lineWidth,
  );
  ctx.restore();
}

function drawInnerShadow(
  ctx: CanvasRenderingContext2D,
  layout: FramedLayout,
): void {
  const { matX, matY, matOuterPxW, matOuterPxH, framePxH, framePxV } = layout;
  const lineWidth = Math.max(1, Math.min(framePxH, framePxV) * 0.07);

  ctx.save();
  ctx.strokeStyle = "rgba(0, 0, 0, 0.22)";
  ctx.lineWidth = lineWidth;
  ctx.strokeRect(
    matX + lineWidth / 2,
    matY + lineWidth / 2,
    matOuterPxW - lineWidth,
    matOuterPxH - lineWidth,
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
    frameSampleMode,
    frameCornerCalibration,
    frameWidthCm,
    textureScale,
    matSettings,
  } = options;

  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  ctx.fillStyle = BACKGROUND_COLOR;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  const layout = computeFramedLayout(
    canvasWidth,
    canvasHeight,
    canvasSize,
    frameWidthCm,
    matSettings,
  );
  const scale = layout.totalPxW / 800;

  drawFrameShadow(ctx, layout, frameFallbackColor);

  if (frameSampleMode === "corner" && frameTextureImage) {
    if (
      frameCornerCalibration &&
      isFrameCornerCalibrationComplete(frameCornerCalibration)
    ) {
      drawCalibratedCornerSampleFrame(
        ctx,
        layout,
        frameTextureImage,
        frameCornerCalibration,
        frameFallbackColor,
      );
    } else {
      drawCornerSampleFrame(ctx, layout, frameTextureImage, frameFallbackColor);
    }
  } else {
    const frameFill = createFrameFill(
      ctx,
      frameTextureImage,
      frameFallbackColor,
      textureScale,
    );
    drawTextureFrame(ctx, layout, frameFill);
  }

  drawCornerSeams(ctx, layout);
  drawMat(ctx, layout);
  drawPaperShadow(ctx, layout);

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
  matSettings: MatSettings,
  maxDimension = 2400,
): { width: number; height: number } {
  const matWidthCm = getMatWidthCm(matSettings);
  const totalW = canvasSize.widthCm + matWidthCm * 2 + frameWidthCm * 2;
  const totalH = canvasSize.heightCm + matWidthCm * 2 + frameWidthCm * 2;
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
