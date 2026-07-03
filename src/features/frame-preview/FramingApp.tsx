"use client";

import { ArtworkCropper } from "./components/ArtworkCropper";
import { ArtworkUploader } from "./components/ArtworkUploader";
import { ExportPanel } from "./components/ExportPanel";
import { FrameSelector } from "./components/FrameSelector";
import { FrameUploader } from "./components/FrameUploader";
import { FrameWidthInput } from "./components/FrameWidthInput";
import { PreviewCanvas } from "./components/PreviewCanvas";
import { SizeInputs } from "./components/SizeInputs";
import { useFramingState } from "./hooks/useFramingState";
import { SAMPLE_FRAMES } from "./sampleFrames";

export function FramingApp() {
  const framing = useFramingState();

  const selectedFrame =
    SAMPLE_FRAMES.find((frame) => frame.id === framing.selectedFrameId) ?? null;

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white px-6 py-4">
        <h1 className="text-lg font-semibold text-zinc-900">Frame Preview</h1>
        <p className="text-sm text-zinc-500">
          Upload artwork, set dimensions, and preview your framed piece.
        </p>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-4 lg:flex-row lg:p-6">
        <aside className="w-full shrink-0 space-y-6 rounded-xl border border-zinc-200 bg-white p-5 lg:w-80 xl:w-96">
          <ArtworkUploader
            artworkFile={framing.artworkFile}
            onArtworkSelect={framing.setArtworkFile}
          />
          <ArtworkCropper
            artworkPreviewUrl={framing.artworkPreviewUrl}
            cropRect={framing.cropRect}
            onCropChange={framing.setCropRect}
          />
          <SizeInputs
            canvasSize={framing.canvasSize}
            onCanvasSizeChange={framing.setCanvasSize}
          />
          <FrameSelector
            selectedFrameId={framing.selectedFrameId}
            onFrameSelect={(id) => {
              framing.setSelectedFrameId(id);
              framing.setCustomFrameFile(null);
            }}
          />
          <FrameUploader
            customFrameFile={framing.customFrameFile}
            onCustomFrameSelect={framing.setCustomFrameFile}
          />
          <FrameWidthInput
            frameWidthCm={framing.frameWidthCm}
            onFrameWidthChange={framing.setFrameWidthCm}
          />
          <ExportPanel />
        </aside>

        <main className="min-h-[400px] flex-1">
          <PreviewCanvas
            artworkImageUrl={framing.artworkPreviewUrl}
            cropRect={framing.cropRect}
            canvasSize={framing.canvasSize}
            frame={selectedFrame}
            customFrameTextureUrl={framing.customFrameTextureUrl}
            frameWidthCm={framing.frameWidthCm}
          />
        </main>
      </div>
    </div>
  );
}
