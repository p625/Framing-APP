"use client";

import { useCallback, useMemo } from "react";
import { AppHeader } from "./components/layout/AppHeader";
import { BottomInfoBar } from "./components/layout/BottomInfoBar";
import { ProfileEditorMode } from "./components/profile-editor/ProfileEditorMode";
import { CenterWorkspace } from "./components/workspace/CenterWorkspace";
import { WorkspaceSidebar } from "./components/workspace/WorkspaceSidebar";
import { useAppUiState } from "./hooks/useAppUiState";
import { useFramingState } from "./hooks/useFramingState";
import { SAMPLE_FRAMES } from "./sampleFrames";
import { computePreviewDimensionsSummary } from "./utils/previewDimensions";

export function FramingApp() {
  const framing = useFramingState();
  const ui = useAppUiState();

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

  const handleCreateProfile = useCallback(() => {
    framing.setCustomFrameFile(null);
    framing.setFrameSampleMode("corner");
    ui.enterProfileEditor(null);
  }, [framing, ui]);

  const handleOpenSettings = useCallback(() => {
    ui.enterProfileEditor(null);
  }, [ui]);

  if (ui.appMode === "profile-editor") {
    return (
      <div className="flex h-screen flex-col bg-zinc-50">
        <AppHeader
          mode="profile-editor"
          onOpenSettings={handleOpenSettings}
          onExitProfileEditor={ui.exitProfileEditor}
          onCreateProfile={handleCreateProfile}
        />
        <ProfileEditorMode framing={framing} editingProfileId={ui.editingProfileId} />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-zinc-100">
      <AppHeader
        mode="workspace"
        onOpenSettings={handleOpenSettings}
        onExitProfileEditor={ui.exitProfileEditor}
        onCreateProfile={handleCreateProfile}
      />

      <div className="flex min-h-0 flex-1">
        <aside className="w-72 shrink-0 border-r border-zinc-200 bg-white shadow-sm xl:w-80">
          <WorkspaceSidebar
            framing={framing}
            openSection={ui.openSection}
            onToggleSection={ui.openSectionToggle}
            frameSelection={ui.frameSelection}
            onSelectBuiltinFrame={handleSelectBuiltinFrame}
            onSelectProfileFrame={handleSelectProfileFrame}
            onOpenPerspective={() => ui.openCenterView("perspective")}
            onOpenCrop={() => ui.openCenterView("crop")}
            onCreateProfile={handleCreateProfile}
          />
        </aside>

        <main className="flex min-w-0 flex-[4] flex-col">
          <div className="min-h-0 flex-1">
            <CenterWorkspace
              framing={framing}
              centerView={ui.centerView}
              onReturnToPreview={ui.returnToPreview}
              selectedFrame={selectedFrame}
              frameSampleMode={frameSampleMode}
            />
          </div>
          <BottomInfoBar summary={sizeSummary} />
        </main>
      </div>
    </div>
  );
}
