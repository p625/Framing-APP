"use client";

import { useCallback, useMemo, useState } from "react";
import { FreeCropEditor } from "./FreeCropEditor";
import type { CanvasSize, CropRect, CropSettings } from "../framing.types";

interface ArtworkCropperProps {
  cropSourceUrl: string | null;
  cropEditorKey: number;
  canvasSize: CanvasSize;
  cropSettings: CropSettings;
  croppedArtworkUrl: string | null;
  onCropSettingsChange: (settings: Partial<CropSettings>) => void;
  onApplyCrop: () => Promise<void>;
  onResetCrop: () => void;
}

export function ArtworkCropper({
  cropSourceUrl,
  cropEditorKey,
  canvasSize,
  cropSettings,
  croppedArtworkUrl,
  onCropSettingsChange,
  onApplyCrop,
  onResetCrop,
}: ArtworkCropperProps) {
  const [isApplying, setIsApplying] = useState(false);

  const artworkAspect = useMemo(() => {
    if (canvasSize.widthCm <= 0 || canvasSize.heightCm <= 0) {
      return 1;
    }

    return canvasSize.widthCm / canvasSize.heightCm;
  }, [canvasSize.widthCm, canvasSize.heightCm]);

  const handleCropAreaChange = useCallback(
    (area: CropRect) => {
      onCropSettingsChange({ croppedAreaPixels: area });
    },
    [onCropSettingsChange],
  );

  if (!cropSourceUrl) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50 px-4 py-5 text-center">
        <p className="text-xs font-medium text-zinc-600">Crop not available yet</p>
        <p className="mt-1 text-xs text-zinc-500">
          Upload a photo and straighten it first. Then crop the corrected image here.
        </p>
      </div>
    );
  }

  const canApply = Boolean(cropSettings.croppedAreaPixels) && !isApplying;

  const handleApply = async () => {
    setIsApplying(true);
    try {
      await onApplyCrop();
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="space-y-3">
      {croppedArtworkUrl ? (
        <p className="text-xs font-medium text-emerald-600">Crop applied.</p>
      ) : null}

      <FreeCropEditor
        key={`${cropSourceUrl}-${cropEditorKey}`}
        imageUrl={cropSourceUrl}
        lockToArtworkRatio={cropSettings.lockToArtworkRatio}
        lockedAspect={artworkAspect}
        onCropAreaChange={handleCropAreaChange}
      />

      <label className="flex cursor-pointer items-center gap-2 text-xs text-zinc-600">
        <input
          type="checkbox"
          checked={cropSettings.lockToArtworkRatio}
          onChange={(event) =>
            onCropSettingsChange({ lockToArtworkRatio: event.target.checked })
          }
          className="accent-zinc-900"
        />
        Lock crop to final artwork ratio ({canvasSize.widthCm} × {canvasSize.heightCm}{" "}
        cm)
      </label>

      {!cropSettings.lockToArtworkRatio ? (
        <p className="text-xs text-zinc-500">
          Drag the crop box or its handles to freely crop the full source image from
          any side.
        </p>
      ) : (
        <p className="text-xs text-zinc-500">
          Crop box keeps the final artwork ratio while you resize it.
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleApply}
          disabled={!canApply}
          className="flex-1 rounded-md bg-zinc-900 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-300"
        >
          {isApplying ? "Applying…" : "Apply crop"}
        </button>
        <button
          type="button"
          onClick={onResetCrop}
          className="rounded-md border border-zinc-200 px-3 py-2 text-xs text-zinc-600 transition-colors hover:border-zinc-300 hover:text-zinc-900"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
