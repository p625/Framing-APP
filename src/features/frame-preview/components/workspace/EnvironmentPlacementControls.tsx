"use client";

import type { EnvironmentPlacement } from "../../framing.types";
import {
  ENVIRONMENT_FINE_SCALE_MAX,
  ENVIRONMENT_FINE_SCALE_MIN,
} from "../../framing.types";

interface EnvironmentPlacementControlsProps {
  placement: EnvironmentPlacement;
  onChange: (patch: Partial<EnvironmentPlacement>) => void;
  onReset: () => void;
}

export function EnvironmentPlacementControls({
  placement,
  onChange,
  onReset,
}: EnvironmentPlacementControlsProps) {
  const finePercent = Math.round((placement.fineScale - 1) * 100);

  return (
    <div className="space-y-3 border-t border-fs-border pt-3">
      <span className="fs-subheading text-xs">Placement in scene</span>

      <label className="block">
        <span className="mb-1 block text-[11px] text-fs-muted">
          Fine scale ({finePercent >= 0 ? "+" : ""}
          {finePercent}%)
        </span>
        <input
          type="range"
          min={ENVIRONMENT_FINE_SCALE_MIN}
          max={ENVIRONMENT_FINE_SCALE_MAX}
          step={0.005}
          value={placement.fineScale}
          onChange={(event) => onChange({ fineScale: Number(event.target.value) })}
          className="w-full accent-fs-gold"
        />
      </label>

      <p className="text-[11px] text-fs-muted">
        Size is calculated from your frame dimensions and wall calibration. Drag the
        framed piece to reposition. Fine scale adjusts ±5% for camera perspective.
      </p>

      <button type="button" onClick={onReset} className="fs-btn fs-btn-secondary w-full py-2">
        Reset position
      </button>
    </div>
  );
}
