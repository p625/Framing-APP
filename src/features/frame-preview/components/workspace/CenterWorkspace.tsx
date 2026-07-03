"use client";

import type { FrameDefinition, FrameSampleMode, UseFramingStateReturn } from "../../framing.types";
import type { CenterView } from "../../ui/appUi.types";
import { ArtworkCropper } from "../ArtworkCropper";
import { PerspectiveEditor } from "../PerspectiveEditor";
import { PreviewCanvas } from "../PreviewCanvas";

interface CenterWorkspaceProps {
  framing: UseFramingStateReturn;
  centerView: CenterView;
  onReturnToPreview: () => void;
  selectedFrame: FrameDefinition | null;
  frameSampleMode: FrameSampleMode;
}

export function CenterWorkspace({
  framing,
  centerView,
  onReturnToPreview,
  selectedFrame,
  frameSampleMode,
}: CenterWorkspaceProps) {
  const cropSourceUrl = framing.correctedArtworkUrl ?? framing.artworkPreviewUrl;

  if (centerView === "perspective") {
    return (
      <PerspectiveEditor
        artworkPreviewUrl={framing.artworkPreviewUrl}
        perspectiveCorners={framing.perspectiveCorners}
        correctedArtworkUrl={framing.correctedArtworkUrl}
        onCornersChange={framing.setPerspectiveCorners}
        onStraighten={framing.straightenArtwork}
        onReset={framing.resetPerspective}
        displayMode="workspace"
        onDone={onReturnToPreview}
        onCancel={onReturnToPreview}
      />
    );
  }

  if (centerView === "crop") {
    return (
      <ArtworkCropper
        cropSourceUrl={cropSourceUrl}
        cropEditorKey={framing.cropEditorKey}
        canvasSize={framing.canvasSize}
        cropSettings={framing.cropSettings}
        croppedArtworkUrl={framing.croppedArtworkUrl}
        onCropSettingsChange={framing.setCropSettings}
        onApplyCrop={framing.applyCrop}
        onResetCrop={framing.resetCrop}
        displayMode="workspace"
        onDone={onReturnToPreview}
        onCancel={onReturnToPreview}
      />
    );
  }

  return (
    <PreviewCanvas
      artworkImageUrl={framing.artworkImageUrl}
      canvasSize={framing.canvasSize}
      frame={selectedFrame}
      customFrameTextureUrl={framing.customFrameTextureUrl}
      customFrameFallbackColor={framing.customFrameFallbackColor}
      frameSampleMode={frameSampleMode}
      frameCornerCalibration={framing.frameCornerCalibration}
      frameWidthCm={framing.frameWidthCm}
      textureScale={framing.textureScale}
      matSettings={framing.matSettings}
      fillContainer
    />
  );
}
