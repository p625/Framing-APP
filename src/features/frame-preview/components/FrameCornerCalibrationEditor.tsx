"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FrameCornerCalibration, NormalizedRect } from "../framing.types";
import {
  clamp01,
  computeObjectContainLayout,
  containerToImageNormalized,
  imageNormalizedToContainer,
  type ImageLayout,
} from "../utils/imageLayout";
import {
  CORNER_QUADRANT_LABELS,
  deriveCornerCropRect,
  detectSourceCorner,
  getCalibrationOrDefault,
  isHorizontalStripValid,
  isVerticalStripValid,
  RAIL_SOURCE_MODE_LABELS,
  RAIL_SOURCE_MODE_OPTIONS,
  RAIL_SOURCE_SIDE_LABELS,
  RAIL_SOURCE_SIDE_OPTIONS,
  resolveSourceCorner,
  SOURCE_CORNER_OPTION_LABELS,
  SOURCE_CORNER_OPTIONS,
} from "../utils/frameCalibration";
import {
  applyWheelZoom,
  clampZoom,
  computePanForZoomAtPoint,
  EDITOR_MAX_ZOOM,
  EDITOR_MIN_ZOOM,
  EDITOR_ZOOM_STEP,
} from "../utils/zoomPan";

type CalibrationTool =
  | "innerCorner"
  | "outerCorner"
  | "cornerCrop"
  | "horizontalStrip"
  | "verticalStrip";

type StripDragMode =
  | "move"
  | "top-left"
  | "top-right"
  | "bottom-right"
  | "bottom-left";

const TOOL_LABELS: Record<CalibrationTool, string> = {
  innerCorner: "Inner corner",
  outerCorner: "Outer corner",
  cornerCrop: "Full corner area",
  horizontalStrip: "Horizontal rail",
  verticalStrip: "Vertical rail",
};

interface FrameCornerCalibrationEditorProps {
  imageUrl: string;
  calibration: FrameCornerCalibration;
  onCalibrationChange: (calibration: FrameCornerCalibration) => void;
  onReset: () => void;
}

function clampNormalizedRect(rect: NormalizedRect): NormalizedRect {
  const width = Math.max(0.02, Math.min(rect.width, 1));
  const height = Math.max(0.02, Math.min(rect.height, 1));
  const x = Math.min(Math.max(0, rect.x), 1 - width);
  const y = Math.min(Math.max(0, rect.y), 1 - height);

  return { x, y, width, height };
}

