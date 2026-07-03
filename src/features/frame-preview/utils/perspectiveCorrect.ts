import type { PerspectiveCorners, Point } from "../framing.types";

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", reject);
    image.src = url;
  });
}

function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function cornersToPixels(
  corners: PerspectiveCorners,
  width: number,
  height: number,
): [Point, Point, Point, Point] {
  return [
    { x: corners.topLeft.x * width, y: corners.topLeft.y * height },
    { x: corners.topRight.x * width, y: corners.topRight.y * height },
    { x: corners.bottomRight.x * width, y: corners.bottomRight.y * height },
    { x: corners.bottomLeft.x * width, y: corners.bottomLeft.y * height },
  ];
}

function estimateOutputSize(corners: [Point, Point, Point, Point]): {
  width: number;
  height: number;
} {
  const [topLeft, topRight, bottomRight, bottomLeft] = corners;
  const width = Math.max(distance(topLeft, topRight), distance(bottomLeft, bottomRight));
  const height = Math.max(distance(topLeft, bottomLeft), distance(topRight, bottomRight));

  return {
    width: Math.max(1, Math.round(width)),
    height: Math.max(1, Math.round(height)),
  };
}

function drawImageTriangle(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  source: [Point, Point, Point],
  destination: [Point, Point, Point],
): void {
  const [s1, s2, s3] = source;
  const [d1, d2, d3] = destination;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(d1.x, d1.y);
  ctx.lineTo(d2.x, d2.y);
  ctx.lineTo(d3.x, d3.y);
  ctx.closePath();
  ctx.clip();

  const denom =
    s1.x * (s2.y - s3.y) + s2.x * (s3.y - s1.y) + s3.x * (s1.y - s2.y);

  if (denom === 0) {
    ctx.restore();
    return;
  }

  const a =
    (d1.x * (s2.y - s3.y) + d2.x * (s3.y - s1.y) + d3.x * (s1.y - s2.y)) / denom;
  const b =
    (d1.y * (s2.y - s3.y) + d2.y * (s3.y - s1.y) + d3.y * (s1.y - s2.y)) / denom;
  const c =
    (d1.x * (s3.x - s2.x) + d2.x * (s1.x - s3.x) + d3.x * (s2.x - s1.x)) / denom;
  const d =
    (d1.y * (s3.x - s2.x) + d2.y * (s1.x - s3.x) + d3.y * (s2.x - s1.x)) / denom;
  const e =
    (d1.x * (s2.x * s3.y - s3.x * s2.y) +
      d2.x * (s3.x * s1.y - s1.x * s3.y) +
      d3.x * (s1.x * s2.y - s2.x * s1.y)) /
    denom;
  const f =
    (d1.y * (s2.x * s3.y - s3.x * s2.y) +
      d2.y * (s3.x * s1.y - s1.x * s3.y) +
      d3.y * (s1.x * s2.y - s2.x * s1.y)) /
    denom;

  ctx.transform(a, b, c, d, e, f);
  ctx.drawImage(image, 0, 0);
  ctx.restore();
}

export async function createPerspectiveCorrectedUrl(
  imageSrc: string,
  corners: PerspectiveCorners,
): Promise<string> {
  const image = await loadImage(imageSrc);
  const sourceCorners = cornersToPixels(
    corners,
    image.naturalWidth,
    image.naturalHeight,
  );
  const { width, height } = estimateOutputSize(sourceCorners);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not get canvas context");
  }

  const [topLeft, topRight, bottomRight, bottomLeft] = sourceCorners;

  drawImageTriangle(
    ctx,
    image,
    [topLeft, topRight, bottomLeft],
    [
      { x: 0, y: 0 },
      { x: width, y: 0 },
      { x: 0, y: height },
    ],
  );

  drawImageTriangle(
    ctx,
    image,
    [topRight, bottomRight, bottomLeft],
    [
      { x: width, y: 0 },
      { x: width, y: height },
      { x: 0, y: height },
    ],
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Failed to create corrected image"));
        return;
      }

      resolve(URL.createObjectURL(blob));
    }, "image/png");
  });
}
