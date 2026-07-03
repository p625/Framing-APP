"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FrameDefinition, FrameSampleMode, UseFramingStateReturn } from "../../framing.types";
import type { UseEnvironmentStateReturn } from "../../hooks/useEnvironmentState";
import { computePreviewDimensionsSummary } from "../../utils/previewDimensions";
import {
  computeFramedArtworkDisplayPx,
  computeObjectCoverLayout,
} from "../../utils/environmentCalibration";
import { PreviewCanvas, ENVIRONMENT_FRAME_CANVAS_ID } from "../PreviewCanvas";

interface EnvironmentPreviewProps {
  framing: UseFramingStateReturn;
  environment: UseEnvironmentStateReturn;
  selectedFrame: FrameDefinition | null;
  frameSampleMode: FrameSampleMode;
}

export function EnvironmentPreview({
  framing,
  environment,
  selectedFrame,
  frameSampleMode,
}: EnvironmentPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [imageNaturalSize, setImageNaturalSize] = useState({ width: 0, height: 0 });
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const { environmentImageUrl, calibration, placement, updatePlacement, hasWallCalibration } =
    environment;

  const sizeSummary = useMemo(
    () =>
      computePreviewDimensionsSummary(
        framing.canvasSize,
        framing.frameWidthCm,
        framing.matSettings,
      ),
    [framing.canvasSize, framing.frameWidthCm, framing.matSettings],
  );

  useEffect(() => {
    if (!environmentImageUrl) {
      return;
    }
    const image = new Image();
    image.onload = () => {
      setImageNaturalSize({
        width: image.naturalWidth,
        height: image.naturalHeight,
      });
    };
    image.src = environmentImageUrl;
  }, [environmentImageUrl]);

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

  const displaySize = useMemo(() => {
    if (
      !hasWallCalibration ||
      !calibration ||
      containerSize.width === 0 ||
      imageNaturalSize.width === 0
    ) {
      return null;
    }

    const layout = computeObjectCoverLayout(
      containerSize.width,
      containerSize.height,
      imageNaturalSize.width,
      imageNaturalSize.height,
    );

    return computeFramedArtworkDisplayPx(
      calibration,
      layout,
      imageNaturalSize.width,
      imageNaturalSize.height,
      sizeSummary.totalWidthCm,
      sizeSummary.totalHeightCm,
      placement.fineScale,
    );
  }, [
    calibration,
    containerSize.height,
    containerSize.width,
    hasWallCalibration,
    imageNaturalSize.height,
    imageNaturalSize.width,
    placement.fineScale,
    sizeSummary.totalHeightCm,
    sizeSummary.totalWidthCm,
  ]);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.button !== 0 || !hasWallCalibration) {
        return;
      }
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      dragRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        originX: placement.x,
        originY: placement.y,
      };
      setIsDragging(true);
    },
    [hasWallCalibration, placement.x, placement.y],
  );

  useEffect(() => {
    if (!isDragging) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      const drag = dragRef.current;
      const container = containerRef.current;
      if (!drag || !container || event.pointerId !== drag.pointerId) {
        return;
      }

      const rect = container.getBoundingClientRect();
      const deltaX = ((event.clientX - drag.startX) / rect.width) * 100;
      const deltaY = ((event.clientY - drag.startY) / rect.height) * 100;

      updatePlacement({
        x: Math.min(98, Math.max(2, drag.originX + deltaX)),
        y: Math.min(98, Math.max(2, drag.originY + deltaY)),
      });
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (dragRef.current?.pointerId === event.pointerId) {
        dragRef.current = null;
        setIsDragging(false);
      }
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isDragging, updatePlacement]);

  if (!environmentImageUrl) {
    return (
      <div className="flex h-full items-center justify-center fs-canvas-bg p-8 text-center">
        <p className="fs-caption">Select an environment from the right column to begin.</p>
      </div>
    );
  }

  if (!hasWallCalibration) {
    return (
      <div className="flex h-full items-center justify-center fs-canvas-bg p-8 text-center">
        <p className="fs-caption">
          This environment needs wall calibration. Use &quot;Calibrate wall&quot; in the
          right column.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative h-full min-h-0 w-full overflow-hidden fs-canvas-bg"
      style={{ overscrollBehavior: "contain" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={environmentImageUrl}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        draggable={false}
      />

      {displaySize ? (
        <div
          className={`absolute touch-none ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
          style={{
            left: `${placement.x}%`,
            top: `${placement.y}%`,
            transform: "translate(-50%, -50%)",
            width: displaySize.width,
            height: displaySize.height,
            filter: "drop-shadow(0 18px 28px rgba(0,0,0,0.28))",
          }}
          onPointerDown={handlePointerDown}
        >
          <PreviewCanvas
            canvasId={ENVIRONMENT_FRAME_CANVAS_ID}
            artworkImageUrl={framing.artworkImageUrl}
            canvasSize={framing.canvasSize}
            frame={selectedFrame}
            customFrameTextureUrl={framing.customFrameTextureUrl}
            customFrameFallbackColor={framing.customFrameFallbackColor}
            frameSampleMode={frameSampleMode}
            frameCornerCalibration={framing.frameCornerCalibration}
            frameWidthCm={framing.frameWidthCm}
            textureScale={framing.textureScale}
            matSettings={framing.matSettings}
            embedded
            displaySize={displaySize}
          />
        </div>
      ) : null}
    </div>
  );
}
