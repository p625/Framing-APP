"use client";

import type { PreviewDimensionsSummary } from "../utils/previewDimensions";
import { formatCm } from "../utils/previewDimensions";

interface PreviewSizeSummaryProps {
  summary: PreviewDimensionsSummary;
}

export function PreviewSizeSummary({ summary }: PreviewSizeSummaryProps) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-xs text-zinc-600">
      <h3 className="mb-2 font-medium text-zinc-900">Live size summary</h3>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5">
        <div>
          <dt className="text-zinc-400">Artwork</dt>
          <dd className="font-medium text-zinc-800">
            {formatCm(summary.artworkWidthCm)} × {formatCm(summary.artworkHeightCm)} cm
          </dd>
        </div>
        <div>
          <dt className="text-zinc-400">Frame width</dt>
          <dd className="font-medium text-zinc-800">{formatCm(summary.frameWidthCm)} cm</dd>
        </div>
        <div>
          <dt className="text-zinc-400">Passe-partout</dt>
          <dd className="font-medium text-zinc-800">
            {summary.matEnabled
              ? `${formatCm(summary.matWidthCm)} cm`
              : "None"}
          </dd>
        </div>
        {summary.matEnabled ? (
          <div>
            <dt className="text-zinc-400">Mat color</dt>
            <dd className="flex items-center gap-1.5 font-medium text-zinc-800">
              <span
                className="inline-block h-3 w-3 rounded border border-zinc-200"
                style={{ backgroundColor: summary.matColor }}
                aria-hidden
              />
              {summary.matColor}
            </dd>
          </div>
        ) : null}
        <div className="col-span-2 border-t border-zinc-100 pt-2">
          <dt className="text-zinc-400">Total outside size</dt>
          <dd className="font-medium text-zinc-900">
            {formatCm(summary.totalWidthCm)} × {formatCm(summary.totalHeightCm)} cm
          </dd>
        </div>
      </dl>
    </div>
  );
}
