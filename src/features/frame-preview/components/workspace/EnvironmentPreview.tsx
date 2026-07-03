"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FrameDefinition, FrameSampleMode, UseFramingStateReturn } from "../../framing.types";
import type { UseEnvironmentStateReturn } from "../../hooks/useEnvironmentState";
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
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const { environmentImageUrl, placement, updatePlacement } = environment;

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) {
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
    [placement.x, placement.y],
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
        x: Math.min(95, Math.max(5, drag.originX + deltaX)),
        y: Math.min(95, Math.max(5, drag.originY + deltaY)),
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

      <div
        className={`absolute touch-none ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
        style={{
          left: `${placement.x}%`,
          top: `${placement.y}%`,
          transform: `translate(-50%, -50%) scale(${placement.scale}) rotate(${placement.rotation}deg)`,
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
        />
      </div>
    </div>
  );
}
