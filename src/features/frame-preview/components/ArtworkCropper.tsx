"use client";

import { useMemo, useState } from "react";
import Cropper from "react-easy-crop";
import type { CanvasSize, CropSettings } from "../framing.types";

import "react-easy-crop/react-easy-crop.css";

interface ArtworkCropperProps {
  cropSourceUrl: string | null;
  canvasSize: CanvasSize;
  cropSettings: CropSettings;
  croppedArtworkUrl: string | null;
  onCropSettingsChange: (settings: Partial<CropSettings>) => void;
  onApplyCrop: () => Promise<void>;
  onResetCrop: () => void;
}

export function ArtworkCropper({
  cropSourceUrl,
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

  if (!cropSourceUrl) {
    return (
      <p className="text-xs text-zinc-500">
        Straighten the artwork photo first, then crop the result.
      </p>
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

      <div className="relative h-52 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-900">
        <Cropper
          image={cropSourceUrl}
          crop={cropSettings.crop}
          zoom={cropSettings.zoom}
          aspect={cropSettings.lockToArtworkRatio ? artworkAspect : undefined}
          onCropChange={(crop) => onCropSettingsChange({ crop })}
          onZoomChange={(zoom) => onCropSettingsChange({ zoom })}
          onCropComplete={(_, croppedAreaPixels) =>
            onCropSettingsChange({ croppedAreaPixels })
          }
        />
      </div>

      <label className="flex items-center gap-3">
        <span className="shrink-0 text-xs text-zinc-500">Zoom</span>
        <input
          type="range"
          min={1}
          max={3}
          step={0.05}
          value={cropSettings.zoom}
          onChange={(event) =>
            onCropSettingsChange({ zoom: Number(event.target.value) })
          }
          className="w-full accent-zinc-900"
        />
      </label>

      <label className="flex cursor-pointer items-center gap-2 text-xs text-zinc-600">
        <input
          type="checkbox"
          checked={cropSettings.lockToArtworkRatio}
          onChange={(event) =>
            onCropSettingsChange({ lockToArtworkRatio: event.target.checked })
          }
          className="accent-zinc-900"
        />
        Lock to artwork ratio ({canvasSize.widthCm} × {canvasSize.heightCm} cm)
      </label>

      {!cropSettings.lockToArtworkRatio ? (
        <p className="text-xs text-zinc-500">
          Drag and resize the crop box freely.
        </p>
      ) : null}

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
