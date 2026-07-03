"use client";

import type { MatSettings } from "../framing.types";
import { MAT_COLOR_PRESETS } from "../framing.types";

interface MatControlsProps {
  matSettings: MatSettings;
  onMatSettingsChange: (settings: Partial<MatSettings>) => void;
}

export function MatControls({
  matSettings,
  onMatSettingsChange,
}: MatControlsProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="fs-subheading text-sm">Passe-partout</h2>
        <label className="flex cursor-pointer items-center gap-2 text-xs text-fs-muted">
          <input
            type="checkbox"
            checked={matSettings.enabled}
            onChange={(event) =>
              onMatSettingsChange({ enabled: event.target.checked })
            }
            className="accent-fs-gold"
          />
          Enabled
        </label>
      </div>

      {matSettings.enabled ? (
        <>
          <label className="space-y-1">
            <span className="fs-caption">Border width (cm)</span>
            <input
              type="number"
              min={0.5}
              step={0.5}
              value={matSettings.widthCm}
              onChange={(event) =>
                onMatSettingsChange({
                  widthCm: parseFloat(event.target.value) || 0,
                })
              }
              className="fs-input"
            />
          </label>

          <div className="space-y-2">
            <span className="fs-caption">Color</span>
            <div className="flex flex-wrap gap-2">
              {MAT_COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => onMatSettingsChange({ color: preset.value })}
                  className={`fs-btn flex items-center gap-1.5 px-2 py-1 ${
                    matSettings.color === preset.value
                      ? "border-fs-primary bg-fs-gold-muted"
                      : "fs-btn-secondary"
                  }`}
                >
                  <span
                    className="h-3.5 w-3.5 rounded border border-fs-border"
                    style={{ backgroundColor: preset.value }}
                    aria-hidden
                  />
                  {preset.label}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2">
              <input
                type="color"
                value={matSettings.color}
                onChange={(event) =>
                  onMatSettingsChange({ color: event.target.value })
                }
                className="h-8 w-10 cursor-pointer rounded border border-fs-border bg-fs-surface"
                aria-label="Custom mat color"
              />
              <span className="fs-caption">Custom</span>
            </label>
          </div>
        </>
      ) : (
        <p className="fs-caption">Add a mat border between the artwork and frame.</p>
      )}
    </section>
  );
}
