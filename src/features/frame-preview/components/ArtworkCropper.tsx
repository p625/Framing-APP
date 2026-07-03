"use client";

import type { CropRect } from "../framing.types";

interface ArtworkCropperProps {
  artworkPreviewUrl: string | null;
  cropRect: CropRect | null;
  onCropChange: (rect: CropRect | null) => void;
}

export function ArtworkCropper({
  artworkPreviewUrl,
  cropRect,
  onCropChange,
}: ArtworkCropperProps) {
  if (!artworkPreviewUrl) {
    return null;
  }

  return (
    <section className="space-y-2">
      <h2 className="text-sm font-medium text-zinc-900">Crop</h2>
      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={artworkPreviewUrl}
          alt="Artwork preview for cropping"
          className="max-h-48 w-full object-contain"
        />
      </div>
      <p className="text-xs text-zinc-500">
        Cropping UI coming soon
        {cropRect ? ` (crop set: ${cropRect.width}×${cropRect.height})` : ""}.
      </p>
      <button
        type="button"
        disabled
        onClick={() => onCropChange(null)}
        className="rounded-md border border-zinc-200 px-3 py-1.5 text-xs text-zinc-400"
      >
        Reset crop
      </button>
    </section>
  );
}
