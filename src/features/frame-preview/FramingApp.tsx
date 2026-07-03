"use client";

import { ArtworkCropper } from "./components/ArtworkCropper";
import { ArtworkUploader } from "./components/ArtworkUploader";
import { ExportPanel } from "./components/ExportPanel";
import { FrameSelector } from "./components/FrameSelector";
import { FrameUploader } from "./components/FrameUploader";
import { FrameWidthInput } from "./components/FrameWidthInput";
import { MatControls } from "./components/MatControls";
import { PerspectiveEditor } from "./components/PerspectiveEditor";
import { PreviewCanvas } from "./components/PreviewCanvas";
import { SizeInputs } from "./components/SizeInputs";
import { WorkflowSection } from "./components/WorkflowSection";
import { useFramingState } from "./hooks/useFramingState";
import { SAMPLE_FRAMES } from "./sampleFrames";

export function FramingApp() {
  const framing = useFramingState();

  const selectedFrame =
    SAMPLE_FRAMES.find((frame) => frame.id === framing.selectedFrameId) ?? null;

  const cropSourceUrl =
    framing.correctedArtworkUrl ?? framing.artworkPreviewUrl;

  const frameSampleMode = framing.customFrameFile
    ? framing.frameSampleMode
    : (selectedFrame?.sampleMode ?? framing.frameSampleMode);

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white px-6 py-4">
        <h1 className="text-lg font-semibold text-zinc-900">Frame Preview</h1>
        <p className="text-sm text-zinc-500">
          Straighten a photo of your artwork, crop it, then preview it in a real
          frame with accurate proportions.
        </p>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-4 lg:flex-row lg:p-6">
        <aside className="w-full shrink-0 space-y-1 rounded-xl border border-zinc-200 bg-white p-5 lg:w-80 xl:w-96">
          <WorkflowSection step={1} title="Upload artwork photo">
            <ArtworkUploader
              artworkFile={framing.artworkFile}
              onArtworkSelect={framing.setArtworkFile}
            />
          </WorkflowSection>

          <WorkflowSection step={2} title="Mark artwork corners">
            <PerspectiveEditor
              artworkPreviewUrl={framing.artworkPreviewUrl}
              perspectiveCorners={framing.perspectiveCorners}
              correctedArtworkUrl={framing.correctedArtworkUrl}
              onCornersChange={framing.setPerspectiveCorners}
              onStraighten={framing.straightenArtwork}
              onReset={framing.resetPerspective}
            />
          </WorkflowSection>

          <WorkflowSection step={3} title="Straighten & crop">
            <ArtworkCropper
              cropSourceUrl={cropSourceUrl}
              canvasSize={framing.canvasSize}
              cropSettings={framing.cropSettings}
              croppedArtworkUrl={framing.croppedArtworkUrl}
              onCropSettingsChange={framing.setCropSettings}
              onApplyCrop={framing.applyCrop}
              onResetCrop={framing.resetCrop}
            />
          </WorkflowSection>

          <WorkflowSection step={4} title="Set artwork size">
            <SizeInputs
              canvasSize={framing.canvasSize}
              onCanvasSizeChange={framing.setCanvasSize}
            />
          </WorkflowSection>

          <WorkflowSection step={5} title="Select frame sample">
            <FrameSelector
              selectedFrameId={framing.selectedFrameId}
              onFrameSelect={(id) => {
                framing.setSelectedFrameId(id);
                framing.setCustomFrameFile(null);
                const frame = SAMPLE_FRAMES.find((item) => item.id === id);
                if (frame?.sampleMode) {
                  framing.setFrameSampleMode(frame.sampleMode);
                }
              }}
            />
          </WorkflowSection>

          <WorkflowSection step={6} title="Upload frame sample">
            <FrameUploader
              customFrameFile={framing.customFrameFile}
              customFrameTextureUrl={framing.customFrameTextureUrl}
              frameSampleMode={framing.frameSampleMode}
              textureScale={framing.textureScale}
              onCustomFrameSelect={framing.setCustomFrameFile}
              onFrameSampleModeChange={framing.setFrameSampleMode}
              onTextureScaleChange={framing.setTextureScale}
            />
          </WorkflowSection>

          <WorkflowSection step={7} title="Set frame width">
            <FrameWidthInput
              frameWidthCm={framing.frameWidthCm}
              onFrameWidthChange={framing.setFrameWidthCm}
            />
          </WorkflowSection>

          <WorkflowSection step={8} title="Optional passe-partout">
            <MatControls
              matSettings={framing.matSettings}
              onMatSettingsChange={framing.setMatSettings}
            />
          </WorkflowSection>

          <WorkflowSection step={9} title="Download preview">
            <ExportPanel />
          </WorkflowSection>
        </aside>

        <main className="min-h-[400px] flex-1">
          <PreviewCanvas
            artworkImageUrl={framing.artworkImageUrl}
            canvasSize={framing.canvasSize}
            frame={selectedFrame}
            customFrameTextureUrl={framing.customFrameTextureUrl}
            frameSampleMode={frameSampleMode}
            frameWidthCm={framing.frameWidthCm}
            textureScale={framing.textureScale}
            matSettings={framing.matSettings}
          />
        </main>
      </div>
    </div>
  );
}
