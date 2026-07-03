"use client";

import type { UseFramingStateReturn } from "../../framing.types";
import type { WorkspaceSectionId } from "../../ui/appUi.types";
import { ArtworkUploader } from "../ArtworkUploader";
import { SizeInputs } from "../SizeInputs";
import { CollapsibleSection } from "../ui/CollapsibleSection";
import { SavedArtworksGrid } from "./SavedArtworksGrid";

interface ArtworkColumnProps {
  framing: UseFramingStateReturn;
  openSection: WorkspaceSectionId;
  onToggleSection: (id: WorkspaceSectionId) => void;
  onOpenPerspective: () => void;
  onOpenCrop: () => void;
}

export function ArtworkColumn({
  framing,
  openSection,
  onToggleSection,
  onOpenPerspective,
  onOpenCrop,
}: ArtworkColumnProps) {
  const hasArtwork = Boolean(framing.artworkFile);
  const canCrop = Boolean(framing.correctedArtworkUrl ?? framing.artworkPreviewUrl);

  return (
    <nav className="flex h-full w-full flex-col overflow-y-auto bg-fs-surface">
      <div className="border-b border-fs-border px-4 py-3">
        <p className="fs-subheading text-sm">Your picture</p>
        <p className="text-[11px] text-fs-muted">Upload, prepare, and size your artwork.</p>
      </div>

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
        <div className="grid grid-cols-1 gap-2">
          <button
            type="button"
            disabled={!hasArtwork}
            onClick={onOpenPerspective}
            className="fs-btn fs-btn-secondary w-full py-2.5 text-sm"
          >
            Straighten perspective
          </button>
          <button
            type="button"
            disabled={!canCrop}
            onClick={onOpenCrop}
            className="fs-btn fs-btn-secondary w-full py-2.5 text-sm"
          >
            Crop artwork
          </button>
        </div>
        <p className="fs-caption text-[11px]">
          Opens in the center workspace. Your columns stay in place.
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
    </nav>
  );
}
