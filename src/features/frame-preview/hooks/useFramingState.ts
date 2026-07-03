"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CanvasSize, CropRect, UseFramingStateReturn } from "../framing.types";

const DEFAULT_CANVAS_SIZE: CanvasSize = {
  widthCm: 30,
  heightCm: 40,
};

export function useFramingState(): UseFramingStateReturn {
  const [artworkFile, setArtworkFileState] = useState<File | null>(null);
  const [cropRect, setCropRect] = useState<CropRect | null>(null);
  const [canvasSize, setCanvasSizeState] = useState<CanvasSize>(DEFAULT_CANVAS_SIZE);
  const [selectedFrameId, setSelectedFrameId] = useState<string | null>("oak");
  const [customFrameFile, setCustomFrameFileState] = useState<File | null>(null);
  const [frameWidthCm, setFrameWidthCm] = useState(3);

  const artworkPreviewUrl = useMemo(
    () => (artworkFile ? URL.createObjectURL(artworkFile) : null),
    [artworkFile],
  );

  const customFrameTextureUrl = useMemo(
    () => (customFrameFile ? URL.createObjectURL(customFrameFile) : null),
    [customFrameFile],
  );

  useEffect(() => {
    return () => {
      if (artworkPreviewUrl) {
        URL.revokeObjectURL(artworkPreviewUrl);
      }
    };
  }, [artworkPreviewUrl]);

  useEffect(() => {
    return () => {
      if (customFrameTextureUrl) {
        URL.revokeObjectURL(customFrameTextureUrl);
      }
    };
  }, [customFrameTextureUrl]);

  const setArtworkFile = useCallback((file: File | null) => {
    setArtworkFileState(file);
    setCropRect(null);
  }, []);

  const setCanvasSize = useCallback((size: Partial<CanvasSize>) => {
    setCanvasSizeState((prev) => ({ ...prev, ...size }));
  }, []);

  const setCustomFrameFile = useCallback((file: File | null) => {
    setCustomFrameFileState(file);
    if (file) {
      setSelectedFrameId(null);
    }
  }, []);

  return {
    artworkFile,
    artworkPreviewUrl,
    cropRect,
    canvasSize,
    selectedFrameId,
    customFrameTextureUrl,
    customFrameFile,
    frameWidthCm,
    setArtworkFile,
    setCropRect,
    setCanvasSize,
    setSelectedFrameId,
    setCustomFrameFile,
    setFrameWidthCm,
  };
}
