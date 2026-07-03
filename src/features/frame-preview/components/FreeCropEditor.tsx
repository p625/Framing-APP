"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CropRect } from "../framing.types";
import {
  clamp01,
  computeObjectContainLayout,
  containerToImageNormalized,
  imageNormalizedToContainer,
  type ImageLayout,
} from "../utils/imageLayout";

type DragMode =
  | "move"
  | "top-left"
  | "top-right"
  | "bottom-right"
  | "bottom-left"
  | "top"
  | "right"
  | "bottom"
  | "left";

interface FreeCropEditorProps {
  imageUrl: string;
  lockToArtworkRatio: boolean;
  lockedAspect: number;
  onCropAreaChange: (area: CropRect) => void;
}

function createFullCrop(width: number, height: number): CropRect {
  return { x: 0, y: 0, width, height };
}

function clampCrop(
  crop: CropRect,
  imageWidth: number,
  imageHeight: number,
  lockAspect: boolean,
  aspect: number,
): CropRect {
  let { x, y, width, height } = crop;

  width = Math.max(1, Math.min(width, imageWidth));
  height = Math.max(1, Math.min(height, imageHeight));

  if (lockAspect && aspect > 0) {
    const currentAspect = width / height;
    if (currentAspect > aspect) {
      width = height * aspect;
    } else {
      height = width / aspect;
    }
  }

  width = Math.max(1, Math.min(width, imageWidth));
  height = Math.max(1, Math.min(height, imageHeight));
  x = Math.min(Math.max(0, x), imageWidth - width);
  y = Math.min(Math.max(0, y), imageHeight - height);

  return { x, y, width, height };
}

