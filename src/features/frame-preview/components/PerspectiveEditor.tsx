"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PerspectiveCorners } from "../framing.types";

const HANDLE_KEYS = [
  "topLeft",
  "topRight",
  "bottomRight",
  "bottomLeft",
] as const;

type HandleKey = (typeof HANDLE_KEYS)[number];

const HANDLE_LABELS: Record<HandleKey, string> = {
  topLeft: "Top left",
  topRight: "Top right",
  bottomRight: "Bottom right",
  bottomLeft: "Bottom left",
};

interface PerspectiveEditorProps {
  artworkPreviewUrl: string | null;
  perspectiveCorners: PerspectiveCorners;
  correctedArtworkUrl: string | null;
  onCornersChange: (corners: PerspectiveCorners) => void;
  onStraighten: () => Promise<void>;
  onReset: () => void;
}

export function PerspectiveEditor({
  artworkPreviewUrl,
  perspectiveCorners,
  correctedArtworkUrl,
  onCornersChange,
  onStraighten,
  onReset,
}: PerspectiveEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeHandle, setActiveHandle] = useState<HandleKey | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const updateCornerFromPointer = useCallback(
    (handle: HandleKey, clientX: number, clientY: number) => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const x = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      const y = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));

      onCornersChange({
        ...perspectiveCorners,
        [handle]: { x, y },
      });
    },
    [onCornersChange, perspectiveCorners],
  );

  useEffect(() => {
    if (!activeHandle) return;

    const handlePointerMove = (event: PointerEvent) => {
      updateCornerFromPointer(activeHandle, event.clientX, event.clientY);
    };

    const handlePointerUp = () => {
      setActiveHandle(null);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [activeHandle, updateCornerFromPointer]);

  if (!artworkPreviewUrl) {
    return null;
  }

  const handleStraighten = async () => {
    setIsProcessing(true);
    try {
      await onStraighten();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-3">
      <div
        ref={containerRef}
        className="relative aspect-[4/3] overflow-hidden rounded-lg border border-zinc-200 bg-zinc-900"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={artworkPreviewUrl}
          alt="Artwork for perspective correction"
          className="h-full w-full object-contain"
          draggable={false}
        />

        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <polygon
            points={`${perspectiveCorners.topLeft.x * 100},${perspectiveCorners.topLeft.y * 100} ${perspectiveCorners.topRight.x * 100},${perspectiveCorners.topRight.y * 100} ${perspectiveCorners.bottomRight.x * 100},${perspectiveCorners.bottomRight.y * 100} ${perspectiveCorners.bottomLeft.x * 100},${perspectiveCorners.bottomLeft.y * 100}`}
            fill="rgba(255,255,255,0.08)"
            stroke="rgba(255,255,255,0.85)"
            strokeWidth="0.4"
          />
        </svg>

        {HANDLE_KEYS.map((key) => {
          const point = perspectiveCorners[key];

          return (
            <button
              key={key}
              type="button"
              aria-label={HANDLE_LABELS[key]}
              className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-zinc-900 shadow-md"
              style={{
                left: `${point.x * 100}%`,
                top: `${point.y * 100}%`,
              }}
              onPointerDown={(event) => {
                event.preventDefault();
                setActiveHandle(key);
              }}
            />
          );
        })}
      </div>

      <p className="text-xs text-zinc-500">
        Drag the four corners to match the artwork edges in the photo.
      </p>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleStraighten}
          disabled={isProcessing}
          className="flex-1 rounded-md bg-zinc-900 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-300"
        >
          {isProcessing ? "Straightening…" : "Straighten image"}
        </button>
        <button
          type="button"
          onClick={onReset}
          className="rounded-md border border-zinc-200 px-3 py-2 text-xs text-zinc-600 transition-colors hover:border-zinc-300 hover:text-zinc-900"
        >
          Reset
        </button>
      </div>

      {correctedArtworkUrl ? (
        <p className="text-xs font-medium text-emerald-600">
          Perspective correction applied.
        </p>
      ) : null}
    </div>
  );
}
