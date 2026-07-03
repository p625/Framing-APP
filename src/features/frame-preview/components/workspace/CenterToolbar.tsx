"use client";

import type { CenterView } from "../../ui/appUi.types";

const VIEW_OPTIONS: { id: CenterView; label: string }[] = [
  { id: "preview", label: "Preview" },
  { id: "perspective", label: "Edit perspective" },
  { id: "crop", label: "Crop" },
  { id: "environment", label: "Environment view" },
];

interface CenterToolbarProps {
  centerView: CenterView;
  onChangeView: (view: CenterView) => void;
  hasArtwork: boolean;
  canCrop: boolean;
  hasEnvironment: boolean;
}

export function CenterToolbar({
  centerView,
  onChangeView,
  hasArtwork,
  canCrop,
  hasEnvironment,
}: CenterToolbarProps) {
  return (
    <div className="fs-toolbar shrink-0 border-b border-fs-border bg-fs-surface/95 px-4 py-2 backdrop-blur-sm">
      <div className="flex flex-wrap items-center gap-2">
        {VIEW_OPTIONS.map((option) => {
          const disabled =
            (option.id === "perspective" && !hasArtwork) ||
            (option.id === "crop" && !canCrop) ||
            (option.id === "environment" && !hasEnvironment);

          return (
            <button
              key={option.id}
              type="button"
              disabled={disabled}
              onClick={() => onChangeView(option.id)}
              className={`fs-btn px-3 py-1.5 text-xs ${
                centerView === option.id
                  ? "border-fs-primary bg-fs-gold-muted font-medium text-fs-primary"
                  : "fs-btn-secondary"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
