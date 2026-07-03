export interface ImageLayout {
  offsetX: number;
  offsetY: number;
  displayWidth: number;
  displayHeight: number;
}

export function computeObjectContainLayout(
  containerWidth: number,
  containerHeight: number,
  imageWidth: number,
  imageHeight: number,
): ImageLayout {
  if (imageWidth <= 0 || imageHeight <= 0) {
    return {
      offsetX: 0,
      offsetY: 0,
      displayWidth: containerWidth,
      displayHeight: containerHeight,
    };
  }

  const imageAspect = imageWidth / imageHeight;
  const containerAspect = containerWidth / containerHeight;

  if (imageAspect > containerAspect) {
    const displayWidth = containerWidth;
    const displayHeight = containerWidth / imageAspect;

    return {
      offsetX: 0,
      offsetY: (containerHeight - displayHeight) / 2,
      displayWidth,
      displayHeight,
    };
  }

  const displayHeight = containerHeight;
  const displayWidth = containerHeight * imageAspect;

  return {
    offsetX: (containerWidth - displayWidth) / 2,
    offsetY: 0,
    displayWidth,
    displayHeight,
  };
}

export function containerToImageNormalized(
  localX: number,
  localY: number,
  containerWidth: number,
  containerHeight: number,
  layout: ImageLayout,
  zoom: number,
  panX: number,
  panY: number,
): { x: number; y: number } {
  const centerX = containerWidth / 2;
  const centerY = containerHeight / 2;
  const imageX = centerX + (localX - panX - centerX) / zoom;
  const imageY = centerY + (localY - panY - centerY) / zoom;

  return {
    x: (imageX - layout.offsetX) / layout.displayWidth,
    y: (imageY - layout.offsetY) / layout.displayHeight,
  };
}

export function imageNormalizedToContainer(
  normX: number,
  normY: number,
  containerWidth: number,
  containerHeight: number,
  layout: ImageLayout,
  zoom: number,
  panX: number,
  panY: number,
): { x: number; y: number } {
  const centerX = containerWidth / 2;
  const centerY = containerHeight / 2;
  const imageX = layout.offsetX + normX * layout.displayWidth;
  const imageY = layout.offsetY + normY * layout.displayHeight;

  return {
    x: centerX + (imageX - centerX) * zoom + panX,
    y: centerY + (imageY - centerY) * zoom + panY,
  };
}

export function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}
