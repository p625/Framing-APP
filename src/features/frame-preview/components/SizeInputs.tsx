"use client";

import type { CanvasSize } from "../framing.types";

interface SizeInputsProps {
  canvasSize: CanvasSize;
  onCanvasSizeChange: (size: Partial<CanvasSize>) => void;
}

export function SizeInputs({ canvasSize, onCanvasSizeChange }: SizeInputsProps) {
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-medium text-zinc-900">Canvas size</h2>
      <div className="grid grid-cols-2 gap-3">
        <label className="space-y-1">
          <span className="text-xs text-zinc-500">Width (cm)</span>
          <input
            type="number"
            min={1}
            step={0.1}
            value={canvasSize.widthCm}
            onChange={(e) =>
              onCanvasSizeChange({ widthCm: parseFloat(e.target.value) || 0 })
            }
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs text-zinc-500">Height (cm)</span>
          <input
            type="number"
            min={1}
            step={0.1}
            value={canvasSize.heightCm}
            onChange={(e) =>
              onCanvasSizeChange({ heightCm: parseFloat(e.target.value) || 0 })
            }
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          />
        </label>
      </div>
    </section>
  );
}