export function FreeCropEditor({
  imageUrl,
  lockToArtworkRatio,
  lockedAspect,
  onCropAreaChange,
}: FreeCropEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onCropAreaChangeRef = useRef(onCropAreaChange);
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const [layout, setLayout] = useState<ImageLayout | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [cropRect, setCropRect] = useState<CropRect | null>(null);
  const [dragMode, setDragMode] = useState<DragMode | null>(null);
  const dragStartRef = useRef<{
    pointerX: number;
    pointerY: number;
    crop: CropRect;
  } | null>(null);

  useEffect(() => {
    onCropAreaChangeRef.current = onCropAreaChange;
  }, [onCropAreaChange]);

  useEffect(() => {
    let cancelled = false;
    const image = new Image();
    image.onload = () => {
      if (cancelled) return;
      const size = {
        width: image.naturalWidth,
        height: image.naturalHeight,
      };
      setNaturalSize(size);
      const fullCrop = createFullCrop(size.width, size.height);
      setCropRect(fullCrop);
      onCropAreaChangeRef.current(fullCrop);
    };
    image.src = imageUrl;

    return () => {
      cancelled = true;
    };
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

  const pointerToNatural = useCallback(
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
        1,
        0,
        0,
      );

      return {
        x: clamp01(normalized.x) * naturalSize.width,
        y: clamp01(normalized.y) * naturalSize.height,
      };
    },
    [layout, naturalSize.height, naturalSize.width],
  );

  const commitCrop = useCallback(
    (nextCrop: CropRect) => {
      const clamped = clampCrop(
        nextCrop,
        naturalSize.width,
        naturalSize.height,
        lockToArtworkRatio,
        lockedAspect,
      );
      setCropRect(clamped);
      onCropAreaChangeRef.current(clamped);
    },
    [
      lockToArtworkRatio,
      lockedAspect,
      naturalSize.height,
      naturalSize.width,
    ],
  );

  useEffect(() => {
    if (!dragMode) return;

    const handlePointerMove = (event: PointerEvent) => {
      const start = dragStartRef.current;
      const current = pointerToNatural(event.clientX, event.clientY);
      if (!start || !current) return;

      const startPointer = pointerToNatural(start.pointerX, start.pointerY);
      if (!startPointer) return;

      const deltaX = current.x - startPointer.x;
      const deltaY = current.y - startPointer.y;
      const base = start.crop;
      let next = { ...base };

      switch (dragMode) {
        case "move":
          next = {
            ...base,
            x: base.x + deltaX,
            y: base.y + deltaY,
          };
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
        case "top":
          next = {
            ...base,
            y: base.y + deltaY,
            height: base.height - deltaY,
          };
          break;
        case "right":
          next = {
            ...base,
            width: base.width + deltaX,
          };
          break;
        case "bottom":
          next = {
            ...base,
            height: base.height + deltaY,
          };
          break;
        case "left":
          next = {
            x: base.x + deltaX,
            y: base.y,
            width: base.width - deltaX,
            height: base.height,
          };
          break;
        default:
          break;
      }

      commitCrop(next);
    };

    const handlePointerUp = () => {
      setDragMode(null);
      dragStartRef.current = null;
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [commitCrop, dragMode, pointerToNatural]);

  const startDrag = (mode: DragMode, event: React.PointerEvent) => {
    if (!cropRect) return;
    event.preventDefault();
    event.stopPropagation();
    dragStartRef.current = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      crop: cropRect,
    };
    setDragMode(mode);
  };

  if (!layout || !cropRect || containerSize.width === 0) {
    return (
      <div
        ref={containerRef}
        className="relative h-56 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-900"
      />
    );
  }

  const containerWidth = containerSize.width;
  const containerHeight = containerSize.height;

  const topLeft = imageNormalizedToContainer(
    cropRect.x / naturalSize.width,
    cropRect.y / naturalSize.height,
    containerWidth,
    containerHeight,
    layout,
    1,
    0,
    0,
  );
  const bottomRight = imageNormalizedToContainer(
    (cropRect.x + cropRect.width) / naturalSize.width,
    (cropRect.y + cropRect.height) / naturalSize.height,
    containerWidth,
    containerHeight,
    layout,
    1,
    0,
    0,
  );

  const boxLeft = topLeft.x;
  const boxTop = topLeft.y;
  const boxWidth = bottomRight.x - topLeft.x;
  const boxHeight = bottomRight.y - topLeft.y;

  const handles: { mode: DragMode; left: number; top: number; cursor: string }[] =
    [
      { mode: "top-left", left: boxLeft, top: boxTop, cursor: "nwse-resize" },
      {
        mode: "top-right",
        left: boxLeft + boxWidth,
        top: boxTop,
        cursor: "nesw-resize",
      },
      {
        mode: "bottom-right",
        left: boxLeft + boxWidth,
        top: boxTop + boxHeight,
        cursor: "nwse-resize",
      },
      {
        mode: "bottom-left",
        left: boxLeft,
        top: boxTop + boxHeight,
        cursor: "nesw-resize",
      },
      {
        mode: "top",
        left: boxLeft + boxWidth / 2,
        top: boxTop,
        cursor: "ns-resize",
      },
      {
        mode: "right",
        left: boxLeft + boxWidth,
        top: boxTop + boxHeight / 2,
        cursor: "ew-resize",
      },
      {
        mode: "bottom",
        left: boxLeft + boxWidth / 2,
        top: boxTop + boxHeight,
        cursor: "ns-resize",
      },
      {
        mode: "left",
        left: boxLeft,
        top: boxTop + boxHeight / 2,
        cursor: "ew-resize",
      },
    ];

  return (
    <div
      ref={containerRef}
      className="relative h-56 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-900"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt="Crop source"
        className="absolute inset-0 h-full w-full object-contain"
        draggable={false}
      />

      <div
        className="absolute border-2 border-white bg-white/10"
        style={{
          left: boxLeft,
          top: boxTop,
          width: boxWidth,
          height: boxHeight,
          cursor: "move",
        }}
        onPointerDown={(event) => startDrag("move", event)}
      />

      {handles.map((handle) => (
        <button
          key={handle.mode}
          type="button"
          aria-label={`Resize ${handle.mode}`}
          className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white bg-zinc-900"
          style={{
            left: handle.left,
            top: handle.top,
            cursor: handle.cursor,
          }}
          onPointerDown={(event) => startDrag(handle.mode, event)}
        />
      ))}
    </div>
  );
}
