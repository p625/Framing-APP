"use client";

import type { PreviewDimensionsSummary, PreviewMeasurementLayout } from "../utils/previewDimensions";
import { formatCm } from "../utils/previewDimensions";

interface PreviewMeasurementLabelsProps {
  summary: PreviewDimensionsSummary;
  layout: PreviewMeasurementLayout;
}

export function PreviewMeasurementLabels({
  summary,
  layout,
}: PreviewMeasurementLabelsProps) {
  const artworkWidthLabel = `${formatCm(summary.artworkWidthCm)} cm`;
  const artworkHeightLabel = `${formatCm(summary.artworkHeightCm)} cm`;
  const totalWidthLabel = `${formatCm(summary.totalWidthCm)} cm`;
  const totalHeightLabel = `${formatCm(summary.totalHeightCm)} cm`;

  const totalLeft = layout.totalLeftPct;
  const totalTop = layout.totalTopPct;
  const totalWidth = layout.totalWidthPct;
  const totalHeight = layout.totalHeightPct;

  const artLeft = layout.artworkLeftPct;
  const artTop = layout.artworkTopPct;
  const artWidth = layout.artworkWidthPct;
  const artHeight = layout.artworkHeightPct;

  const labelClass =
    "pointer-events-none absolute z-10 rounded bg-zinc-900/80 px-1.5 py-0.5 text-[10px] font-medium leading-tight text-white shadow-sm";

  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      <span
        className={labelClass}
        style={{
          left: `${totalLeft + totalWidth / 2}%`,
          top: `${Math.max(totalTop - 3, 0)}%`,
          transform: "translate(-50%, -100%)",
        }}
      >
        {totalWidthLabel}
      </span>

      <span
        className={labelClass}
        style={{
          left: `${totalLeft + totalWidth / 2}%`,
          top: `${totalTop + totalHeight + 1}%`,
          transform: "translate(-50%, 0)",
        }}
      >
        {totalWidthLabel}
      </span>

      <span
        className={labelClass}
        style={{
          left: `${Math.max(totalLeft - 1.5, 0)}%`,
          top: `${totalTop + totalHeight / 2}%`,
          transform: "translate(-100%, -50%)",
        }}
      >
        {totalHeightLabel}
      </span>

      <span
        className={labelClass}
        style={{
          left: `${totalLeft + totalWidth + 1}%`,
          top: `${totalTop + totalHeight / 2}%`,
          transform: "translate(0, -50%)",
        }}
      >
        {totalHeightLabel}
      </span>

      <span
        className={`${labelClass} bg-emerald-800/85`}
        style={{
          left: `${artLeft + artWidth / 2}%`,
          top: `${artTop - 1}%`,
          transform: "translate(-50%, -100%)",
        }}
      >
        {artworkWidthLabel}
      </span>

      <span
        className={`${labelClass} bg-emerald-800/85`}
        style={{
          left: `${artLeft - 1}%`,
          top: `${artTop + artHeight / 2}%`,
          transform: "translate(-100%, -50%)",
        }}
      >
        {artworkHeightLabel}
      </span>
    </div>
  );
}
