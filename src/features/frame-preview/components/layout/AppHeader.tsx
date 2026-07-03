"use client";

import type { AppMode } from "../../ui/appUi.types";

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
    <header className="flex shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-5 py-3 shadow-sm">
      <div>
        <h1 className="text-base font-semibold tracking-tight text-zinc-900">
          {isProfileEditor ? "Frame Profile Editor" : "Framing Studio"}
        </h1>
        <p className="text-xs text-zinc-500">
          {isProfileEditor
            ? "Create and calibrate frame profiles for your catalogue."
            : "Professional framing preview — focused on your artwork."}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {isProfileEditor ? (
          <button
            type="button"
            onClick={onExitProfileEditor}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50"
          >
            Back to workspace
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={onCreateProfile}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50"
            >
              New frame profile
            </button>
            <button
              type="button"
              onClick={onOpenSettings}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50"
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
