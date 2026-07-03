"use client";

import type { AppMode } from "../../ui/appUi.types";
import { BrandLockup } from "../brand/BrandLockup";

interface AppHeaderProps {
  mode: AppMode;
  onOpenSettings: () => void;
  onExitProfileEditor: () => void;
  onCreateProfile: () => void;
}

export function AppHeader({
  mode,
  onOpenSettings,
  onExitProfileEditor,
  onCreateProfile,
}: AppHeaderProps) {
  const isProfileEditor = mode === "profile-editor";

  return (
    <header className="fs-header flex shrink-0 items-center justify-between px-5 py-3">
      <BrandLockup
        showTagline={!isProfileEditor}
        subtitle={
          isProfileEditor
            ? "Frame profile editor — calibrate samples for your catalogue"
            : undefined
        }
      />
      <div className="flex items-center gap-2">
        {isProfileEditor ? (
          <button
            type="button"
            onClick={onExitProfileEditor}
            className="fs-btn fs-btn-secondary"
          >
            Back to workspace
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={onCreateProfile}
              className="fs-btn fs-btn-gold"
            >
              New frame profile
            </button>
            <button
              type="button"
              onClick={onOpenSettings}
              className="fs-btn fs-btn-secondary"
              aria-label="Open frame profile editor"
            >
              Settings
            </button>
          </>
        )}
      </div>
    </header>
  );
}
