"use client";

import type { PreviewDimensionsSummary } from "../../utils/previewDimensions";
import { formatCm } from "../../utils/previewDimensions";

interface BottomInfoBarProps {
  summary: PreviewDimensionsSummary;
}

export function BottomInfoBar({ summary }: BottomInfoBarProps) {
  return (
    <footer className="flex shrink-0 flex-wrap items-center gap-x-6 gap-y-2 border-t border-zinc-200 bg-white px-5 py-3 text-xs text-zinc-600 shadow-[0_-4px_24px_rgba(0,0,0,0.04)]">
      <InfoItem
        label="Artwork"
        value={`${formatCm(summary.artworkWidthCm)} × ${formatCm(summary.artworkHeightCm)} cm`}
      />
      <InfoItem label="Frame" value={`${formatCm(summary.frameWidthCm)} cm`} />
      <InfoItem
        label="Passe-partout"
        value={
          summary.matEnabled ? `${formatCm(summary.matWidthCm)} cm` : "None"
        }
      />
      <InfoItem
        label="Outside size"
        value={`${formatCm(summary.totalWidthCm)} × ${formatCm(summary.totalHeightCm)} cm`}
        emphasis
      />
    </footer>
  );
}

function InfoItem({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-zinc-400">{label}</span>
      <span className={emphasis ? "font-semibold text-zinc-900" : "font-medium text-zinc-800"}>
        {value}
      </span>
    </div>
  );
}
