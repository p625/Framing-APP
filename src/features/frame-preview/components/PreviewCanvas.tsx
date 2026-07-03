"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  CanvasSize,
  FrameCornerCalibration,
  FrameDefinition,
  FrameSampleMode,
  MatSettings,
} from "../framing.types";
import {
  computeRenderDimensions,
  drawFramedArtwork,
} from "../renderer/drawFramedArtwork";
import {
  computePreviewDimensionsSummary,
  computePreviewMeasurementLayout,
} from "../utils/previewDimensions";
import { PreviewMeasurementLabels } from "./PreviewMeasurementLabels";
import { PreviewSizeSummary } from "./PreviewSizeSummary";

const PREVIEW_CANVAS_ID = "framing-preview-canvas";

interface PreviewCanvasProps {
  artworkImageUrl: string | null;
  canvasSize: CanvasSize;
  frame: FrameDefinition | null;
  customFrameTextureUrl: string | null;
  frameSampleMode: FrameSampleMode;
  frameCornerCalibration: FrameCornerCalibration | null;
  frameWidthCm: number;
  textureScale: number;
  matSettings: MatSettings;
}

function useLoadedImage(url: string | null | undefined) {
  const [loaded, setLoaded] = useState<{
    url: string;
    image: HTMLImageElement | null;
  } | null>(null);

  useEffect(() => {
    if (!url) return;

    let cancelled = false;
    const img = new Image();
    img.decoding = "async";

    img.onload = () => {
      if (cancelled) return;
      setLoaded({ url, image: img });
    };

    img.onerror = () => {
      if (cancelled) return;
      setLoaded({ url, image: null });
    };

    img.src = url;

    return () => {
      cancelled = true;
    };
  }, [url]);

  if (!url) return null;
  return loaded?.url === url ? loaded.image : null;
}

export function PreviewCanvas({
  artworkImageUrl,
  canvasSize,
  frame,
  customFrameTextureUrl,
  frameSampleMode,
  frameCornerCalibration,
  frameWidthCm,
  textureScale,
  matSettings,
}: PreviewCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const artworkImage = useLoadedImage(artworkImageUrl);

  const frameTextureUrl =
    customFrameTextureUrl ?? frame?.textureUrl ?? null;
  const frameTextureImage = useLoadedImage(frameTextureUrl);

  const renderDimensions = useMemo(
    () => computeRenderDimensions(canvasSize, frameWidthCm, matSettings),
    [canvasSize, frameWidthCm, matSettings],
  );

  const sizeSummary = useMemo(
    () => computePreviewDimensionsSummary(canvasSize, frameWidthCm, matSettings),
    [canvasSize, frameWidthCm, matSettings],
  );

  const measurementLayout = useMemo(
    () => computePreviewMeasurementLayout(canvasSize, frameWidthCm, matSettings),
    [canvasSize, frameWidthCm, matSettings],
  );

  const frameFallbackColor = frame?.fallbackColor ?? "#71717a";

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    drawFramedArtwork({
      ctx,
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      artworkImage,
      cropRect: null,
      canvasSize,
      frameFallbackColor,
      frameTextureImage,
      frameSampleMode,
      frameCornerCalibration,
      frameWidthCm,
      textureScale,
      matSettings,
    });
  }, [
    artworkImage,
    canvasSize,
    frameFallbackColor,
    frameTextureImage,
    frameSampleMode,
    frameCornerCalibration,
    frameWidthCm,
    textureScale,
    matSettings,
  ]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = renderDimensions.width;
    canvas.height = renderDimensions.height;
    redraw();
  }, [renderDimensions, redraw]);

  return (
    <div className="flex h-full min-h-[400px] flex-col gap-3">
      <div className="flex flex-1 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-100 p-4">
        {artworkImageUrl ? (
          <div className="relative inline-block max-h-full max-w-full">
            <PreviewMeasurementLabels
              summary={sizeSummary}
              layout={measurementLayout}
            />
            <canvas
              id={PREVIEW_CANVAS_ID}
              ref={canvasRef}
              width={renderDimensions.width}
              height={renderDimensions.height}
              className="block max-h-[min(70vh,640px)] max-w-full rounded-lg bg-white shadow-sm"
              aria-label="Framed artwork preview"
            />
          </div>
        ) : (
          <div className="max-w-sm rounded-lg border border-dashed border-zinc-300 bg-white px-6 py-10 text-center">
            <p className="text-sm font-medium text-zinc-700">Preview will appear here</p>
            <p className="mt-2 text-xs text-zinc-500">
              Upload artwork, straighten and crop it, then adjust frame and mat settings
              to see a proportional framed preview with live measurements.
            </p>
          </div>
        )}
      </div>

      <PreviewSizeSummary summary={sizeSummary} />
    </div>
  );
}

export { PREVIEW_CANVAS_ID };
