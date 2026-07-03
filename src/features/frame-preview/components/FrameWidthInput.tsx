"use client";

interface FrameWidthInputProps {
  frameWidthCm: number;
  onFrameWidthChange: (width: number) => void;
}

export function FrameWidthInput({ frameWidthCm, onFrameWidthChange }: FrameWidthInputProps) {
  return (
    <section className="space-y-2">
      <h2 className="fs-subheading text-sm">Frame width</h2>
      <label className="space-y-1">
        <span className="fs-caption">Width (cm)</span>
        <input
          type="number"
          min={0.5}
          step={0.1}
          value={frameWidthCm}
          onChange={(e) => onFrameWidthChange(parseFloat(e.target.value) || 0)}
          className="fs-input"
        />
      </label>
    </section>
  );
}
