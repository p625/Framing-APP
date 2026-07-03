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
    link.download = "framestudio-preview.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, [canvasId]);

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleExport}
        className="fs-btn fs-btn-primary w-full px-4 py-2.5 text-sm"
      >
        Download PNG preview
      </button>
      <p className="fs-caption">PDF export coming soon.</p>
    </div>
  );
}
