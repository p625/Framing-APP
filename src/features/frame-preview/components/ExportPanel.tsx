"use client";

import { useCallback } from "react";
import { PREVIEW_CANVAS_ID } from "./PreviewCanvas";

interface ExportPanelProps {
  canvasId?: string;
}

export function ExportPanel({ canvasId = PREVIEW_CANVAS_ID }: ExportPanelProps) {
  const handleExport = useCallback(() => {
    const canvas = document.getElementById(canvasId);
    if (!(canvas instanceof HTMLCanvasElement)) return;

    const link = document.createElement("a");
    link.download = "framed-preview.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, [canvasId]);

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleExport}
        className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
      >
        Download preview
      </button>
      <p className="text-xs text-zinc-500">
        Exports the full-resolution framed preview as PNG.
      </p>
    </div>
  );
}
