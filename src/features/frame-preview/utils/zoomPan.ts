export const EDITOR_MIN_ZOOM = 1;
export const EDITOR_MAX_ZOOM = 4;
export const EDITOR_ZOOM_STEP = 0.25;
export const EDITOR_WHEEL_ZOOM_FACTOR = 0.12;

export function clampZoom(
  zoom: number,
  minZoom = EDITOR_MIN_ZOOM,
  maxZoom = EDITOR_MAX_ZOOM,
): number {
  return Math.min(maxZoom, Math.max(minZoom, zoom));
}

export function computePanForZoomAtPoint(
  localX: number,
  localY: number,
  containerWidth: number,
  containerHeight: number,
  oldZoom: number,
  newZoom: number,
  oldPanX: number,
  oldPanY: number,
): { x: number; y: number } {
  const centerX = containerWidth / 2;
  const centerY = containerHeight / 2;
  const imageX = centerX + (localX - oldPanX - centerX) / oldZoom;
  const imageY = centerY + (localY - oldPanY - centerY) / oldZoom;

  return {
    x: localX - centerX - (imageX - centerX) * newZoom,
    y: localY - centerY - (imageY - centerY) * newZoom,
  };
}

export function applyWheelZoom(
  currentZoom: number,
  deltaY: number,
  localX: number,
  localY: number,
  containerWidth: number,
  containerHeight: number,
  panX: number,
  panY: number,
): { zoom: number; panX: number; panY: number } {
  const direction = deltaY > 0 ? -1 : 1;
  const newZoom = clampZoom(currentZoom * (1 + direction * EDITOR_WHEEL_ZOOM_FACTOR));
  const pan = computePanForZoomAtPoint(
    localX,
    localY,
    containerWidth,
    containerHeight,
    currentZoom,
    newZoom,
    panX,
    panY,
  );

  return { zoom: newZoom, panX: pan.x, panY: pan.y };
}
