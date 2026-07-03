"use client";

import type { CanvasSize } from "../framing.types";

interface SizeInputsProps {
  canvasSize: CanvasSize;
  onCanvasSizeChange: (size: Partial<CanvasSize>) => void;
}

export function SizeInputs({ canvasSize, onCanvasSizeChange }: SizeInputsProps) {
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
            onChange={(event) =>
              onCanvasSizeChange({ widthCm: parseFloat(event.target.value) || 0 })
            }
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
            onChange={(event) =>
              onCanvasSizeChange({ heightCm: parseFloat(event.target.value) || 0 })
            }
            className="fs-input"
          />
        </label>
      </div>
      <p className="fs-caption">
        Used for real-world framing proportions. Does not change an applied crop.
      </p>
    </div>
  );
}
