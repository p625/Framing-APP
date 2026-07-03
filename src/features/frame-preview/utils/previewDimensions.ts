import type { CanvasSize, MatSettings } from "../framing.types";
import { computeFramedLayout } from "../renderer/drawFramedArtwork";

export interface PreviewDimensionsSummary {
  artworkWidthCm: number;
  artworkHeightCm: number;
  matEnabled: boolean;
  matWidthCm: number;
  matColor: string;
  frameWidthCm: number;
  totalWidthCm: number;
  totalHeightCm: number;
}

export interface PreviewMeasurementLayout {
  artworkLeftPct: number;
  artworkTopPct: number;
  artworkWidthPct: number;
  artworkHeightPct: number;
  totalLeftPct: number;
  totalTopPct: number;
  totalWidthPct: number;
  totalHeightPct: number;
}

const REFERENCE_CANVAS_SIZE = 1000;

export function computePreviewDimensionsSummary(
  canvasSize: CanvasSize,
  frameWidthCm: number,
  matSettings: MatSettings,
): PreviewDimensionsSummary {
  const matWidthCm = matSettings.enabled ? matSettings.widthCm : 0;
  const matOuterWidthCm = canvasSize.widthCm + matWidthCm * 2;
  const matOuterHeightCm = canvasSize.heightCm + matWidthCm * 2;

  return {
    artworkWidthCm: canvasSize.widthCm,
    artworkHeightCm: canvasSize.heightCm,
    matEnabled: matSettings.enabled,
    matWidthCm,
    matColor: matSettings.color,
    frameWidthCm,
    totalWidthCm: matOuterWidthCm + frameWidthCm * 2,
    totalHeightCm: matOuterHeightCm + frameWidthCm * 2,
  };
}

export function computePreviewMeasurementLayout(
  canvasSize: CanvasSize,
  frameWidthCm: number,
  matSettings: MatSettings,
): PreviewMeasurementLayout {
  const layout = computeFramedLayout(
    REFERENCE_CANVAS_SIZE,
    REFERENCE_CANVAS_SIZE,
    canvasSize,
    frameWidthCm,
    matSettings,
  );

  return {
    artworkLeftPct: (layout.artX / REFERENCE_CANVAS_SIZE) * 100,
    artworkTopPct: (layout.artY / REFERENCE_CANVAS_SIZE) * 100,
    artworkWidthPct: (layout.artworkPxW / REFERENCE_CANVAS_SIZE) * 100,
    artworkHeightPct: (layout.artworkPxH / REFERENCE_CANVAS_SIZE) * 100,
    totalLeftPct: (layout.offsetX / REFERENCE_CANVAS_SIZE) * 100,
    totalTopPct: (layout.offsetY / REFERENCE_CANVAS_SIZE) * 100,
    totalWidthPct: (layout.totalPxW / REFERENCE_CANVAS_SIZE) * 100,
    totalHeightPct: (layout.totalPxH / REFERENCE_CANVAS_SIZE) * 100,
  };
}

export function formatCm(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(1);
}
