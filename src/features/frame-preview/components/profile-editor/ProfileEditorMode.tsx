"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { UseFramingStateReturn } from "../../framing.types";
import { resolveProfilePreviewArtworkUrl } from "../../defaults/profilePreview";
import {
  deleteFrameProfile,
  renameFrameProfile,
  saveFrameProfile,
} from "../../storage/frameProfileStorage";
import {
  isBuiltinFrameProfileId,
  loadCatalogueFrameProfile,
} from "../../storage/frameProfileCatalogue";
import { FrameCornerCalibrationEditor, getCalibrationOrDefault } from "../FrameCornerCalibrationEditor";
import { PerspectiveEditor } from "../PerspectiveEditor";
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

type SamplePrepStep = "perspective" | "calibration";

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
  const [samplePrepStep, setSamplePrepStep] = useState<SamplePrepStep>("calibration");

  const importFrameProfile = framing.importFrameProfile;
  const isActiveBuiltin =
    activeProfileId !== null && isBuiltinFrameProfileId(activeProfileId);

  const loadProfileById = useCallback(
    async (id: string) => {
      const record = await loadCatalogueFrameProfile(id);
      if (!record) {
        setStatus("Profile not found.");
        return;
      }
      setProfileName(record.name);
      setActiveProfileId(id);
      importFrameProfile(record.data);
      setStatus(
        record.kind === "builtin"
          ? `Loaded built-in "${record.name}". Duplicate to save your own copy.`
          : `Loaded "${record.name}".`,
      );
    },
    [importFrameProfile],
  );

  useEffect(() => {
    if (!editingProfileId) {
      return;
    }

    let cancelled = false;
    void loadCatalogueFrameProfile(editingProfileId).then((record) => {
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
      setStatus(
        record.kind === "builtin"
          ? `Loaded built-in "${record.name}". Duplicate to save your own copy.`
          : `Loaded "${record.name}".`,
      );
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

    if (isActiveBuiltin) {
      const duplicateName = `${profileName.trim()} (copy)`;
      const id = await saveFrameProfile(duplicateName, data);
      setActiveProfileId(id);
      setProfileName(duplicateName);
      onCatalogueChanged();
      setStatus(`Duplicated built-in profile as "${duplicateName}".`);
      return id;
    }

    const id = await saveFrameProfile(profileName, data);
    setActiveProfileId(id);
    onCatalogueChanged();
    setStatus(`Saved profile "${profileName.trim()}".`);
    return id;
  }, [framing, isActiveBuiltin, onCatalogueChanged, profileName]);

  const handleDuplicateBuiltin = useCallback(
    async (id: string) => {
      const record = await loadCatalogueFrameProfile(id);
      if (!record || record.kind !== "builtin") {
        setStatus("Built-in profile not found.");
        return;
      }
      const duplicateName = `${record.name} (copy)`;
      const data = await framing.exportFrameProfile();
      const exportData = data ?? record.data;
      const newId = await saveFrameProfile(duplicateName, exportData);
      setActiveProfileId(newId);
      setProfileName(duplicateName);
      importFrameProfile(exportData);
      onCatalogueChanged();
      setStatus(`Duplicated "${record.name}" as "${duplicateName}".`);
    },
    [framing, importFrameProfile, onCatalogueChanged],
  );

  const handleRename = async () => {
    if (isActiveBuiltin) {
      setStatus("Built-in profiles cannot be renamed. Duplicate to create an editable copy.");
      return;
    }
    if (!activeProfileId) {
      await handleSave();
      return;
    }
    await renameFrameProfile(activeProfileId, profileName);
    onCatalogueChanged();
    setStatus("Profile renamed.");
  };

  const handleDeleteActive = async () => {
    if (isActiveBuiltin) {
      setStatus("Built-in profiles cannot be deleted.");
      return;
    }
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
                const file = event.target.files?.[0] ?? null;
                framing.setCustomFrameFile(file);
                if (file) {
                  setSamplePrepStep("perspective");
                }
              }}
            />
          </label>

          {framing.customFrameFile ? (
            <button
              type="button"
              onClick={() => setSamplePrepStep("perspective")}
              className={`fs-btn w-full py-2 text-sm ${
                samplePrepStep === "perspective"
                  ? "border-fs-primary bg-fs-gold-muted font-medium"
                  : "fs-btn-secondary"
              }`}
            >
              Straighten frame sample
            </button>
          ) : null}

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
              {isActiveBuiltin ? "Duplicate to my profiles" : "Save profile"}
            </button>
            <button
              type="button"
              onClick={() => void handleRename()}
              className="fs-btn fs-btn-secondary w-full py-2"
              disabled={isActiveBuiltin || (!activeProfileId && !framing.customFrameFile)}
            >
              Rename
            </button>
            <button
              type="button"
              onClick={() => void handleDeleteActive()}
              className="fs-btn fs-btn-danger w-full py-2"
              disabled={!activeProfileId || isActiveBuiltin}
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
            onDuplicateBuiltin={(id) => void handleDuplicateBuiltin(id)}
          />

          {status ? <p className="fs-caption">{status}</p> : null}
          <p className="text-[11px] text-fs-muted-light">
            Built-in profiles ship with the app. Your copies are saved locally in this browser.
          </p>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col fs-canvas-bg">
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 p-4 xl:grid-cols-2">
          <div className="fs-panel flex min-h-0 flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-fs-border px-4 py-2">
              <span className="text-xs font-medium text-fs-primary">Sample preparation</span>
              {framing.customFrameFile ? (
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setSamplePrepStep("perspective")}
                    className={`fs-btn px-2 py-1 text-[10px] ${
                      samplePrepStep === "perspective"
                        ? "border-fs-primary bg-fs-gold-muted font-medium"
                        : "fs-btn-secondary"
                    }`}
                  >
                    Straighten
                  </button>
                  <button
                    type="button"
                    onClick={() => setSamplePrepStep("calibration")}
                    className={`fs-btn px-2 py-1 text-[10px] ${
                      samplePrepStep === "calibration"
                        ? "border-fs-primary bg-fs-gold-muted font-medium"
                        : "fs-btn-secondary"
                    }`}
                  >
                    Calibrate
                  </button>
                </div>
              ) : null}
            </div>
            <div className="flex min-h-0 flex-1 flex-col overflow-auto p-3">
              {!framing.customFrameFile ? (
                <p className="fs-caption">Upload a sample to begin straightening and calibration.</p>
              ) : samplePrepStep === "perspective" ? (
                <PerspectiveEditor
                  artworkPreviewUrl={framing.customFrameOriginalUrl}
                  perspectiveCorners={framing.frameSamplePerspectiveCorners}
                  correctedArtworkUrl={framing.correctedCustomFrameUrl}
                  onCornersChange={framing.setFrameSamplePerspectiveCorners}
                  onStraighten={framing.straightenCustomFrame}
                  onReset={framing.resetCustomFramePerspective}
                  displayMode="workspace"
                  variant="frameSample"
                  onCancel={() => setSamplePrepStep("calibration")}
                  onDone={() => setSamplePrepStep("calibration")}
                />
              ) : framing.customFrameTextureUrl && frameSampleMode === "corner" ? (
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
                <p className="fs-caption">Straighten the sample first, then calibrate.</p>
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
