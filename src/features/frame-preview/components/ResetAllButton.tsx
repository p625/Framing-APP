"use client";

import { useState } from "react";

interface ResetAllButtonProps {
  onResetAll: () => void;
}

export function ResetAllButton({ onResetAll }: ResetAllButtonProps) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-3">
        <p className="text-xs text-red-900">
          Reset everything? This clears artwork, crops, frame upload, and all settings.
        </p>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => {
              onResetAll();
              setConfirming(false);
            }}
            className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
          >
            Yes, reset all
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="rounded-md border border-red-200 px-3 py-1.5 text-xs text-red-800 hover:border-red-300"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="w-full rounded-md border border-zinc-200 px-3 py-2 text-xs text-zinc-600 transition-colors hover:border-zinc-300 hover:text-zinc-900"
    >
      Reset all
    </button>
  );
}
