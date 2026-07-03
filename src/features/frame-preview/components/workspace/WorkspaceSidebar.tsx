"use client";

import type { UseFramingStateReturn } from "../../framing.types";
import type { SidebarSectionId } from "../../ui/appUi.types";
import { ArtworkUploader } from "../ArtworkUploader";
import { ExportPanel } from "../ExportPanel";
import { FrameWidthInput } from "../FrameWidthInput";
import { MatControls } from "../MatControls";
import { SizeInputs } from "../SizeInputs";
import { CollapsibleSection } from "../ui/CollapsibleSection";
import { FrameCatalogue } from "./FrameCatalogue";
import { SavedArtworksGrid } from "./SavedArtworksGrid";
import type { FrameCatalogueSelection } from "../../ui/appUi.types";

interface WorkspaceSidebarProps {
  framing: UseFramingStateReturn;
  openSection: SidebarSectionId;
  onToggleSection: (id: SidebarSectionId) => void;
  frameSelection: FrameCatalogueSelection | null;
  onSelectBuiltinFrame: (id: string) => void;
  onSelectProfileFrame: (id: string) => void;
  onOpenPerspective: () => void;
  onOpenCrop: () => void;
  onCreateProfile: () => void;
}

export function WorkspaceSidebar({
  framing,
  openSection,
  onToggleSection,
  frameSelection,
  onSelectBuiltinFrame,
  onSelectProfileFrame,
  onOpenPerspective,
  onOpenCrop,
  onCreateProfile,
}: WorkspaceSidebarProps) {
  const hasArtwork = Boolean(framing.artworkFile);
  const canCrop = Boolean(framing.correctedArtworkUrl ?? framing.artworkPreviewUrl);

  return (
    <nav className="flex h-full flex-col overflow-y-auto bg-white">
      <CollapsibleSection
        id="artwork"
        title="Artwork"
        isOpen={openSection === "artwork"}
        onToggle={onToggleSection}
      >
        <ArtworkUploader
          artworkFile={framing.artworkFile}
          onArtworkSelect={framing.setArtworkFile}
        />
        <SavedArtworksGrid
          onExportProject={framing.exportSerializableProject}
          onImportProject={framing.importSerializableProject}
        />
      </CollapsibleSection>

      <CollapsibleSection
        id="preparation"
        title="Artwork preparation"
        isOpen={openSection === "preparation"}
        onToggle={onToggleSection}
      >
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={!hasArtwork}
            onClick={onOpenPerspective}
            className="rounded-xl border border-zinc-200 px-3 py-3 text-xs font-medium text-zinc-800 transition-colors hover:border-zinc-300 hover:bg-zinc-50 disabled:opacity-40"
          >
            Perspective
          </button>
          <button
            type="button"
            disabled={!canCrop}
            onClick={onOpenCrop}
            className="rounded-xl border border-zinc-200 px-3 py-3 text-xs font-medium text-zinc-800 transition-colors hover:border-zinc-300 hover:bg-zinc-50 disabled:opacity-40"
          >
            Crop
          </button>
        </div>
        <p className="text-[11px] leading-relaxed text-zinc-400">
          Opens the editor in the main workspace. Your sidebar stays clean.
        </p>
      </CollapsibleSection>

      <CollapsibleSection
        id="size"
        title="Artwork size"
        isOpen={openSection === "size"}
        onToggle={onToggleSection}
      >
        <SizeInputs
          canvasSize={framing.canvasSize}
          onCanvasSizeChange={framing.setCanvasSize}
        />
      </CollapsibleSection>

      <CollapsibleSection
        id="frame"
        title="Frame"
        isOpen={openSection === "frame"}
        onToggle={onToggleSection}
      >
        <FrameCatalogue
          selection={frameSelection}
          onSelectBuiltin={onSelectBuiltinFrame}
          onSelectProfile={(_id, data) => {
            onSelectProfileFrame(_id);
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
          onClick={onCreateProfile}
          className="w-full rounded-lg border border-dashed border-zinc-300 px-3 py-2 text-xs text-zinc-500 transition-colors hover:border-zinc-400 hover:text-zinc-700"
        >
          Create new frame profile…
        </button>
      </CollapsibleSection>

      <CollapsibleSection
        id="export"
        title="Export"
        isOpen={openSection === "export"}
        onToggle={onToggleSection}
      >
        <ExportPanel />
        <p className="text-[11px] text-zinc-400">PDF export coming soon.</p>
      </CollapsibleSection>
    </nav>
  );
}
