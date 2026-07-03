"use client";

import { useCallback } from "react";
import type { EnvironmentPlacement } from "../framing.types";
import { exportEnvironmentPreviewDataUrl } from "../renderer/composeEnvironmentPreview";
import type { ExportMode } from "../ui/appUi.types";
import { ENVIRONMENT_FRAME_CANVAS_ID, PREVIEW_CANVAS_ID } from "./PreviewCanvas";

interface ExportPanelProps {
  exportMode?: ExportMode;
  onExportModeChange?: (mode: ExportMode) => void;
  canvasId?: string;
  environmentImageUrl?: string | null;
  environmentPlacement?: EnvironmentPlacement;
  canExportEnvironment?: boolean;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to load environment image"));
    image.src = url;
  });
}

export function ExportPanel({
  exportMode = "framed",
  onExportModeChange,
  canvasId = PREVIEW_CANVAS_ID,
  environmentImageUrl = null,
  environmentPlacement,
  canExportEnvironment = false,
}: ExportPanelProps) {
  const handleExportFramed = useCallback(() => {
    const canvas = document.getElementById(canvasId);
    if (!(canvas instanceof HTMLCanvasElement)) {
      const fallback = document.getElementById(PREVIEW_CANVAS_ID);
      if (!(fallback instanceof HTMLCanvasElement)) {
        return;
      }
      const link = document.createElement("a");
      link.download = "framestudio-framed.png";
      link.href = fallback.toDataURL("image/png");
      link.click();
      return;
    }

    const link = document.createElement("a");
    link.download = "framestudio-framed.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, [canvasId]);

  const handleExportEnvironment = useCallback(async () => {
    if (!environmentImageUrl || !environmentPlacement) {
      return;
    }

    const framedCanvas = document.getElementById(ENVIRONMENT_FRAME_CANVAS_ID);
    if (!(framedCanvas instanceof HTMLCanvasElement)) {
      return;
    }

    try {
      const environmentImage = await loadImage(environmentImageUrl);
      const dataUrl = exportEnvironmentPreviewDataUrl(
        environmentImage,
        framedCanvas,
        environmentPlacement,
      );
      const link = document.createElement("a");
      link.download = "framestudio-environment.png";
      link.href = dataUrl;
      link.click();
    } catch {
      handleExportFramed();
    }
  }, [environmentImageUrl, environmentPlacement, handleExportFramed]);

  const handleExport = useCallback(() => {
    if (exportMode === "environment" && canExportEnvironment) {
      void handleExportEnvironment();
      return;
    }
    handleExportFramed();
  }, [canExportEnvironment, exportMode, handleExportEnvironment, handleExportFramed]);

  return (
    <div className="space-y-3">
      {onExportModeChange ? (
        <div className="grid grid-cols-1 gap-2">
          <label className="flex cursor-pointer items-center gap-2 text-xs">
            <input
              type="radio"
              name="export-mode"
              checked={exportMode === "framed"}
              onChange={() => onExportModeChange("framed")}
            />
            Framed artwork only
          </label>
          <label
            className={`flex cursor-pointer items-center gap-2 text-xs ${
              !canExportEnvironment ? "opacity-50" : ""
            }`}
          >
            <input
              type="radio"
              name="export-mode"
              checked={exportMode === "environment"}
              onChange={() => onExportModeChange("environment")}
              disabled={!canExportEnvironment}
            />
            Environment scene
          </label>
        </div>
      ) : null}

      <button
        type="button"
        onClick={handleExport}
        className="fs-btn fs-btn-primary w-full px-4 py-2.5 text-sm"
      >
        {exportMode === "environment" && canExportEnvironment
          ? "Download environment PNG"
          : "Download framed PNG"}
      </button>
      <p className="fs-caption">PDF export coming soon.</p>
    </div>
  );
}
