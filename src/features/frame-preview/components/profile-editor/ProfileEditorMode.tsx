"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { UseFramingStateReturn } from "../../framing.types";
import { resolveProfilePreviewArtworkUrl } from "../../defaults/profilePreview";
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
import { ProfileManagementList } from "./ProfileManagementList";
import { ProfilePreviewViewport } from "./ProfilePreviewViewport";

interface ProfileEditorModeProps {
  framing: UseFramingStateReturn;
  editingProfileId: string | null;
  catalogueRefreshKey: number;
  onProfileDeleted: (id: string) => void;
  onCatalogueChanged: () => void;
}

const PRESET_LABELS: Record<TextureScalePreset, string> = {
  small: "Small",
  medium: "Medium",
  large: "Large",
};

export function ProfileEditorMode({
  framing,
  editingProfileId,
  catalogueRefreshKey,
  onProfileDeleted,
  onCatalogueChanged,
}: ProfileEditorModeProps) {
  const [profileName, setProfileName] = useState("New frame profile");
  const [status, setStatus] = useState<string | null>(null);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(editingProfileId);

  const importFrameProfile = framing.importFrameProfile;

  const loadProfileById = useCallback(
    async (id: string) => {
      const record = await loadFrameProfile(id);
      if (!record) {
        setStatus("Profile not found.");
        return;
      }
      setProfileName(record.name);
      setActiveProfileId(id);
      importFrameProfile(record.data);
      setStatus(`Loaded "${record.name}".`);
    },
    [importFrameProfile],
  );

  useEffect(() => {
    if (!editingProfileId) {
      return;
    }

    let cancelled = false;
    void loadFrameProfile(editingProfileId).then((record) => {
      if (cancelled) {
        return;
      }
      if (!record) {
        setStatus("Profile not found.");
        return;
      }
      setProfileName(record.name);
      setActiveProfileId(editingProfileId);
      importFrameProfile(record.data);
      setStatus(`Loaded "${record.name}".`);
    });

    return () => {
      cancelled = true;
    };
  }, [editingProfileId, importFrameProfile]);

  const previewArtwork = useMemo(
    () => resolveProfilePreviewArtworkUrl(framing.artworkImageUrl),
    [framing.artworkImageUrl],
  );

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
    setActiveProfileId(id);
    onCatalogueChanged();
    setStatus(`Saved profile "${profileName.trim()}".`);
    return id;
  }, [framing, onCatalogueChanged, profileName]);

  const handleRename = async () => {
    if (!activeProfileId) {
      await handleSave();
      return;
    }
    await renameFrameProfile(activeProfileId, profileName);
    onCatalogueChanged();
    setStatus("Profile renamed.");
  };

  const handleDeleteActive = async () => {
    if (!activeProfileId) {
      setStatus("Save the profile first, or select one from the list.");
      return;
    }
    if (!window.confirm(`Delete profile "${profileName}"? This cannot be undone.`)) {
      return;
    }

    const deletedName = profileName;
    const deletedId = activeProfileId;
    await deleteFrameProfile(deletedId);
    onCatalogueChanged();
    onProfileDeleted(deletedId);
    setActiveProfileId(null);
    setProfileName("New frame profile");
    framing.setCustomFrameFile(null);
    setStatus(`Deleted "${deletedName}".`);
  };

  const handleProfileDeletedFromList = (id: string) => {
    if (activeProfileId === id) {
      setActiveProfileId(null);
      setProfileName("New frame profile");
      framing.setCustomFrameFile(null);
    }
    onProfileDeleted(id);
  };

  const frameSampleMode = framing.frameSampleMode;
  const placeholderFrame = SAMPLE_FRAMES[0];

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <aside className="fs-sidebar w-72 shrink-0 overflow-y-auto p-4">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block fs-caption font-medium" htmlFor="profile-name">
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
            <span className="fs-subheading text-xs">Sample type</span>
            <div className="grid grid-cols-2 gap-2">
              {(["texture", "corner"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => framing.setFrameSampleMode(mode)}
                  className={`fs-btn px-2 py-2 ${
                    frameSampleMode === mode
                      ? "border-fs-primary bg-fs-gold-muted font-medium"
                      : "fs-btn-secondary"
                  }`}
                >
                  {mode === "texture" ? "Texture" : "Corner"}
                </button>
              ))}
            </div>
          </div>

          <label className="flex cursor-pointer flex-col items-center justify-center rounded-[var(--fs-radius-lg)] border border-dashed border-fs-border-strong bg-fs-bg-elevated px-4 py-6 text-center hover:border-fs-gold">
            <span className="text-xs font-medium text-fs-primary">Upload frame sample</span>
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
              <span className="fs-subheading text-xs">Texture scale</span>
              <div className="grid grid-cols-3 gap-1">
                {(Object.keys(TEXTURE_SCALE_PRESETS) as TextureScalePreset[]).map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => framing.setTextureScale(TEXTURE_SCALE_PRESETS[preset])}
                    className={`fs-btn px-2 py-1 text-[10px] ${
                      activePreset === preset
                        ? "border-fs-primary bg-fs-gold-muted font-medium"
                        : "fs-btn-secondary"
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

          <div className="flex flex-col gap-2 border-t border-fs-border pt-4">
            <button
              type="button"
              onClick={() => void handleSave()}
              className="fs-btn fs-btn-primary w-full py-2"
            >
              Save profile
            </button>
            <button
              type="button"
              onClick={() => void handleRename()}
              className="fs-btn fs-btn-secondary w-full py-2"
              disabled={!activeProfileId && !framing.customFrameFile}
            >
              Rename
            </button>
            <button
              type="button"
              onClick={() => void handleDeleteActive()}
              className="fs-btn fs-btn-danger w-full py-2"
              disabled={!activeProfileId}
            >
              Delete profile
            </button>
          </div>

          <ProfileManagementList
            activeProfileId={activeProfileId}
            refreshKey={catalogueRefreshKey}
            onSelectProfile={(id) => void loadProfileById(id)}
            onProfileDeleted={handleProfileDeletedFromList}
            onCatalogueChanged={onCatalogueChanged}
          />

          {status ? <p className="fs-caption">{status}</p> : null}
          <p className="text-[11px] text-fs-muted-light">Saved locally in this browser.</p>
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
                <p className="fs-caption">Upload a sample to begin calibration.</p>
              )}
            </div>
          </div>

          <div className="fs-panel flex min-h-0 flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-fs-border px-4 py-2">
              <span className="text-xs font-medium text-fs-primary">Preview</span>
              {previewArtwork.isDefault ? (
                <span className="text-[10px] text-fs-muted">Default preview artwork</span>
              ) : (
                <span className="text-[10px] text-fs-gold">Workspace artwork</span>
              )}
            </div>
            <div className="min-h-0 flex-1">
              <ProfilePreviewViewport>
                <PreviewCanvas
                  artworkImageUrl={previewArtwork.url}
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
                  embedded
                />
              </ProfilePreviewViewport>
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
      <label className="mb-1 block fs-caption font-medium" htmlFor="profile-frame-width">
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
