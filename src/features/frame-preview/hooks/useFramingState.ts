"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_CROP_SETTINGS,
  DEFAULT_CUSTOM_FRAME_FALLBACK_COLOR,
  DEFAULT_FRAME_CORNER_CALIBRATION,
  DEFAULT_MAT_SETTINGS,
  DEFAULT_PERSPECTIVE_CORNERS,
  DEFAULT_TEXTURE_SCALE,
  SERIALIZABLE_FRAME_PROFILE_VERSION,
  SERIALIZABLE_PROJECT_VERSION,
  type CanvasSize,
  type CropSettings,
  type FrameCornerCalibration,
  type FrameSampleMode,
  type MatSettings,
  type PerspectiveCorners,
  type SerializableFrameProfile,
  type SerializableProject,
  type UseFramingStateReturn,
} from "../framing.types";
import { getCalibrationOrDefault } from "../utils/frameCalibration";
import { blobFromUrl, storedImageFromFile } from "../storage/blobUtils";
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
  const [customFrameFallbackColor, setCustomFrameFallbackColor] = useState<string | null>(
    null,
  );

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
      setCustomFrameFallbackColor(null);
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

  const exportSerializableProject = useCallback(async (): Promise<SerializableProject> => {
    const [correctedArtwork, croppedArtwork] = await Promise.all([
      correctedArtworkUrl ? blobFromUrl(correctedArtworkUrl) : Promise.resolve(null),
      croppedArtworkUrl ? blobFromUrl(croppedArtworkUrl) : Promise.resolve(null),
    ]);

    return {
      version: SERIALIZABLE_PROJECT_VERSION,
      perspectiveCorners,
      cropSettings,
      canvasSize,
      selectedFrameId,
      frameSampleMode,
      frameCornerCalibration,
      frameWidthCm,
      textureScale,
      matSettings,
      customFrameFallbackColor,
      artworkOriginal: artworkFile ? storedImageFromFile(artworkFile) : null,
      correctedArtwork,
      croppedArtwork,
      customFrame: customFrameFile ? storedImageFromFile(customFrameFile) : null,
    };
  }, [
    artworkFile,
    canvasSize,
    correctedArtworkUrl,
    cropSettings,
    croppedArtworkUrl,
    customFrameFallbackColor,
    customFrameFile,
    frameCornerCalibration,
    frameSampleMode,
    frameWidthCm,
    matSettings,
    perspectiveCorners,
    selectedFrameId,
    textureScale,
  ]);

  const importSerializableProject = useCallback((project: SerializableProject) => {
    setCorrectedArtworkUrl((previous) => {
      revokeObjectUrl(previous);
      return null;
    });
    setCroppedArtworkUrl((previous) => {
      revokeObjectUrl(previous);
      return null;
    });

    setArtworkFileState(
      project.artworkOriginal
        ? new File([project.artworkOriginal.blob], project.artworkOriginal.name, {
            type: project.artworkOriginal.type || "image/png",
          })
        : null,
    );
    setPerspectiveCorners(project.perspectiveCorners);
    setCropSettingsState(project.cropSettings);
    setCanvasSizeState(project.canvasSize);
    setSelectedFrameId(project.selectedFrameId);
    setFrameSampleMode(project.frameSampleMode);
    setFrameCornerCalibrationState(project.frameCornerCalibration);
    setFrameWidthCm(project.frameWidthCm);
    setTextureScale(project.textureScale);
    setMatSettingsState(project.matSettings);
    setCustomFrameFallbackColor(project.customFrameFallbackColor);

    setCustomFrameFileState(
      project.customFrame
        ? new File([project.customFrame.blob], project.customFrame.name, {
            type: project.customFrame.type || "image/png",
          })
        : null,
    );

    if (project.correctedArtwork) {
      setCorrectedArtworkUrl(URL.createObjectURL(project.correctedArtwork));
    }
    if (project.croppedArtwork) {
      setCroppedArtworkUrl(URL.createObjectURL(project.croppedArtwork));
    }

    setCropEditorKey((value) => value + 1);
  }, []);

  const exportFrameProfile =
    useCallback(async (): Promise<SerializableFrameProfile | null> => {
      if (!customFrameFile) {
        return null;
      }

      return {
        version: SERIALIZABLE_FRAME_PROFILE_VERSION,
        frameSampleMode,
        frameCornerCalibration: getCalibrationOrDefault(frameCornerCalibration),
        frameWidthCm,
        textureScale,
        fallbackColor: customFrameFallbackColor ?? DEFAULT_CUSTOM_FRAME_FALLBACK_COLOR,
        frameImage: storedImageFromFile(customFrameFile),
      };
    }, [
      customFrameFallbackColor,
      customFrameFile,
      frameCornerCalibration,
      frameSampleMode,
      frameWidthCm,
      textureScale,
    ]);

  const importFrameProfile = useCallback((profile: SerializableFrameProfile) => {
    setSelectedFrameId(null);
    setCustomFrameFileState(
      new File([profile.frameImage.blob], profile.frameImage.name, {
        type: profile.frameImage.type || "image/png",
      }),
    );
    setFrameSampleMode(profile.frameSampleMode);
    setFrameCornerCalibrationState(profile.frameCornerCalibration);
    setFrameWidthCm(profile.frameWidthCm);
    setTextureScale(profile.textureScale);
    setCustomFrameFallbackColor(profile.fallbackColor);
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
    setCustomFrameFallbackColor(null);
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
    customFrameFallbackColor,
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
    exportSerializableProject,
    importSerializableProject,
    exportFrameProfile,
    importFrameProfile,
  };
}