export function FrameCornerCalibrationEditor({
  imageUrl,
  calibration,
  onCalibrationChange,
  onReset,
}: FrameCornerCalibrationEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const [layout, setLayout] = useState<ImageLayout | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [activeTool, setActiveTool] = useState<CalibrationTool>("innerCorner");
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [stripDragMode, setStripDragMode] = useState<StripDragMode | null>(null);
  const [stripDragStart, setStripDragStart] = useState<{
    pointerX: number;
    pointerY: number;
    rect: NormalizedRect;
  } | null>(null);
  const [activeCornerDrag, setActiveCornerDrag] = useState<
    "innerCorner" | "outerCorner" | null
  >(null);
  const panStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(
    null,
  );

  useEffect(() => {
    const image = new Image();
    image.onload = () => {
      setNaturalSize({
        width: image.naturalWidth,
        height: image.naturalHeight,
      });
    };
    image.src = imageUrl;
  }, [imageUrl]);

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

  const applyZoomAtPoint = useCallback(
    (nextZoom: number, localX: number, localY: number) => {
      const clamped = clampZoom(nextZoom);
      setZoom((oldZoom) => {
        const newZoom = clamped;
        setPan((oldPan) =>
          computePanForZoomAtPoint(
            localX,
            localY,
            containerSize.width,
            containerSize.height,
            oldZoom,
            newZoom,
            oldPan.x,
            oldPan.y,
          ),
        );
        return newZoom;
      });
    },
    [containerSize.height, containerSize.width],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      const rect = container.getBoundingClientRect();
      const localX = event.clientX - rect.left;
      const localY = event.clientY - rect.top;

      setZoom((currentZoom) => {
        const result = applyWheelZoom(
          currentZoom,
          event.deltaY,
          localX,
          localY,
          container.clientWidth,
          container.clientHeight,
          pan.x,
          pan.y,
        );
        setPan({ x: result.panX, y: result.panY });
        return result.zoom;
      });
    };

    container.addEventListener("wheel", handleWheel, { passive: false });

    return () => container.removeEventListener("wheel", handleWheel);
  }, [pan.x, pan.y]);

  useEffect(() => {
    if (!activeCornerDrag) return;

    const handlePointerMove = (event: PointerEvent) => {
      const point = pointerToNormalized(event.clientX, event.clientY);
      if (!point) return;

      onCalibrationChange({
        ...calibration,
        [activeCornerDrag]: point,
      });
    };

    const handlePointerUp = () => {
      setActiveCornerDrag(null);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [activeCornerDrag, calibration, onCalibrationChange, pointerToNormalized]);

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

  useEffect(() => {
    if (!stripDragMode || !stripDragStart) return;

    const start = stripDragStart;

    const handlePointerMove = (event: PointerEvent) => {
      const current = pointerToNormalized(event.clientX, event.clientY);
      const startPoint = pointerToNormalized(start.pointerX, start.pointerY);
      if (!current || !startPoint) return;

      const deltaX = current.x - startPoint.x;
      const deltaY = current.y - startPoint.y;
      const base = start.rect;
      const rectKey =
        activeTool === "horizontalStrip"
          ? "horizontalStrip"
          : activeTool === "verticalStrip"
            ? "verticalStrip"
            : "cornerCropRect";
      let next = { ...base };

      switch (stripDragMode) {
        case "move":
          next = { ...base, x: base.x + deltaX, y: base.y + deltaY };
          break;
        case "top-left":
          next = {
            x: base.x + deltaX,
            y: base.y + deltaY,
            width: base.width - deltaX,
            height: base.height - deltaY,
          };
          break;
        case "top-right":
          next = {
            x: base.x,
            y: base.y + deltaY,
            width: base.width + deltaX,
            height: base.height - deltaY,
          };
          break;
        case "bottom-right":
          next = {
            x: base.x,
            y: base.y,
            width: base.width + deltaX,
            height: base.height + deltaY,
          };
          break;
        case "bottom-left":
          next = {
            x: base.x + deltaX,
            y: base.y,
            width: base.width - deltaX,
            height: base.height + deltaY,
          };
          break;
        default:
          break;
      }

      onCalibrationChange({
        ...calibration,
        [rectKey]: clampNormalizedRect(next),
      });
    };

    const handlePointerUp = () => {
      setStripDragMode(null);
      setStripDragStart(null);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [
    activeTool,
    calibration,
    onCalibrationChange,
    pointerToNormalized,
    stripDragMode,
    stripDragStart,
  ]);

  const handleZoomChange = (nextZoom: number) => {
    const centerX = containerSize.width / 2;
    const centerY = containerSize.height / 2;
    applyZoomAtPoint(nextZoom, centerX, centerY);
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const containerWidth = containerSize.width;
  const containerHeight = containerSize.height;

  const renderPoint = (point: { x: number; y: number }) =>
    layout && containerWidth > 0
      ? imageNormalizedToContainer(
          point.x,
          point.y,
          containerWidth,
          containerHeight,
          layout,
          zoom,
          pan.x,
          pan.y,
        )
      : null;

  const renderRect = (rect: NormalizedRect) => {
    if (!layout || containerWidth === 0) {
      return null;
    }

    const topLeft = imageNormalizedToContainer(
      rect.x,
      rect.y,
      containerWidth,
      containerHeight,
      layout,
      zoom,
      pan.x,
      pan.y,
    );
    const bottomRight = imageNormalizedToContainer(
      rect.x + rect.width,
      rect.y + rect.height,
      containerWidth,
      containerHeight,
      layout,
      zoom,
      pan.x,
      pan.y,
    );

    return {
      left: topLeft.x,
      top: topLeft.y,
      width: bottomRight.x - topLeft.x,
      height: bottomRight.y - topLeft.y,
    };
  };

  const resolvedCornerCrop: NormalizedRect | null =
    naturalSize.width > 0
      ? calibration.cornerCropRect ??
        (() => {
          const derived = deriveCornerCropRect(
            calibration,
            naturalSize.width,
            naturalSize.height,
          );
          return {
            x: derived.x / naturalSize.width,
            y: derived.y / naturalSize.height,
            width: derived.width / naturalSize.width,
            height: derived.height / naturalSize.height,
          };
        })()
      : null;

  const activeRect =
    activeTool === "horizontalStrip"
      ? calibration.horizontalStrip
      : activeTool === "verticalStrip"
        ? calibration.verticalStrip
        : activeTool === "cornerCrop"
          ? resolvedCornerCrop
          : null;
  const activeRectBox = activeRect ? renderRect(activeRect) : null;
  const cornerCropDisplayBox =
    resolvedCornerCrop && activeTool !== "cornerCrop"
      ? renderRect(resolvedCornerCrop)
      : null;

  const innerDisplay = renderPoint(calibration.innerCorner);
  const outerDisplay = renderPoint(calibration.outerCorner);
  const resolvedSource = resolveSourceCorner(calibration);
  const autoDetection =
    calibration.sourceCorner === "auto"
      ? detectSourceCorner(calibration.innerCorner, calibration.outerCorner)
      : null;

  return (
    <div className="space-y-3">
      <p className="text-xs text-zinc-500">
        Real frame photos usually show one photographed corner. Mark the inner and
        outer corner points, then draw horizontal and vertical rail sample strips
        from that corner.
      </p>

      <p className="text-xs text-zinc-500">
        The corner area should include the entire visible width of the frame
        profile. The inner and outer points only align the corner; the crop
        rectangle decides how much of the profile is visible.
      </p>

      <p className="text-xs text-zinc-500">
        If two corners look correct and two look wrong, manually choose which corner
        the uploaded photo represents.
      </p>

      <div className="space-y-2">
        <span className="text-xs font-medium text-zinc-700">Source corner on photo</span>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {SOURCE_CORNER_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() =>
                onCalibrationChange({ ...calibration, sourceCorner: option })
              }
              className={`rounded-md border px-2 py-1.5 text-xs transition-colors ${
                calibration.sourceCorner === option
                  ? "border-zinc-900 bg-zinc-50 font-medium text-zinc-900"
                  : "border-zinc-200 text-zinc-600 hover:border-zinc-300"
              }`}
            >
              {SOURCE_CORNER_OPTION_LABELS[option]}
            </button>
          ))}
        </div>
      </div>

      <p className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-700">
        The uploaded sample is interpreted as:{" "}
        <span className="font-medium text-zinc-900">
          {CORNER_QUADRANT_LABELS[resolvedSource.corner]}
        </span>
        {calibration.sourceCorner === "auto" ? " (auto-detected)" : " (manual)"}
      </p>

      {calibration.sourceCorner === "auto" && autoDetection?.ambiguous ? (
        <p
          className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900"
          role="status"
        >
          Corner detection is ambiguous. Place inner and outer points farther apart,
          or select the source corner manually.
        </p>
      ) : null}

      <div className="space-y-2 border-t border-zinc-100 pt-3">
        <span className="text-xs font-medium text-zinc-700">Rail source mode</span>
        <p className="text-xs text-zinc-500">
          Use this when one rail sample is longer and cleaner. The selected rail
          will be rotated/flipped for all sides.
        </p>
        <div className="space-y-2">
          {RAIL_SOURCE_MODE_OPTIONS.map((option) => {
            const disabled =
              (option === "horizontal-all" && !isHorizontalStripValid(calibration)) ||
              (option === "vertical-all" && !isVerticalStripValid(calibration));

            return (
              <button
                key={option}
                type="button"
                disabled={disabled}
                onClick={() =>
                  onCalibrationChange({ ...calibration, railSourceMode: option })
                }
                className={`w-full rounded-md border px-2 py-1.5 text-left text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                  calibration.railSourceMode === option
                    ? "border-zinc-900 bg-zinc-50 font-medium text-zinc-900"
                    : "border-zinc-200 text-zinc-600 hover:border-zinc-300"
                }`}
              >
                {RAIL_SOURCE_MODE_LABELS[option]}
              </button>
            );
          })}
        </div>

        {calibration.railSourceMode !== "separate" ? (
          <div className="space-y-2">
            <span className="text-xs font-medium text-zinc-700">
              Selected rail represents
            </span>
            <div className="grid grid-cols-2 gap-2">
              {RAIL_SOURCE_SIDE_OPTIONS.map((side) => (
                <button
                  key={side}
                  type="button"
                  onClick={() =>
                    onCalibrationChange({ ...calibration, railSourceSide: side })
                  }
                  className={`rounded-md border px-2 py-1.5 text-xs transition-colors ${
                    calibration.railSourceSide === side
                      ? "border-zinc-900 bg-zinc-50 font-medium text-zinc-900"
                      : "border-zinc-200 text-zinc-600 hover:border-zinc-300"
                  }`}
                >
                  {RAIL_SOURCE_SIDE_LABELS[side]}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {(Object.keys(TOOL_LABELS) as CalibrationTool[]).map((tool) => (
          <button
            key={tool}
            type="button"
            onClick={() => setActiveTool(tool)}
            className={`rounded-md border px-2 py-1.5 text-xs transition-colors ${
              activeTool === tool
                ? "border-zinc-900 bg-zinc-50 font-medium text-zinc-900"
                : "border-zinc-200 text-zinc-600 hover:border-zinc-300"
            }`}
          >
            {TOOL_LABELS[tool]}
          </button>
        ))}
      </div>

      <div
        ref={containerRef}
        className="relative aspect-[4/3] overflow-hidden rounded-lg border border-zinc-200 bg-zinc-900"
        onPointerDown={(event) => {
          if (event.button !== 0 || stripDragMode) return;
          if ((event.target as HTMLElement).closest("button")) return;
          if (activeTool === "innerCorner" || activeTool === "outerCorner") return;

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
            src={imageUrl}
            alt="Frame corner sample for calibration"
            className="h-full w-full object-contain"
            draggable={false}
          />
        </div>

        {cornerCropDisplayBox ? (
          <div
            className="pointer-events-none absolute border-2 border-dashed border-violet-300/80 bg-violet-300/10"
            style={{
              left: cornerCropDisplayBox.left,
              top: cornerCropDisplayBox.top,
              width: cornerCropDisplayBox.width,
              height: cornerCropDisplayBox.height,
            }}
          />
        ) : null}

        {activeRectBox ? (
          <div
            className={`absolute border-2 ${
              activeTool === "cornerCrop"
                ? "border-violet-300 bg-violet-300/15"
                : "border-amber-300 bg-amber-300/15"
            }`}
            style={{
              left: activeRectBox.left,
              top: activeRectBox.top,
              width: activeRectBox.width,
              height: activeRectBox.height,
              cursor: "move",
            }}
            onPointerDown={(event) => {
              if (!activeRect) return;
              event.preventDefault();
              event.stopPropagation();
              setStripDragStart({
                pointerX: event.clientX,
                pointerY: event.clientY,
                rect: activeRect,
              });
              setStripDragMode("move");
            }}
          />
        ) : null}

        {activeRectBox
          ? (
              [
                { mode: "top-left" as const, left: activeRectBox.left, top: activeRectBox.top },
                {
                  mode: "top-right" as const,
                  left: activeRectBox.left + activeRectBox.width,
                  top: activeRectBox.top,
                },
                {
                  mode: "bottom-right" as const,
                  left: activeRectBox.left + activeRectBox.width,
                  top: activeRectBox.top + activeRectBox.height,
                },
                {
                  mode: "bottom-left" as const,
                  left: activeRectBox.left,
                  top: activeRectBox.top + activeRectBox.height,
                },
              ] as const
            ).map((handle) => (
              <button
                key={handle.mode}
                type="button"
                aria-label={`Resize ${handle.mode}`}
                className={`absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border ${
                  activeTool === "cornerCrop"
                    ? "border-violet-200 bg-violet-900"
                    : "border-amber-200 bg-zinc-900"
                }`}
                style={{ left: handle.left, top: handle.top }}
                onPointerDown={(event) => {
                  if (!activeRect) return;
                  event.preventDefault();
                  event.stopPropagation();
                  setStripDragStart({
                    pointerX: event.clientX,
                    pointerY: event.clientY,
                    rect: activeRect,
                  });
                  setStripDragMode(handle.mode);
                }}
              />
            ))
          : null}

        {innerDisplay ? (
          <button
            type="button"
            aria-label="Inner corner"
            className={`absolute z-10 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 shadow-md ${
              activeTool === "innerCorner"
                ? "border-emerald-300 bg-emerald-500"
                : "border-white bg-emerald-700"
            }`}
            style={{ left: innerDisplay.x, top: innerDisplay.y }}
            onPointerDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setActiveTool("innerCorner");
              setActiveCornerDrag("innerCorner");
            }}
          />
        ) : null}

        {outerDisplay ? (
          <button
            type="button"
            aria-label="Outer corner"
            className={`absolute z-10 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 shadow-md ${
              activeTool === "outerCorner"
                ? "border-sky-300 bg-sky-500"
                : "border-white bg-sky-700"
            }`}
            style={{ left: outerDisplay.x, top: outerDisplay.y }}
            onPointerDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setActiveTool("outerCorner");
              setActiveCornerDrag("outerCorner");
            }}
          />
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => handleZoomChange(zoom - EDITOR_ZOOM_STEP)}
          disabled={zoom <= EDITOR_MIN_ZOOM}
          className="rounded-md border border-zinc-200 px-2 py-1 text-xs text-zinc-600 hover:border-zinc-300 disabled:opacity-40"
        >
          −
        </button>
        <input
          type="range"
          min={EDITOR_MIN_ZOOM}
          max={EDITOR_MAX_ZOOM}
          step={0.05}
          value={zoom}
          onChange={(event) => handleZoomChange(Number(event.target.value))}
          className="w-full accent-zinc-900"
          aria-label="Calibration zoom"
        />
        <button
          type="button"
          onClick={() => handleZoomChange(zoom + EDITOR_ZOOM_STEP)}
          disabled={zoom >= EDITOR_MAX_ZOOM}
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

      <button
        type="button"
        onClick={onReset}
        className="w-full rounded-md border border-zinc-200 px-3 py-2 text-xs text-zinc-600 transition-colors hover:border-zinc-300 hover:text-zinc-900"
      >
        Reset calibration
      </button>
    </div>
  );
}

export { getCalibrationOrDefault };
