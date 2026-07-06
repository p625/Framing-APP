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
  type CatalogueFrameProfileKind,
} from "../../storage/frameProfileCatalogue";
import { FRAME_PROFILE_CATEGORIES } from "../../data/defaultFrameProfiles";
import { isCloudPublishEnabled } from "@/src/lib/supabase/cloudPublish";
import {
  publishCloudFrameProfile,
  unpublishCloudFrameProfile,
} from "../../services/cloudFrameProfilePublish";
import { getCachedCloudFrameProfileRow } from "../../services/cloudFrameProfiles";
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
  const [profileCategory, setProfileCategory] = useState<string>(FRAME_PROFILE_CATEGORIES[0]);
  const [status, setStatus] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<"success" | "error" | "info">("info");
  const [activeProfileId, setActiveProfileId] = useState<string | null>(editingProfileId);
  const [activeProfileKind, setActiveProfileKind] = useState<CatalogueFrameProfileKind | null>(
    null,
  );
  const [samplePrepStep, setSamplePrepStep] = useState<SamplePrepStep>("calibration");
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSavingLocally, setIsSavingLocally] = useState(false);

  const setMessage = useCallback(
    (message: string, tone: "success" | "error" | "info" = "info") => {
      setStatus(message);
      setStatusTone(tone);
    },
    [],
  );

  const importFrameProfile = framing.importFrameProfile;
  const isActiveBuiltin =
    activeProfileId !== null && isBuiltinFrameProfileId(activeProfileId);
  const isActiveCloud = activeProfileKind === "cloud";
  const cloudPublishEnabled = isCloudPublishEnabled();

  const loadProfileById = useCallback(
    async (id: string) => {
      const record = await loadCatalogueFrameProfile(id);
      if (!record) {
        setMessage("Profile not found.", "error");
        return;
      }
      setProfileName(record.name);
      setActiveProfileId(id);
      setActiveProfileKind(record.kind);
      importFrameProfile(record.data);

      if (record.kind === "cloud") {
        const cached = getCachedCloudFrameProfileRow(id);
        if (cached?.category) {
          setProfileCategory(cached.category);
        }
        setMessage(
          record.data
            ? `Loaded cloud profile "${record.name}". Publish to update it for all users.`
            : `Loaded cloud profile "${record.name}".`,
          "info",
        );
        return;
      }

      if (record.kind === "builtin") {
        setMessage(
          `Loaded built-in "${record.name}". Duplicate to save your own copy.`,
          "info",
        );
        return;
      }

      setMessage(`Loaded "${record.name}".`, "info");
    },
    [importFrameProfile, setMessage],
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
        setMessage("Profile not found.", "error");
        return;
      }
      setProfileName(record.name);
      setActiveProfileId(editingProfileId);
      setActiveProfileKind(record.kind);
      importFrameProfile(record.data);
      if (record.kind === "cloud") {
        const cached = getCachedCloudFrameProfileRow(editingProfileId);
        if (cached?.category) {
          setProfileCategory(cached.category);
        }
        setMessage(`Loaded cloud profile "${record.name}".`, "info");
        return;
      }
      setMessage(
        record.kind === "builtin"
          ? `Loaded built-in "${record.name}". Duplicate to save your own copy.`
          : `Loaded "${record.name}".`,
        "info",
      );
    });

    return () => {
      cancelled = true;
    };
  }, [editingProfileId, importFrameProfile, setMessage]);

  const previewArtwork = useMemo(
    () => resolveProfilePreviewArtworkUrl(framing.artworkImageUrl),
    [framing.artworkImageUrl],
  );

  const activePreset = (
    Object.entries(TEXTURE_SCALE_PRESETS) as [TextureScalePreset, number][]
  ).find(([, value]) => value === framing.textureScale)?.[0];

  const handleSaveLocally = useCallback(async () => {
    setIsSavingLocally(true);
    try {
      const data = await framing.exportFrameProfile();
      if (!data) {
        setMessage("Upload a frame sample first.", "error");
        return;
      }

      if (isActiveBuiltin) {
        const duplicateName = `${profileName.trim()} (copy)`;
        const id = await saveFrameProfile(duplicateName, data);
        setActiveProfileId(id);
        setActiveProfileKind("user");
        setProfileName(duplicateName);
        onCatalogueChanged();
        setMessage(`Duplicated built-in profile as "${duplicateName}".`, "success");
        return id;
      }

      const id = await saveFrameProfile(profileName, data);
      setActiveProfileId(id);
      setActiveProfileKind("user");
      onCatalogueChanged();
      setMessage(`Saved locally as "${profileName.trim()}".`, "success");
      return id;
    } finally {
      setIsSavingLocally(false);
    }
  }, [framing, isActiveBuiltin, onCatalogueChanged, profileName, setMessage]);

  const handlePublishToCloud = useCallback(async () => {
    if (!cloudPublishEnabled) {
      setMessage("Cloud publishing is not configured.", "error");
      return;
    }

    setIsPublishing(true);
    try {
      const data = await framing.exportFrameProfile();
      if (!data) {
        setMessage("Upload and calibrate a frame sample before publishing.", "error");
        return;
      }

      const result = await publishCloudFrameProfile({
        profile: data,
        name: profileName,
        category: profileCategory,
        cloudProfileId: isActiveCloud ? activeProfileId : null,
      });

      setActiveProfileId(result.id);
      setActiveProfileKind("cloud");
      onCatalogueChanged();
      setMessage(`Published "${profileName.trim()}" to cloud.`, "success");
      return result.id;
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to publish profile to cloud.",
        "error",
      );
    } finally {
      setIsPublishing(false);
    }
  }, [
    activeProfileId,
    cloudPublishEnabled,
    framing,
    isActiveCloud,
    onCatalogueChanged,
    profileCategory,
    profileName,
    setMessage,
  ]);

  const handleUnpublishFromCloud = useCallback(async () => {
    if (!isActiveCloud || !activeProfileId) {
      setMessage("Select a cloud profile to unpublish.", "error");
      return;
    }

    if (
      !window.confirm(
        `Unpublish "${profileName}" from the cloud catalogue? Users will no longer see it.`,
      )
    ) {
      return;
    }

    setIsPublishing(true);
    try {
      await unpublishCloudFrameProfile(activeProfileId);
      onCatalogueChanged();
      setMessage(`Unpublished "${profileName}" from cloud.`, "success");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to unpublish cloud profile.",
        "error",
      );
    } finally {
      setIsPublishing(false);
    }
  }, [activeProfileId, isActiveCloud, onCatalogueChanged, profileName, setMessage]);

  const handleDuplicateBuiltin = useCallback(
    async (id: string) => {
      const record = await loadCatalogueFrameProfile(id);
      if (!record || record.kind !== "builtin") {
        setMessage("Built-in profile not found.", "error");
        return;
      }
      const duplicateName = `${record.name} (copy)`;
      const data = await framing.exportFrameProfile();
      const exportData = data ?? record.data;
      const newId = await saveFrameProfile(duplicateName, exportData);
      setActiveProfileId(newId);
      setActiveProfileKind("user");
      setProfileName(duplicateName);
      importFrameProfile(exportData);
      onCatalogueChanged();
      setMessage(`Duplicated "${record.name}" as "${duplicateName}".`, "success");
    },
    [framing, importFrameProfile, onCatalogueChanged, setMessage],
  );

  const handleRename = async () => {
    if (isActiveBuiltin || isActiveCloud) {
      setMessage(
        isActiveCloud
          ? "Cloud profiles are renamed when you publish an update."
          : "Built-in profiles cannot be renamed. Duplicate to create an editable copy.",
        "error",
      );
      return;
    }
    if (!activeProfileId) {
      await handleSaveLocally();
      return;
    }
    await renameFrameProfile(activeProfileId, profileName);
    onCatalogueChanged();
    setMessage("Profile renamed.", "success");
  };

  const handleDeleteActive = async () => {
    if (isActiveBuiltin || isActiveCloud) {
      setMessage(
        isActiveCloud
          ? "Use Unpublish from cloud to remove a cloud profile from the catalogue."
          : "Built-in profiles cannot be deleted.",
        "error",
      );
      return;
    }
    if (!activeProfileId) {
      setMessage("Save the profile first, or select one from the list.", "error");
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
    setActiveProfileKind(null);
    setProfileName("New frame profile");
    framing.setCustomFrameFile(null);
    setMessage(`Deleted "${deletedName}".`, "success");
  };

  const handleProfileDeletedFromList = (id: string) => {
    if (activeProfileId === id) {
      setActiveProfileId(null);
      setActiveProfileKind(null);
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

          <div>
            <label className="mb-1 block fs-caption font-medium" htmlFor="profile-category">
              Category
            </label>
            <select
              id="profile-category"
              value={profileCategory}
              onChange={(event) => setProfileCategory(event.target.value)}
              className="fs-input text-sm"
            >
              {FRAME_PROFILE_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
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
              onClick={() => void handleSaveLocally()}
              disabled={isSavingLocally || isPublishing}
              className="fs-btn fs-btn-primary w-full py-2"
            >
              {isSavingLocally
                ? "Saving locally…"
                : isActiveBuiltin
                  ? "Duplicate to my profiles"
                  : "Save locally"}
            </button>
            {cloudPublishEnabled ? (
              <>
                <button
                  type="button"
                  onClick={() => void handlePublishToCloud()}
                  disabled={isPublishing || isSavingLocally || !framing.customFrameFile}
                  className="fs-btn fs-btn-secondary w-full py-2"
                >
                  {isPublishing
                    ? "Publishing…"
                    : isActiveCloud
                      ? "Update cloud profile"
                      : "Publish to cloud"}
                </button>
                <button
                  type="button"
                  onClick={() => void handleUnpublishFromCloud()}
                  disabled={!isActiveCloud || isPublishing || isSavingLocally}
                  className="fs-btn fs-btn-secondary w-full py-2"
                >
                  Unpublish from cloud
                </button>
              </>
            ) : (
              <p className="text-[10px] text-fs-muted-light">
                Cloud publishing requires Supabase environment variables.
              </p>
            )}
            <button
              type="button"
              onClick={() => void handleRename()}
              className="fs-btn fs-btn-secondary w-full py-2"
              disabled={
                isActiveBuiltin ||
                isActiveCloud ||
                (!activeProfileId && !framing.customFrameFile)
              }
            >
              Rename
            </button>
            <button
              type="button"
              onClick={() => void handleDeleteActive()}
              className="fs-btn fs-btn-danger w-full py-2"
              disabled={!activeProfileId || isActiveBuiltin || isActiveCloud}
            >
              Delete local profile
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

          {status ? (
            <p
              className={`fs-caption ${
                statusTone === "error"
                  ? "rounded-lg border border-fs-warning/25 bg-fs-warning-bg px-2 py-1.5 text-fs-warning"
                  : statusTone === "success"
                    ? "rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-emerald-800"
                    : ""
              }`}
            >
              {status}
            </p>
          ) : null}
          <p className="text-[11px] text-fs-muted-light">
            Local copies stay in this browser. Cloud profiles are shared with all users when
            published.
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
