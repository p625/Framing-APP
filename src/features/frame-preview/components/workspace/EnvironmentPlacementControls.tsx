"use client";

import type { EnvironmentPlacement } from "../../framing.types";

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
  return (
    <div className="space-y-3 border-t border-fs-border pt-3">
      <span className="fs-subheading text-xs">Placement in scene</span>

      <label className="block">
        <span className="mb-1 block text-[11px] text-fs-muted">Size</span>
        <input
          type="range"
          min={0.15}
          max={1.2}
          step={0.01}
          value={placement.scale}
          onChange={(event) => onChange({ scale: Number(event.target.value) })}
          className="w-full accent-fs-gold"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-[11px] text-fs-muted">Rotation</span>
        <input
          type="range"
          min={-12}
          max={12}
          step={0.5}
          value={placement.rotation}
          onChange={(event) => onChange({ rotation: Number(event.target.value) })}
          className="w-full accent-fs-gold"
        />
      </label>

      <p className="text-[11px] text-fs-muted">
        Drag the framed piece in the center to reposition it on the wall.
      </p>

      <button type="button" onClick={onReset} className="fs-btn fs-btn-secondary w-full py-2">
        Reset placement
      </button>
    </div>
  );
}
