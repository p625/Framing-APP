"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_CROP_SETTINGS,
  type CanvasSize,
  type CropSettings,
  type UseFramingStateReturn,
} from "../framing.types";
import { createCroppedImageUrl } from "../utils/createCroppedImage";

const DEFAULT_CANVAS_SIZE: CanvasSize = {
  widthCm: 30,
  heightCm: 40,
};

function revokeObjectUrl(url: string | null) {
  if (url) {
    URL.revokeObjectURL(url);
  }
}

export function useFramingState(): UseFramingStateReturn {
  const [artworkFile, setArtworkFileState] = useState<File | null>(null);
  const [cropSettings, setCropSettingsState] =
    useState<CropSettings>(DEFAULT_CROP_SETTINGS);
  const [croppedArtworkUrl, setCroppedArtworkUrl] = useState<string | null>(null);
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

  const artworkImageUrl = croppedArtworkUrl ?? artworkPreviewUrl;

  useEffect(() => {
    return () => {
      revokeObjectUrl(artworkPreviewUrl);
    };
  }, [artworkPreviewUrl]);

  useEffect(() => {
    return () => {
      revokeObjectUrl(customFrameTextureUrl);
    };
  }, [customFrameTextureUrl]);

  useEffect(() => {
    return () => {
      revokeObjectUrl(croppedArtworkUrl);
    };
  }, [croppedArtworkUrl]);

  const clearAppliedCrop = useCallback(() => {
    setCroppedArtworkUrl((previous) => {
      revokeObjectUrl(previous);
      return null;
    });
  }, []);

  const setArtworkFile = useCallback((file: File | null) => {
    setArtworkFileState(file);
    setCropSettingsState(DEFAULT_CROP_SETTINGS);
    clearAppliedCrop();
  }, [clearAppliedCrop]);

  const setCropSettings = useCallback((settings: Partial<CropSettings>) => {
    setCropSettingsState((previous) => ({ ...previous, ...settings }));
  }, []);

  const applyCrop = useCallback(async () => {
    if (!artworkPreviewUrl || !cropSettings.croppedAreaPixels) {
      return;
    }

    const nextUrl = await createCroppedImageUrl(
      artworkPreviewUrl,
      cropSettings.croppedAreaPixels,
    );

    setCroppedArtworkUrl((previous) => {
      revokeObjectUrl(previous);
      return nextUrl;
    });
  }, [artworkPreviewUrl, cropSettings.croppedAreaPixels]);

  const resetCrop = useCallback(() => {
    setCropSettingsState(DEFAULT_CROP_SETTINGS);
    clearAppliedCrop();
  }, [clearAppliedCrop]);

  const setCanvasSize = useCallback(
    (size: Partial<CanvasSize>) => {
      setCanvasSizeState((previous) => ({ ...previous, ...size }));
      clearAppliedCrop();
    },
    [clearAppliedCrop],
  );

  const setCustomFrameFile = useCallback((file: File | null) => {
    setCustomFrameFileState(file);
    if (file) {
      setSelectedFrameId(null);
    }
  }, []);

  return {
    artworkFile,
    artworkPreviewUrl,
    artworkImageUrl,
    cropSettings,
    croppedArtworkUrl,
    canvasSize,
    selectedFrameId,
    customFrameTextureUrl,
    customFrameFile,
    frameWidthCm,
    setArtworkFile,
    setCropSettings,
    applyCrop,
    resetCrop,
    setCanvasSize,
    setSelectedFrameId,
    setCustomFrameFile,
    setFrameWidthCm,
  };
}
