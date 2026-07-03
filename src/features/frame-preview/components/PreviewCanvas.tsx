"use client";

import { useCallback, useEffect, useRef } from "react";
import type { CanvasSize, CropRect, FrameDefinition } from "../framing.types";
import { drawFramedArtwork } from "../renderer/drawFramedArtwork";

interface PreviewCanvasProps {
  artworkPreviewUrl: string | null;
  cropRect: CropRect | null;
  canvasSize: CanvasSize;
  frame: FrameDefinition | null;
  customFrameTextureUrl: string | null;
  frameWidthCm: number;
}

export function PreviewCanvas({
  artworkPreviewUrl,
  cropRect,
  canvasSize,
  frame,
  customFrameTextureUrl,
  frameWidthCm,
}: PreviewCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const artworkImageRef = useRef<HTMLImageElement | null>(null);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    drawFramedArtwork({
      ctx,
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      artworkImage: artworkImageRef.current,
      cropRect,
      canvasSize,
      frame,
      customFrameTextureUrl,
      frameWidthCm,
    });
  }, [cropRect, canvasSize, frame, customFrameTextureUrl, frameWidthCm]);

  useEffect(() => {
    if (!artworkPreviewUrl) {
      artworkImageRef.current = null;
      redraw();
      return;
    }

    const img = new Image();
    img.src = artworkPreviewUrl;
    img.onload = () => {
      artworkImageRef.current = img;
      redraw();
    };

    return () => {
      artworkImageRef.current = null;
    };
  }, [artworkPreviewUrl, redraw]);

  useEffect(() => {
    redraw();
  }, [cropRect, canvasSize, frame, customFrameTextureUrl, frameWidthCm, redraw]);

  return (
    <div className="flex h-full min-h-[320px] items-center justify-center rounded-xl border border-zinc-200 bg-zinc-100 p-4">
      <canvas
        ref={canvasRef}
        width={640}
        height={480}
        className="max-h-full max-w-full rounded-lg bg-white shadow-sm"
        aria-label="Framed artwork preview"
      />
    </div>
  );
}
