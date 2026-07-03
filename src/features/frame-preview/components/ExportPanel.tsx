"use client";

import { useCallback } from "react";

interface ExportPanelProps {
  canvasSelector?: string;
}

export function ExportPanel({ canvasSelector = "canvas" }: ExportPanelProps) {
  const handleExport = useCallback(() => {
    const canvas = document.querySelector<HTMLCanvasElement>(canvasSelector);
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = "framed-preview.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, [canvasSelector]);

  return (
    <section className="space-y-2 border-t border-zinc-200 pt-4">
      <h2 className="text-sm font-medium text-zinc-900">Export</h2>
      <button
        type="button"
        onClick={handleExport}
        className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
      >
        Download preview
      </button>
      <p className="text-xs text-zinc-500">Exports the current canvas preview as PNG.</p>
    </section>
  );
}
