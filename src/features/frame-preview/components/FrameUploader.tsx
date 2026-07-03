"use client";

import {
  TEXTURE_SCALE_PRESETS,
  type TextureScalePreset,
} from "../framing.types";

interface FrameUploaderProps {
  customFrameFile: File | null;
  customFrameTextureUrl: string | null;
  textureScale: number;
  onCustomFrameSelect: (file: File | null) => void;
  onTextureScaleChange: (scale: number) => void;
}

const PRESET_LABELS: Record<TextureScalePreset, string> = {
  small: "Small",
  medium: "Medium",
  large: "Large",
};

export function FrameUploader({
  customFrameFile,
  customFrameTextureUrl,
  textureScale,
  onCustomFrameSelect,
  onTextureScaleChange,
}: FrameUploaderProps) {
  const activePreset = (
    Object.entries(TEXTURE_SCALE_PRESETS) as [TextureScalePreset, number][]
  ).find(([, value]) => value === textureScale)?.[0];

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium text-zinc-900">Custom frame texture</h2>

      {customFrameTextureUrl ? (
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={customFrameTextureUrl}
            alt="Custom frame texture preview"
            className="h-24 w-full object-cover"
          />
          <div className="flex items-center justify-between gap-2 border-t border-zinc-200 px-3 py-2">
            <span className="truncate text-xs text-zinc-600">
              {customFrameFile?.name ?? "Custom texture"}
            </span>
            <button
              type="button"
              onClick={() => onCustomFrameSelect(null)}
              className="shrink-0 text-xs font-medium text-zinc-500 hover:text-zinc-900"
            >
              Clear
            </button>
          </div>
        </div>
      ) : (
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-4 py-5 transition-colors hover:border-zinc-400 hover:bg-zinc-100">
          <span className="text-sm text-zinc-600">Upload frame texture</span>
          <span className="mt-1 text-xs text-zinc-400">
            Overrides selected sample frame
          </span>
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              onCustomFrameSelect(file);
            }}
          />
        </label>
      )}

      {customFrameTextureUrl ? (
        <label className="flex cursor-pointer items-center justify-center rounded-lg border border-zinc-200 px-3 py-2 text-xs text-zinc-600 transition-colors hover:border-zinc-300">
          Replace texture
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              onCustomFrameSelect(file);
            }}
          />
        </label>
      ) : null}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-700">Texture repeat</span>
          <span className="text-xs text-zinc-400">{textureScale.toFixed(2)}×</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(TEXTURE_SCALE_PRESETS) as TextureScalePreset[]).map(
            (preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => onTextureScaleChange(TEXTURE_SCALE_PRESETS[preset])}
                className={`rounded-md border px-2 py-1.5 text-xs transition-colors ${
                  activePreset === preset
                    ? "border-zinc-900 bg-zinc-50 font-medium text-zinc-900"
                    : "border-zinc-200 text-zinc-600 hover:border-zinc-300"
                }`}
              >
                {PRESET_LABELS[preset]}
              </button>
            ),
          )}
        </div>
        <input
          type="range"
          min={0.25}
          max={4}
          step={0.05}
          value={textureScale}
          onChange={(event) => onTextureScaleChange(Number(event.target.value))}
          className="w-full accent-zinc-900"
          aria-label="Texture repeat scale"
        />
      </div>
    </section>
  );
}
