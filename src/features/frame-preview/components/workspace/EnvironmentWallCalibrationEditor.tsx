"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { EnvironmentCalibration } from "../../framing.types";
import { clamp01 } from "../../utils/imageLayout";
import {
  containerPointToNormalized,
  DEFAULT_ENVIRONMENT_CALIBRATION,
  normalizedRectToCoverScreen,
} from "../../utils/environmentCalibration";

interface EnvironmentWallCalibrationEditorProps {
  imageUrl: string;
  initialCalibration?: EnvironmentCalibration | null;
  onSave: (calibration: EnvironmentCalibration) => void;
  onCancel: () => void;
}

type DragMode = "move" | "draw" | "resize-se" | null;

export function EnvironmentWallCalibrationEditor({
  imageUrl,
  initialCalibration,
  onSave,
  onCancel,
}: EnvironmentWallCalibrationEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [calibration, setCalibration] = useState<EnvironmentCalibration>(
    initialCalibration ?? DEFAULT_ENVIRONMENT_CALIBRATION,
  );
  const dragRef = useRef<{
    mode: DragMode;
    startX: number;
    startY: number;
    originRect: EnvironmentCalibration["wallRect"];
  } | null>(null);

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

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const update = () => {
      setContainerSize({
        width: container.clientWidth,
        height: container.clientHeight,
      });
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const screenRect =
    naturalSize.width > 0 && containerSize.width > 0
      ? normalizedRectToCoverScreen(
          calibration.wallRect,
          containerSize.width,
          containerSize.height,
          naturalSize.width,
          naturalSize.height,
        )
      : null;

  const handlePointerDown = (event: React.PointerEvent, mode: DragMode) => {
    if (!containerRef.current) {
      return;
    }
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      mode,
      startX: event.clientX,
      startY: event.clientY,
      originRect: { ...calibration.wallRect },
    };
  };

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const drag = dragRef.current;
      const container = containerRef.current;
      if (!drag || !container || naturalSize.width === 0) {
        return;
      }

      const rect = container.getBoundingClientRect();
      const currentNorm = containerPointToNormalized(
        event.clientX - rect.left,
        event.clientY - rect.top,
        container.clientWidth,
        container.clientHeight,
        naturalSize.width,
        naturalSize.height,
      );
      const startNorm = containerPointToNormalized(
        drag.startX - rect.left,
        drag.startY - rect.top,
        container.clientWidth,
        container.clientHeight,
        naturalSize.width,
        naturalSize.height,
      );

      if (!currentNorm) {
        return;
      }

      if (drag.mode === "draw") {
        const x = Math.min(drag.originRect.x, currentNorm.x);
        const y = Math.min(drag.originRect.y, currentNorm.y);
        const width = Math.abs(currentNorm.x - drag.originRect.x);
        const height = Math.abs(currentNorm.y - drag.originRect.y);
        setCalibration((previous) => ({
          ...previous,
          wallRect: {
            x: clamp01(x),
            y: clamp01(y),
            width: clamp01(width),
            height: clamp01(height),
          },
        }));
        return;
      }

      if (!startNorm) {
        return;
      }

      const dx = currentNorm.x - startNorm.x;
      const dy = currentNorm.y - startNorm.y;

      if (drag.mode === "move") {
        setCalibration((previous) => ({
          ...previous,
          wallRect: {
            ...previous.wallRect,
            x: clamp01(drag.originRect.x + dx),
            y: clamp01(drag.originRect.y + dy),
          },
        }));
        return;
      }

      if (drag.mode === "resize-se") {
        setCalibration((previous) => ({
          ...previous,
          wallRect: {
            ...drag.originRect,
            width: clamp01(Math.max(0.02, drag.originRect.width + dx)),
            height: clamp01(Math.max(0.02, drag.originRect.height + dy)),
          },
        }));
      }
    };

    const handlePointerUp = () => {
      dragRef.current = null;
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [naturalSize.height, naturalSize.width]);

  const startDraw = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const container = containerRef.current;
      if (!container || naturalSize.width === 0) {
        return;
      }
      const rect = container.getBoundingClientRect();
      const norm = containerPointToNormalized(
        event.clientX - rect.left,
        event.clientY - rect.top,
        container.clientWidth,
        container.clientHeight,
        naturalSize.width,
        naturalSize.height,
      );
      if (!norm) {
        return;
      }
      setCalibration((previous) => ({
        ...previous,
        wallRect: { x: norm.x, y: norm.y, width: 0.001, height: 0.001 },
      }));
      dragRef.current = {
        mode: "draw",
        startX: event.clientX,
        startY: event.clientY,
        originRect: { x: norm.x, y: norm.y, width: 0.001, height: 0.001 },
      };
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [naturalSize.height, naturalSize.width],
  );

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <p className="fs-caption text-[11px]">
        Draw a rectangle over the usable wall area, then enter its real-world size in
        centimetres (e.g. 400 for a 4&nbsp;m wide wall).
      </p>

      <div
        ref={containerRef}
        className="relative min-h-[220px] flex-1 overflow-hidden rounded-xl border border-fs-border bg-zinc-900"
        onPointerDown={startDraw}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt=""
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          draggable={false}
        />

        {screenRect && screenRect.width > 2 ? (
          <>
            <div
              className="absolute cursor-move border-2 border-fs-gold bg-fs-gold/15"
              style={{
                left: screenRect.x,
                top: screenRect.y,
                width: screenRect.width,
                height: screenRect.height,
              }}
              onPointerDown={(event) => {
                event.stopPropagation();
                handlePointerDown(event, "move");
              }}
            />
            <button
              type="button"
              aria-label="Resize wall area"
              className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-fs-gold shadow"
              style={{
                left: screenRect.x + screenRect.width,
                top: screenRect.y + screenRect.height,
              }}
              onPointerDown={(event) => {
                event.stopPropagation();
                handlePointerDown(event, "resize-se");
              }}
            />
          </>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className="space-y-1">
          <span className="fs-caption">Wall width (cm)</span>
          <input
            type="number"
            min={1}
            step={1}
            value={calibration.realWallWidthCm}
            onChange={(event) =>
              setCalibration((previous) => ({
                ...previous,
                realWallWidthCm: Math.max(1, Number(event.target.value)),
              }))
            }
            className="fs-input text-sm"
          />
        </label>
        <label className="space-y-1">
          <span className="fs-caption">Wall height (cm)</span>
          <input
            type="number"
            min={1}
            step={1}
            value={calibration.realWallHeightCm}
            onChange={(event) =>
              setCalibration((previous) => ({
                ...previous,
                realWallHeightCm: Math.max(1, Number(event.target.value)),
              }))
            }
            className="fs-input text-sm"
          />
        </label>
      </div>

      <div className="flex gap-2">
        <button type="button" onClick={onCancel} className="fs-btn fs-btn-secondary flex-1 py-2">
          Cancel
        </button>
        <button
          type="button"
          onClick={() => onSave(calibration)}
          className="fs-btn fs-btn-primary flex-1 py-2"
        >
          Save calibration
        </button>
      </div>
    </div>
  );
}
