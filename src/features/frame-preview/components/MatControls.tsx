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
        <h2 className="text-sm font-medium text-zinc-900">Passe-partout</h2>
        <label className="flex cursor-pointer items-center gap-2 text-xs text-zinc-600">
          <input
            type="checkbox"
            checked={matSettings.enabled}
            onChange={(event) =>
              onMatSettingsChange({ enabled: event.target.checked })
            }
            className="accent-zinc-900"
          />
          Enabled
        </label>
      </div>

      {matSettings.enabled ? (
        <>
          <label className="space-y-1">
            <span className="text-xs text-zinc-500">Border width (cm)</span>
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
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
            />
          </label>

          <div className="space-y-2">
            <span className="text-xs text-zinc-500">Color</span>
            <div className="flex flex-wrap gap-2">
              {MAT_COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => onMatSettingsChange({ color: preset.value })}
                  className={`flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs transition-colors ${
                    matSettings.color === preset.value
                      ? "border-zinc-900 bg-zinc-50"
                      : "border-zinc-200 hover:border-zinc-300"
                  }`}
                >
                  <span
                    className="h-3.5 w-3.5 rounded border border-zinc-200"
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
                className="h-8 w-10 cursor-pointer rounded border border-zinc-200 bg-white"
                aria-label="Custom mat color"
              />
              <span className="text-xs text-zinc-500">Custom</span>
            </label>
          </div>
        </>
      ) : (
        <p className="text-xs text-zinc-500">
          Add a mat border between the artwork and frame.
        </p>
      )}
    </section>
  );
}
