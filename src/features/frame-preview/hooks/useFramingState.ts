"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_CROP_SETTINGS,
  DEFAULT_FRAME_CORNER_CALIBRATION,
  DEFAULT_MAT_SETTINGS,
  DEFAULT_PERSPECTIVE_CORNERS,
  DEFAULT_TEXTURE_SCALE,
  type CanvasSize,
  type CropSettings,
  type FrameCornerCalibration,
  type FrameSampleMode,
  type MatSettings,
  type PerspectiveCorners,
  type UseFramingStateReturn,
} from "../framing.types";
import { createCroppedImageUrl } from "../utils/createCroppedImage";
import { createPerspectiveCorrectedUrl } from "../utils/perspectiveCorrect";

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
  const [perspectiveCorners, setPerspectiveCorners] =
    useState<PerspectiveCorners>(DEFAULT_PERSPECTIVE_CORNERS);
  const [correctedArtworkUrl, setCorrectedArtworkUrl] = useState<string | null>(null);
  const [cropSettings, setCropSettingsState] =
    useState<CropSettings>(DEFAULT_CROP_SETTINGS);
  const [croppedArtworkUrl, setCroppedArtworkUrl] = useState<string | null>(null);
  const [canvasSize, setCanvasSizeState] = useState<CanvasSize>(DEFAULT_CANVAS_SIZE);
  const [selectedFrameId, setSelectedFrameId] = useState<string | null>("oak");
  const [customFrameFile, setCustomFrameFileState] = useState<File | null>(null);
  const [frameSampleMode, setFrameSampleMode] = useState<FrameSampleMode>("texture");
  const [frameCornerCalibration, setFrameCornerCalibrationState] =
    useState<FrameCornerCalibration | null>(null);
  const [frameWidthCm, setFrameWidthCm] = useState(3);
  const [textureScale, setTextureScale] = useState<number>(DEFAULT_TEXTURE_SCALE);
  const [cropEditorKey, setCropEditorKey] = useState(0);
  const [matSettings, setMatSettingsState] = useState<MatSettings>(DEFAULT_MAT_SETTINGS);

  const artworkPreviewUrl = useMemo(
    () => (artworkFile ? URL.createObjectURL(artworkFile) : null),
    [artworkFile],
  );

  const customFrameTextureUrl = useMemo(
    () => (customFrameFile ? URL.createObjectURL(customFrameFile) : null),
    [customFrameFile],
  );

  const cropSourceUrl = correctedArtworkUrl ?? artworkPreviewUrl;
  const artworkImageUrl =
    croppedArtworkUrl ?? correctedArtworkUrl ?? artworkPreviewUrl;

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
      revokeObjectUrl(correctedArtworkUrl);
    };
  }, [correctedArtworkUrl]);

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

  const clearCorrectedArtwork = useCallback(() => {
    setCorrectedArtworkUrl((previous) => {
      revokeObjectUrl(previous);
      return null;
    });
  }, []);

  const resetArtworkProcessing = useCallback(() => {
    setPerspectiveCorners(DEFAULT_PERSPECTIVE_CORNERS);
    setCropSettingsState(DEFAULT_CROP_SETTINGS);
    clearCorrectedArtwork();
    clearAppliedCrop();
  }, [clearAppliedCrop, clearCorrectedArtwork]);

  const setArtworkFile = useCallback(
    (file: File | null) => {
      setArtworkFileState(file);
      resetArtworkProcessing();
    },
    [resetArtworkProcessing],
  );

  const straightenArtwork = useCallback(async () => {
    if (!artworkPreviewUrl) {
      return;
    }

    const nextUrl = await createPerspectiveCorrectedUrl(
      artworkPreviewUrl,
      perspectiveCorners,
    );

    setCorrectedArtworkUrl((previous) => {
      revokeObjectUrl(previous);
      return nextUrl;
    });
    setCropSettingsState(DEFAULT_CROP_SETTINGS);
    clearAppliedCrop();
    setCropEditorKey((value) => value + 1);
  }, [artworkPreviewUrl, perspectiveCorners, clearAppliedCrop]);

  const resetPerspective = useCallback(() => {
    setPerspectiveCorners(DEFAULT_PERSPECTIVE_CORNERS);
    clearCorrectedArtwork();
    setCropSettingsState(DEFAULT_CROP_SETTINGS);
    clearAppliedCrop();
    setCropEditorKey((value) => value + 1);
  }, [clearAppliedCrop, clearCorrectedArtwork]);

  const setCropSettings = useCallback((settings: Partial<CropSettings>) => {
    setCropSettingsState((previous) => ({ ...previous, ...settings }));
  }, []);

  const applyCrop = useCallback(async () => {
    if (!cropSourceUrl || !cropSettings.croppedAreaPixels) {
      return;
    }

    const nextUrl = await createCroppedImageUrl(
      cropSourceUrl,
      cropSettings.croppedAreaPixels,
    );

    setCroppedArtworkUrl((previous) => {
      revokeObjectUrl(previous);
      return nextUrl;
    });
  }, [cropSourceUrl, cropSettings.croppedAreaPixels]);

  const resetCrop = useCallback(() => {
    setCropSettingsState((previous) => ({
      ...DEFAULT_CROP_SETTINGS,
      lockToArtworkRatio: previous.lockToArtworkRatio,
    }));
    clearAppliedCrop();
    setCropEditorKey((value) => value + 1);
  }, [clearAppliedCrop]);

  const setCanvasSize = useCallback((size: Partial<CanvasSize>) => {
    setCanvasSizeState((previous) => ({ ...previous, ...size }));
  }, []);

  const setCustomFrameFile = useCallback((file: File | null) => {
    setCustomFrameFileState(file);
    if (file) {
      setSelectedFrameId(null);
      setFrameCornerCalibrationState(null);
    } else {
      setFrameCornerCalibrationState(null);
    }
  }, []);

  const setFrameCornerCalibration = useCallback(
    (calibration: FrameCornerCalibration) => {
      setFrameCornerCalibrationState(calibration);
    },
    [],
  );

  const resetFrameCornerCalibration = useCallback(() => {
    setFrameCornerCalibrationState(DEFAULT_FRAME_CORNER_CALIBRATION);
  }, []);

  const setSelectedFrameIdWithMode = useCallback((id: string | null) => {
    setSelectedFrameId(id);
  }, []);

  const setMatSettings = useCallback((settings: Partial<MatSettings>) => {
    setMatSettingsState((previous) => ({ ...previous, ...settings }));
  }, []);

  const resetAll = useCallback(() => {
    setArtworkFileState(null);
    setPerspectiveCorners(DEFAULT_PERSPECTIVE_CORNERS);
    setCorrectedArtworkUrl((previous) => {
      revokeObjectUrl(previous);
      return null;
    });
    setCropSettingsState(DEFAULT_CROP_SETTINGS);
    setCroppedArtworkUrl((previous) => {
      revokeObjectUrl(previous);
      return null;
    });
    setCanvasSizeState(DEFAULT_CANVAS_SIZE);
    setSelectedFrameId("oak");
    setCustomFrameFileState(null);
    setFrameCornerCalibrationState(null);
    setFrameSampleMode("texture");
    setFrameWidthCm(3);
    setTextureScale(DEFAULT_TEXTURE_SCALE);
    setCropEditorKey(0);
    setMatSettingsState(DEFAULT_MAT_SETTINGS);
  }, []);

  return {
    artworkFile,
    artworkPreviewUrl,
    correctedArtworkUrl,
    artworkImageUrl,
    perspectiveCorners,
    cropSettings,
    croppedArtworkUrl,
    cropEditorKey,
    canvasSize,
    selectedFrameId,
    customFrameTextureUrl,
    customFrameFile,
    frameSampleMode,
    frameCornerCalibration,
    frameWidthCm,
    textureScale,
    matSettings,
    setArtworkFile,
    setPerspectiveCorners,
    straightenArtwork,
    resetPerspective,
    setCropSettings,
    applyCrop,
    resetCrop,
    setCanvasSize,
    setSelectedFrameId: setSelectedFrameIdWithMode,
    setCustomFrameFile,
    setFrameSampleMode,
    setFrameCornerCalibration,
    resetFrameCornerCalibration,
    resetAll,
    setFrameWidthCm,
    setTextureScale,
    setMatSettings,
  };
}
