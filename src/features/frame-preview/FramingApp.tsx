"use client";

import { useCallback, useMemo } from "react";
import { AppHeader } from "./components/layout/AppHeader";
import { BottomInfoBar } from "./components/layout/BottomInfoBar";
import { ProfileEditorMode } from "./components/profile-editor/ProfileEditorMode";
import { ArtworkColumn } from "./components/workspace/ArtworkColumn";
import { CenterToolbar } from "./components/workspace/CenterToolbar";
import { CenterWorkspace } from "./components/workspace/CenterWorkspace";
import { FrameEnvironmentColumn } from "./components/workspace/FrameEnvironmentColumn";
import { useAppUiState } from "./hooks/useAppUiState";
import { useEnvironmentState } from "./hooks/useEnvironmentState";
import { useFramingState } from "./hooks/useFramingState";
import { SAMPLE_FRAMES } from "./sampleFrames";
import { computePreviewDimensionsSummary } from "./utils/previewDimensions";

export function FramingApp() {
  const framing = useFramingState();
  const ui = useAppUiState();
  const environment = useEnvironmentState();

  const selectedFrame =
    SAMPLE_FRAMES.find((frame) => frame.id === framing.selectedFrameId) ?? null;

  const frameSampleMode = framing.customFrameFile
    ? framing.frameSampleMode
    : (selectedFrame?.sampleMode ?? framing.frameSampleMode);

  const sizeSummary = useMemo(
    () =>
      computePreviewDimensionsSummary(
        framing.canvasSize,
        framing.frameWidthCm,
        framing.matSettings,
      ),
    [framing.canvasSize, framing.frameWidthCm, framing.matSettings],
  );

  const handleSelectBuiltinFrame = useCallback(
    (id: string) => {
      framing.setSelectedFrameId(id);
      framing.setCustomFrameFile(null);
      ui.setFrameSelection({ kind: "builtin", id });
      const frame = SAMPLE_FRAMES.find((item) => item.id === id);
      if (frame?.sampleMode) {
        framing.setFrameSampleMode(frame.sampleMode);
      }
    },
    [framing, ui],
  );

  const handleSelectProfileFrame = useCallback(
    (id: string) => {
      ui.setFrameSelection({ kind: "profile", id });
    },
    [ui],
  );

  const handleManageProfiles = useCallback(() => {
    framing.setCustomFrameFile(null);
    framing.setFrameSampleMode("corner");
    ui.enterProfileEditor(null);
  }, [framing, ui]);

  const handleProfileDeleted = useCallback(
    (id: string) => {
      if (ui.frameSelection?.kind === "profile" && ui.frameSelection.id === id) {
        handleSelectBuiltinFrame("oak");
      }
    },
    [handleSelectBuiltinFrame, ui.frameSelection],
  );

  if (ui.appMode === "profile-editor") {
    return (
      <div className="flex h-screen flex-col bg-fs-bg">
        <AppHeader mode="profile-editor" onExitProfileEditor={ui.exitProfileEditor} />
        <ProfileEditorMode
          key={ui.editingProfileId ?? "new-profile"}
          framing={framing}
          editingProfileId={ui.editingProfileId}
          catalogueRefreshKey={ui.profileCatalogueRevision}
          onProfileDeleted={handleProfileDeleted}
          onCatalogueChanged={ui.notifyProfileCatalogueChanged}
        />
      </div>
    );
  }

  const hasArtwork = Boolean(framing.artworkFile);
  const canCrop = Boolean(framing.correctedArtworkUrl ?? framing.artworkPreviewUrl);
  const hasEnvironment = Boolean(environment.environmentImageUrl);

  return (
    <div className="flex h-screen flex-col bg-fs-bg">
      <AppHeader mode="workspace" onExitProfileEditor={ui.exitProfileEditor} />

      <div className="flex min-h-0 flex-1 flex-col xl:flex-row">
        <aside className="fs-sidebar order-2 max-h-[38vh] w-full shrink-0 overflow-hidden border-t border-fs-border xl:order-1 xl:max-h-none xl:w-[min(100%,300px)] xl:border-r xl:border-t-0">
          <ArtworkColumn
            framing={framing}
            openSection={ui.openSection}
            onToggleSection={ui.openSectionToggle}
            onOpenPerspective={() => ui.openCenterView("perspective")}
            onOpenCrop={() => ui.openCenterView("crop")}
          />
        </aside>

        <main className="order-1 flex min-h-0 min-w-0 flex-1 flex-col xl:order-2">
          <CenterToolbar
            centerView={ui.centerView}
            onChangeView={ui.openCenterView}
            hasArtwork={hasArtwork}
            canCrop={canCrop}
            hasEnvironment={hasEnvironment}
          />
          <div className="min-h-0 flex-1">
            <CenterWorkspace
              framing={framing}
              environment={environment}
              centerView={ui.centerView}
              onReturnToPreview={ui.returnToPreview}
              selectedFrame={selectedFrame}
              frameSampleMode={frameSampleMode}
            />
          </div>
          <BottomInfoBar summary={sizeSummary} />
        </main>

        <aside className="fs-sidebar order-3 max-h-[38vh] w-full shrink-0 overflow-hidden border-t border-fs-border xl:max-h-none xl:w-[min(100%,340px)] xl:border-l xl:border-t-0">
          <FrameEnvironmentColumn
            framing={framing}
            environment={environment}
            openSection={ui.openSection}
            onToggleSection={ui.openSectionToggle}
            frameSelection={ui.frameSelection}
            onSelectBuiltinFrame={handleSelectBuiltinFrame}
            onSelectProfileFrame={handleSelectProfileFrame}
            onManageProfiles={handleManageProfiles}
            catalogueRefreshKey={ui.profileCatalogueRevision}
            centerView={ui.centerView}
            exportMode={ui.exportMode}
            onExportModeChange={ui.setExportMode}
          />
        </aside>
      </div>
    </div>
  );
}
