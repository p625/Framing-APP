import type { CanvasSize, CropRect, FrameDefinition } from "../framing.types";

export interface DrawFramedArtworkOptions {
  ctx: CanvasRenderingContext2D;
  canvasWidth: number;
  canvasHeight: number;
  artworkImage: HTMLImageElement | null;
  cropRect: CropRect | null;
  canvasSize: CanvasSize;
  frame: FrameDefinition | null;
  customFrameTextureUrl: string | null;
  frameWidthCm: number;
}

function cmToPx(cm: number, totalCm: number, totalPx: number): number {
  if (totalCm <= 0) return 0;
  return (cm / totalCm) * totalPx;
}

export function drawFramedArtwork(options: DrawFramedArtworkOptions): void {
  const {
    ctx,
    canvasWidth,
    canvasHeight,
    artworkImage,
    cropRect,
    canvasSize,
    frame,
    frameWidthCm,
  } = options;

  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  ctx.fillStyle = "#e4e4e7";
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  const aspect = canvasSize.widthCm / canvasSize.heightCm;
  let artworkWidth = canvasWidth * 0.75;
  let artworkHeight = artworkWidth / aspect;

  if (artworkHeight > canvasHeight * 0.75) {
    artworkHeight = canvasHeight * 0.75;
    artworkWidth = artworkHeight * aspect;
  }

  const frameWidthPx = cmToPx(
    frameWidthCm,
    canvasSize.widthCm + frameWidthCm * 2,
    artworkWidth + cmToPx(frameWidthCm, canvasSize.widthCm, artworkWidth) * 2,
  );

  const totalWidth = artworkWidth + frameWidthPx * 2;
  const totalHeight = artworkHeight + frameWidthPx * 2;
  const offsetX = (canvasWidth - totalWidth) / 2;
  const offsetY = (canvasHeight - totalHeight) / 2;

  ctx.fillStyle = frame?.fallbackColor ?? "#71717a";
  ctx.fillRect(offsetX, offsetY, totalWidth, totalHeight);

  const artX = offsetX + frameWidthPx;
  const artY = offsetY + frameWidthPx;

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
      artworkWidth,
      artworkHeight,
    );
  } else {
    ctx.fillStyle = "#fafafa";
    ctx.fillRect(artX, artY, artworkWidth, artworkHeight);
    ctx.strokeStyle = "#d4d4d8";
    ctx.lineWidth = 1;
    ctx.strokeRect(artX, artY, artworkWidth, artworkHeight);

    ctx.fillStyle = "#a1a1aa";
    ctx.font = "14px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Upload artwork", artX + artworkWidth / 2, artY + artworkHeight / 2);
  }
}
