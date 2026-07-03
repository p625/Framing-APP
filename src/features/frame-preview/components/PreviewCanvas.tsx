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

const PREVIEW_CANVAS_ID = "framing-preview-canvas";

interface PreviewCanvasProps {
  artworkImageUrl: string | null;
  canvasSize: CanvasSize;
  frame: FrameDefinition | null;
  customFrameTextureUrl: string | null;
  customFrameFallbackColor: string | null;
  frameSampleMode: FrameSampleMode;
  frameCornerCalibration: FrameCornerCalibration | null;
  frameWidthCm: number;
  textureScale: number;
  matSettings: MatSettings;
  fillContainer?: boolean;
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
  customFrameFallbackColor,
  frameSampleMode,
  frameCornerCalibration,
  frameWidthCm,
  textureScale,
  matSettings,
  fillContainer = false,
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

  const frameFallbackColor =
    customFrameFallbackColor ?? frame?.fallbackColor ?? "#71717a";

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
    <div
      className={
        fillContainer
          ? "flex h-full min-h-0 items-center justify-center fs-canvas-bg p-6"
          : "flex h-full min-h-[400px] flex-col"
      }
    >
      <div
        className={`flex items-center justify-center ${
          fillContainer ? "h-full w-full" : "flex-1 rounded-xl border border-zinc-200 bg-zinc-100 p-4"
        }`}
      >
        {artworkImageUrl ? (
          <canvas
            id={PREVIEW_CANVAS_ID}
            ref={canvasRef}
            width={renderDimensions.width}
            height={renderDimensions.height}
            className={`block rounded-xl bg-white shadow-lg ${
              fillContainer
                ? "max-h-full max-w-full"
                : "max-h-[min(70vh,640px)] max-w-full shadow-sm"
            }`}
            aria-label="Framed artwork preview"
          />
        ) : (
          <div className="max-w-md rounded-[var(--fs-radius-lg)] border border-dashed border-fs-border-strong bg-fs-surface px-8 py-12 text-center shadow-sm">
            <p className="fs-heading text-sm">Your framed preview</p>
            <p className="mt-2 text-xs leading-relaxed text-fs-muted">
              Choose artwork and a frame from the sidebar. Adjust size and passe-partout to
              see a live preview here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export { PREVIEW_CANVAS_ID };
