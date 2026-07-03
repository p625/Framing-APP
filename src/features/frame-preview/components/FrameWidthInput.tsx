"use client";

interface FrameWidthInputProps {
  frameWidthCm: number;
  onFrameWidthChange: (width: number) => void;
}

export function FrameWidthInput({ frameWidthCm, onFrameWidthChange }: FrameWidthInputProps) {
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-medium text-zinc-900">Frame width</h2>
      <label className="space-y-1">
        <span className="text-xs text-zinc-500">Width (cm)</span>
        <input
          type="number"
          min={0.5}
          step={0.1}
          value={frameWidthCm}
          onChange={(e) => onFrameWidthChange(parseFloat(e.target.value) || 0)}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
        />
      </label>
    </section>
  );
}
