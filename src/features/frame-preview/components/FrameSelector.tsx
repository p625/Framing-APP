"use client";

import { SAMPLE_FRAMES } from "../sampleFrames";

interface FrameSelectorProps {
  selectedFrameId: string | null;
  onFrameSelect: (id: string) => void;
}

export function FrameSelector({ selectedFrameId, onFrameSelect }: FrameSelectorProps) {
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-medium text-zinc-900">Frame texture</h2>
      <div className="grid grid-cols-2 gap-2">
        {SAMPLE_FRAMES.map((frame) => {
          const isSelected = selectedFrameId === frame.id;

          return (
            <button
              key={frame.id}
              type="button"
              onClick={() => onFrameSelect(frame.id)}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                isSelected
                  ? "border-zinc-900 bg-zinc-50"
                  : "border-zinc-200 hover:border-zinc-300"
              }`}
            >
              <span
                className="h-6 w-6 shrink-0 rounded border border-zinc-200"
                style={{ backgroundColor: frame.fallbackColor }}
                aria-hidden
              />
              <span className="text-zinc-700">{frame.name}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
