"use client";

import { useCallback, useEffect, useState } from "react";
import type { UseFramingStateReturn } from "../../framing.types";
import {
  deleteFrameProfile,
  loadFrameProfile,
  renameFrameProfile,
  saveFrameProfile,
} from "../../storage/frameProfileStorage";
import { FrameCornerCalibrationEditor, getCalibrationOrDefault } from "../FrameCornerCalibrationEditor";
import { PreviewCanvas } from "../PreviewCanvas";
import { TEXTURE_SCALE_PRESETS, type TextureScalePreset } from "../../framing.types";
import { SAMPLE_FRAMES } from "../../sampleFrames";

interface ProfileEditorModeProps {
  framing: UseFramingStateReturn;
  editingProfileId: string | null;
}

const PRESET_LABELS: Record<TextureScalePreset, string> = {
  small: "Small",
  medium: "Medium",
  large: "Large",
};

export function ProfileEditorMode({ framing, editingProfileId }: ProfileEditorModeProps) {
  const [profileName, setProfileName] = useState("New frame profile");
  const [status, setStatus] = useState<string | null>(null);

  const importFrameProfile = framing.importFrameProfile;

  useEffect(() => {
    if (!editingProfileId) {
      return;
    }
    let cancelled = false;
    void loadFrameProfile(editingProfileId).then((record) => {
      if (cancelled || !record) {
        return;
      }
      setProfileName(record.name);
      importFrameProfile(record.data);
    });
    return () => {
      cancelled = true;
    };
  }, [editingProfileId, importFrameProfile]);

  const activePreset = (
    Object.entries(TEXTURE_SCALE_PRESETS) as [TextureScalePreset, number][]
  ).find(([, value]) => value === framing.textureScale)?.[0];

  const handleSave = useCallback(async () => {
    const data = await framing.exportFrameProfile();
    if (!data) {
      setStatus("Upload a frame sample first.");
      return;
    }
    const id = await saveFrameProfile(profileName, data);
    setStatus(`Saved profile "${profileName.trim()}".`);
    return id;
  }, [framing, profileName]);

  const handleRename = async () => {
    if (!editingProfileId) {
      await handleSave();
      return;
    }
    await renameFrameProfile(editingProfileId, profileName);
    setStatus("Profile renamed.");
  };

  const handleDelete = async () => {
    if (!editingProfileId) {
      return;
    }
    if (!window.confirm(`Delete profile "${profileName}"?`)) {
      return;
    }
    await deleteFrameProfile(editingProfileId);
    framing.setCustomFrameFile(null);
    setStatus("Profile deleted.");
  };

  const frameSampleMode = framing.frameSampleMode;
  const placeholderFrame = SAMPLE_FRAMES[0];

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <aside className="fs-sidebar w-72 shrink-0 overflow-y-auto p-4">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-700" htmlFor="profile-name">
              Profile name
            </label>
            <input
              id="profile-name"
              value={profileName}
              onChange={(event) => setProfileName(event.target.value)}
              className="fs-input text-sm"
            />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-medium text-zinc-700">Sample type</span>
            <div className="grid grid-cols-2 gap-2">
              {(["texture", "corner"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => framing.setFrameSampleMode(mode)}
                  className={`rounded-lg border px-2 py-2 text-xs ${
                    frameSampleMode === mode
                      ? "border-zinc-900 bg-zinc-50 font-medium"
                      : "border-zinc-200 text-zinc-600"
                  }`}
                >
                  {mode === "texture" ? "Texture" : "Corner"}
                </button>
              ))}
            </div>
          </div>

          <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-6 text-center hover:border-zinc-400">
            <span className="text-xs font-medium text-zinc-700">Upload frame sample</span>
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(event) => {
                framing.setCustomFrameFile(event.target.files?.[0] ?? null);
              }}
            />
          </label>

          {frameSampleMode === "texture" ? (
            <div className="space-y-2">
              <span className="text-xs font-medium text-zinc-700">Texture scale</span>
              <div className="grid grid-cols-3 gap-1">
                {(Object.keys(TEXTURE_SCALE_PRESETS) as TextureScalePreset[]).map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => framing.setTextureScale(TEXTURE_SCALE_PRESETS[preset])}
                    className={`rounded-md border px-2 py-1 text-[10px] ${
                      activePreset === preset
                        ? "border-zinc-900 bg-zinc-50 font-medium"
                        : "border-zinc-200"
                    }`}
                  >
                    {PRESET_LABELS[preset]}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <FrameWidthInputCompact
            value={framing.frameWidthCm}
            onChange={framing.setFrameWidthCm}
          />

          <div className="flex flex-col gap-2 border-t border-zinc-100 pt-4">
            <button
              type="button"
              onClick={() => void handleSave()}
              className="fs-btn fs-btn-primary w-full py-2"
            >
              Save profile
            </button>
            {editingProfileId ? (
              <>
                <button
                  type="button"
                  onClick={() => void handleRename()}
                  className="fs-btn fs-btn-secondary w-full py-2"
                >
                  Rename
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete()}
                  className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-50"
                >
                  Delete profile
                </button>
              </>
            ) : null}
          </div>

          {status ? <p className="text-xs text-zinc-500">{status}</p> : null}
          <p className="text-[11px] text-zinc-400">Saved locally in this browser.</p>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col fs-canvas-bg">
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 p-4 xl:grid-cols-2">
          <div className="fs-panel flex min-h-0 flex-col overflow-hidden">
            <div className="border-b border-fs-border px-4 py-2 text-xs font-medium text-fs-primary">
              Calibration
            </div>
            <div className="min-h-0 flex-1 overflow-auto p-3">
              {framing.customFrameTextureUrl && frameSampleMode === "corner" ? (
                <FrameCornerCalibrationEditor
                  imageUrl={framing.customFrameTextureUrl}
                  calibration={getCalibrationOrDefault(framing.frameCornerCalibration)}
                  onCalibrationChange={framing.setFrameCornerCalibration}
                  onReset={framing.resetFrameCornerCalibration}
                />
              ) : framing.customFrameTextureUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={framing.customFrameTextureUrl}
                  alt="Texture sample"
                  className="max-h-full w-full rounded-lg object-contain"
                />
              ) : (
                <p className="text-xs text-zinc-400">Upload a sample to begin calibration.</p>
              )}
            </div>
          </div>

          <div className="fs-panel flex min-h-0 flex-col overflow-hidden">
            <div className="border-b border-fs-border px-4 py-2 text-xs font-medium text-fs-primary">
              Preview
            </div>
            <div className="min-h-0 flex-1">
              <PreviewCanvas
                artworkImageUrl={framing.artworkImageUrl}
                canvasSize={framing.canvasSize}
                frame={placeholderFrame}
                customFrameTextureUrl={framing.customFrameTextureUrl}
                customFrameFallbackColor={framing.customFrameFallbackColor}
                frameSampleMode={frameSampleMode}
                frameCornerCalibration={framing.frameCornerCalibration}
                frameWidthCm={framing.frameWidthCm}
                textureScale={framing.textureScale}
                matSettings={framing.matSettings}
                fillContainer
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function FrameWidthInputCompact({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-zinc-700" htmlFor="profile-frame-width">
        Default frame width (cm)
      </label>
      <input
        id="profile-frame-width"
        type="number"
        min={0.5}
        max={20}
        step={0.1}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="fs-input text-sm"
      />
    </div>
  );
}
