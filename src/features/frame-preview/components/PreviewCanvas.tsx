"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CanvasSize, FrameDefinition } from "../framing.types";
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
  frameWidthCm: number;
  textureScale: number;
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
  frameWidthCm,
  textureScale,
}: PreviewCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const artworkImage = useLoadedImage(artworkImageUrl);

  const frameTextureUrl =
    customFrameTextureUrl ?? frame?.textureUrl ?? null;
  const frameTextureImage = useLoadedImage(frameTextureUrl);

  const renderDimensions = useMemo(
    () => computeRenderDimensions(canvasSize, frameWidthCm),
    [canvasSize, frameWidthCm],
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
      frameWidthCm,
      textureScale,
    });
  }, [
    artworkImage,
    canvasSize,
    frameFallbackColor,
    frameTextureImage,
    frameWidthCm,
    textureScale,
  ]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = renderDimensions.width;
    canvas.height = renderDimensions.height;
    redraw();
  }, [renderDimensions, redraw]);

  return (
    <div className="flex h-full min-h-[320px] items-center justify-center rounded-xl border border-zinc-200 bg-zinc-100 p-4">
      <canvas
        id={PREVIEW_CANVAS_ID}
        ref={canvasRef}
        width={renderDimensions.width}
        height={renderDimensions.height}
        className="max-h-full max-w-full rounded-lg bg-white shadow-sm"
        aria-label="Framed artwork preview"
      />
    </div>
  );
}

export { PREVIEW_CANVAS_ID };
