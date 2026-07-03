"use client";

import type { CanvasSize } from "../framing.types";

function roundCm(value: number): number {
  return Math.round(Math.max(1, value) * 10) / 10;
}

interface SizeInputsProps {
  canvasSize: CanvasSize;
  lockAspectRatio: boolean;
  aspectRatio: number | null;
  hasArtwork: boolean;
  onLockAspectRatioChange: (locked: boolean) => void;
  onCanvasSizeChange: (size: Partial<CanvasSize>) => void;
}

export function SizeInputs({
  canvasSize,
  lockAspectRatio,
  aspectRatio,
  hasArtwork,
  onLockAspectRatioChange,
  onCanvasSizeChange,
}: SizeInputsProps) {
  const ratio =
    aspectRatio && aspectRatio > 0
      ? aspectRatio
      : canvasSize.heightCm > 0
        ? canvasSize.widthCm / canvasSize.heightCm
        : 1;

  const handleWidthChange = (value: number) => {
    const widthCm = roundCm(value);
    if (lockAspectRatio) {
      onCanvasSizeChange({
        widthCm,
        heightCm: roundCm(widthCm / ratio),
      });
      return;
    }
    onCanvasSizeChange({ widthCm });
  };

  const handleHeightChange = (value: number) => {
    const heightCm = roundCm(value);
    if (lockAspectRatio) {
      onCanvasSizeChange({
        heightCm,
        widthCm: roundCm(heightCm * ratio),
      });
      return;
    }
    onCanvasSizeChange({ heightCm });
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-3">
        <label className="space-y-1">
          <span className="fs-caption">Width (cm)</span>
          <input
            type="number"
            min={1}
            step={0.1}
            value={canvasSize.widthCm}
            onChange={(event) => handleWidthChange(parseFloat(event.target.value) || 0)}
            className="fs-input"
          />
        </label>
        <label className="space-y-1">
          <span className="fs-caption">Height (cm)</span>
          <input
            type="number"
            min={1}
            step={0.1}
            value={canvasSize.heightCm}
            onChange={(event) => handleHeightChange(parseFloat(event.target.value) || 0)}
            className="fs-input"
          />
        </label>
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-xs text-fs-body">
        <input
          type="checkbox"
          checked={lockAspectRatio}
          disabled={!hasArtwork}
          onChange={(event) => onLockAspectRatioChange(event.target.checked)}
          className="accent-fs-gold"
        />
        Keep original proportions
      </label>

      <p className="fs-caption">
        {lockAspectRatio && hasArtwork
          ? "Changing one side updates the other to match your artwork."
          : "Used for real-world framing proportions. Does not change an applied crop."}
      </p>
    </div>
  );
}
