"use client";

import { useMemo } from "react";
import type { UseFramingStateReturn } from "../../framing.types";
import type { UseEnvironmentStateReturn } from "../../hooks/useEnvironmentState";
import { computePreviewDimensionsSummary } from "../../utils/previewDimensions";
import type { ExportMode, FrameCatalogueSelection, WorkspaceSectionId } from "../../ui/appUi.types";
import { ExportPanel } from "../ExportPanel";
import { FrameWidthInput } from "../FrameWidthInput";
import { MatControls } from "../MatControls";
import { CollapsibleSection } from "../ui/CollapsibleSection";
import { FrameCatalogue } from "./FrameCatalogue";
import { EnvironmentCatalogue } from "./EnvironmentCatalogue";
import { EnvironmentPlacementControls } from "./EnvironmentPlacementControls";

interface FrameEnvironmentColumnProps {
  framing: UseFramingStateReturn;
  environment: UseEnvironmentStateReturn;
  openSection: WorkspaceSectionId;
  onToggleSection: (id: WorkspaceSectionId) => void;
  frameSelection: FrameCatalogueSelection | null;
  onSelectBuiltinFrame: (id: string) => void;
  onSelectProfileFrame: (id: string, kind: "builtin-profile" | "profile") => void;
  onManageProfiles: () => void;
  catalogueRefreshKey: number;
  centerView: import("../../ui/appUi.types").CenterView;
  exportMode: ExportMode;
  onExportModeChange: (mode: ExportMode) => void;
}

export function FrameEnvironmentColumn({
  framing,
  environment,
  openSection,
  onToggleSection,
  frameSelection,
  onSelectBuiltinFrame,
  onSelectProfileFrame,
  onManageProfiles,
  catalogueRefreshKey,
  centerView,
  exportMode,
  onExportModeChange,
}: FrameEnvironmentColumnProps) {
  const sizeSummary = useMemo(
    () =>
      computePreviewDimensionsSummary(
        framing.canvasSize,
        framing.frameWidthCm,
        framing.matSettings,
      ),
    [framing.canvasSize, framing.frameWidthCm, framing.matSettings],
  );

  return (
    <nav className="flex h-full w-full flex-col overflow-y-auto bg-fs-surface">
      <div className="border-b border-fs-border px-4 py-3">
        <p className="fs-subheading text-sm">Frame &amp; room</p>
        <p className="text-[11px] text-fs-muted">Choose a frame and place your work in context.</p>
      </div>

      <CollapsibleSection
        id="frame"
        title="Frame"
        isOpen={openSection === "frame"}
        onToggle={onToggleSection}
      >
        <FrameCatalogue
          selection={frameSelection}
          catalogueRefreshKey={catalogueRefreshKey}
          onSelectBuiltin={onSelectBuiltinFrame}
          onSelectProfile={(id, data, kind) => {
            onSelectProfileFrame(id, kind);
            framing.importFrameProfile(data);
          }}
        />
        <FrameWidthInput
          frameWidthCm={framing.frameWidthCm}
          onFrameWidthChange={framing.setFrameWidthCm}
        />
        <MatControls
          matSettings={framing.matSettings}
          onMatSettingsChange={framing.setMatSettings}
        />
        <button
          type="button"
          onClick={onManageProfiles}
          className="fs-btn fs-btn-ghost w-full border border-dashed border-fs-border-strong py-2 text-sm"
        >
          Manage frame profiles
        </button>
      </CollapsibleSection>

      <CollapsibleSection
        id="environment"
        title="Environment / background"
        isOpen={openSection === "environment"}
        onToggle={onToggleSection}
      >
        <EnvironmentCatalogue
          selection={environment.selection}
          refreshKey={environment.environmentCatalogueRevision}
          onSelectBuiltin={environment.selectBuiltinEnvironment}
          onSelectSaved={(id) => void environment.selectSavedEnvironment(id)}
          onCatalogueChanged={environment.notifyEnvironmentCatalogueChanged}
          onCalibrationSaved={environment.applySavedCalibration}
        />
        {centerView === "environment" && environment.hasWallCalibration ? (
          <EnvironmentPlacementControls
            placement={environment.placement}
            onChange={environment.updatePlacement}
            onReset={environment.resetPlacement}
          />
        ) : null}
      </CollapsibleSection>

      <CollapsibleSection
        id="export"
        title="Export"
        isOpen={openSection === "export"}
        onToggle={onToggleSection}
      >
        <ExportPanel
          exportMode={exportMode}
          onExportModeChange={onExportModeChange}
          environmentImageUrl={environment.environmentImageUrl}
          environmentPlacement={environment.placement}
          environmentCalibration={environment.calibration}
          framedWidthCm={sizeSummary.totalWidthCm}
          framedHeightCm={sizeSummary.totalHeightCm}
          canExportEnvironment={
            Boolean(environment.environmentImageUrl) && environment.hasWallCalibration
          }
        />
      </CollapsibleSection>
    </nav>
  );
}
