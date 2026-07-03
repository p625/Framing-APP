"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PerspectiveCorners } from "../framing.types";
import {
  clamp01,
  computeObjectContainLayout,
  containerToImageNormalized,
  imageNormalizedToContainer,
  type ImageLayout,
} from "../utils/imageLayout";

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

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.25;

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
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const [layout, setLayout] = useState<ImageLayout | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [activeHandle, setActiveHandle] = useState<HandleKey | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const panStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(
    null,
  );

  useEffect(() => {
    if (!artworkPreviewUrl) return;

    const image = new Image();
    image.onload = () => {
      setNaturalSize({
        width: image.naturalWidth,
        height: image.naturalHeight,
      });
    };
    image.src = artworkPreviewUrl;
  }, [artworkPreviewUrl]);

  const updateLayout = useCallback(() => {
    const container = containerRef.current;
    if (!container || naturalSize.width === 0) return;

    setContainerSize({
      width: container.clientWidth,
      height: container.clientHeight,
    });
    setLayout(
      computeObjectContainLayout(
        container.clientWidth,
        container.clientHeight,
        naturalSize.width,
        naturalSize.height,
      ),
    );
  }, [naturalSize.height, naturalSize.width]);

  useEffect(() => {
    updateLayout();
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(updateLayout);
    observer.observe(container);

    return () => observer.disconnect();
  }, [updateLayout]);

  const pointerToNormalized = useCallback(
    (clientX: number, clientY: number) => {
      const container = containerRef.current;
      if (!container || !layout) return null;

      const rect = container.getBoundingClientRect();
      const normalized = containerToImageNormalized(
        clientX - rect.left,
        clientY - rect.top,
        container.clientWidth,
        container.clientHeight,
        layout,
        zoom,
        pan.x,
        pan.y,
      );

      return {
        x: clamp01(normalized.x),
        y: clamp01(normalized.y),
      };
    },
    [layout, pan.x, pan.y, zoom],
  );

  const updateCornerFromPointer = useCallback(
    (handle: HandleKey, clientX: number, clientY: number) => {
      const point = pointerToNormalized(clientX, clientY);
      if (!point) return;

      onCornersChange({
        ...perspectiveCorners,
        [handle]: point,
      });
    },
    [onCornersChange, perspectiveCorners, pointerToNormalized],
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

  useEffect(() => {
    if (!isPanning) return;

    const handlePointerMove = (event: PointerEvent) => {
      const start = panStartRef.current;
      if (!start) return;

      setPan({
        x: start.panX + (event.clientX - start.x),
        y: start.panY + (event.clientY - start.y),
      });
    };

    const handlePointerUp = () => {
      setIsPanning(false);
      panStartRef.current = null;
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isPanning]);

  const handleZoomChange = (nextZoom: number) => {
    setZoom(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, nextZoom)));
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

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

  const containerWidth = containerSize.width;
  const containerHeight = containerSize.height;

  const polygonPoints =
    layout && containerWidth > 0
      ? HANDLE_KEYS.map((key) => {
        const point = perspectiveCorners[key];
        const display = imageNormalizedToContainer(
          point.x,
          point.y,
          containerWidth,
          containerHeight,
          layout,
          zoom,
          pan.x,
          pan.y,
        );
        return `${display.x},${display.y}`;
      }).join(" ")
      : "";

  return (
    <div className="space-y-3">
      <div
        ref={containerRef}
        className="relative aspect-[4/3] overflow-hidden rounded-lg border border-zinc-200 bg-zinc-900"
        onPointerDown={(event) => {
          if (event.button !== 0 || activeHandle) return;
          if ((event.target as HTMLElement).closest("button")) return;

          setIsPanning(true);
          panStartRef.current = {
            x: event.clientX,
            y: event.clientY,
            panX: pan.x,
            panY: pan.y,
          };
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "center center",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={artworkPreviewUrl}
            alt="Artwork for perspective correction"
            className="h-full w-full object-contain"
            draggable={false}
          />
        </div>

        {layout ? (
          <svg className="pointer-events-none absolute inset-0 h-full w-full">
            <polygon
              points={polygonPoints}
              fill="rgba(255,255,255,0.08)"
              stroke="rgba(255,255,255,0.85)"
              strokeWidth={2}
            />
          </svg>
        ) : null}

        {layout && containerWidth > 0
          ? HANDLE_KEYS.map((key) => {
              const point = perspectiveCorners[key];
              const display = imageNormalizedToContainer(
                point.x,
                point.y,
                containerWidth,
                containerHeight,
                layout,
                zoom,
                pan.x,
                pan.y,
              );

              return (
                <button
                  key={key}
                  type="button"
                  aria-label={HANDLE_LABELS[key]}
                  className="absolute z-10 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-zinc-900 shadow-md"
                  style={{
                    left: display.x,
                    top: display.y,
                  }}
                  onPointerDown={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    setActiveHandle(key);
                  }}
                />
              );
            })
          : null}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => handleZoomChange(zoom - ZOOM_STEP)}
          disabled={zoom <= MIN_ZOOM}
          className="rounded-md border border-zinc-200 px-2 py-1 text-xs text-zinc-600 hover:border-zinc-300 disabled:opacity-40"
        >
          −
        </button>
        <input
          type="range"
          min={MIN_ZOOM}
          max={MAX_ZOOM}
          step={0.05}
          value={zoom}
          onChange={(event) => handleZoomChange(Number(event.target.value))}
          className="w-full accent-zinc-900"
          aria-label="Perspective zoom"
        />
        <button
          type="button"
          onClick={() => handleZoomChange(zoom + ZOOM_STEP)}
          disabled={zoom >= MAX_ZOOM}
          className="rounded-md border border-zinc-200 px-2 py-1 text-xs text-zinc-600 hover:border-zinc-300 disabled:opacity-40"
        >
          +
        </button>
        <button
          type="button"
          onClick={resetView}
          className="shrink-0 rounded-md border border-zinc-200 px-2 py-1 text-xs text-zinc-600 hover:border-zinc-300"
        >
          Reset zoom
        </button>
      </div>

      <p className="text-xs text-zinc-500">
        Drag corners to the artwork edges. Zoom and drag the background to pan for
        precise placement.
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
