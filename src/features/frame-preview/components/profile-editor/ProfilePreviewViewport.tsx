"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  applyWheelZoom,
  clampZoom,
  computePanForZoomAtPoint,
  EDITOR_MAX_ZOOM,
  EDITOR_MIN_ZOOM,
  EDITOR_ZOOM_STEP,
} from "../../utils/zoomPan";

interface ProfilePreviewViewportProps {
  children: ReactNode;
}

export function ProfilePreviewViewport({ children }: ProfilePreviewViewportProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(
    null,
  );
  const zoomRef = useRef(1);
  const panRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  useEffect(() => {
    panRef.current = pan;
  }, [pan]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      setContainerSize({
        width: container.clientWidth,
        height: container.clientHeight,
      });
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const applyZoomAtPoint = useCallback(
    (nextZoom: number, localX: number, localY: number) => {
      const clamped = clampZoom(nextZoom);
      setZoom((oldZoom) => {
        setPan((oldPan) =>
          computePanForZoomAtPoint(
            localX,
            localY,
            containerSize.width,
            containerSize.height,
            oldZoom,
            clamped,
            oldPan.x,
            oldPan.y,
          ),
        );
        return clamped;
      });
    },
    [containerSize.height, containerSize.width],
  );

  const resetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || containerSize.width === 0) return;

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      event.stopPropagation();

      const rect = container.getBoundingClientRect();
      const result = applyWheelZoom(
        zoomRef.current,
        event.deltaY,
        event.clientX - rect.left,
        event.clientY - rect.top,
        container.clientWidth,
        container.clientHeight,
        panRef.current.x,
        panRef.current.y,
      );

      zoomRef.current = result.zoom;
      panRef.current = { x: result.panX, y: result.panY };
      setZoom(result.zoom);
      setPan({ x: result.panX, y: result.panY });
    };

    container.addEventListener("wheel", handleWheel, { passive: false, capture: true });
    return () => container.removeEventListener("wheel", handleWheel, { capture: true });
  }, [containerSize.height, containerSize.width]);

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

  const zoomAtCenter = (nextZoom: number) => {
    applyZoomAtPoint(nextZoom, containerSize.width / 2, containerSize.height / 2);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="fs-toolbar">
        <button
          type="button"
          onClick={() => zoomAtCenter(zoom - EDITOR_ZOOM_STEP)}
          disabled={zoom <= EDITOR_MIN_ZOOM}
          className="fs-btn fs-btn-secondary"
        >
          Zoom −
        </button>
        <button
          type="button"
          onClick={() => zoomAtCenter(zoom + EDITOR_ZOOM_STEP)}
          disabled={zoom >= EDITOR_MAX_ZOOM}
          className="fs-btn fs-btn-secondary"
        >
          Zoom +
        </button>
        <button type="button" onClick={resetView} className="fs-btn fs-btn-secondary">
          Fit
        </button>
        <span className="ml-2 text-[10px] text-fs-muted">
          Scroll to zoom · drag to pan
        </span>
      </div>

      <div
        ref={containerRef}
        className="relative min-h-0 flex-1 cursor-grab overflow-hidden fs-canvas-bg active:cursor-grabbing"
        style={{ overscrollBehavior: "contain" }}
        onPointerDown={(event) => {
          if (event.button !== 0) return;
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
          className="flex h-full w-full items-center justify-center"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "center center",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
