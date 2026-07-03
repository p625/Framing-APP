"use client";

import type { AppMode } from "../../ui/appUi.types";
import { BrandLockup } from "../brand/BrandLockup";

interface AppHeaderProps {
  mode: AppMode;
  onExitProfileEditor: () => void;
}

export function AppHeader({ mode, onExitProfileEditor }: AppHeaderProps) {
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
      {isProfileEditor ? (
        <button
          type="button"
          onClick={onExitProfileEditor}
          className="fs-btn fs-btn-secondary"
        >
          Back to workspace
        </button>
      ) : null}
    </header>
  );
}
