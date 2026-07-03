"use client";

interface ArtworkUploaderProps {
  artworkFile: File | null;
  onArtworkSelect: (file: File | null) => void;
}

export function ArtworkUploader({ artworkFile, onArtworkSelect }: ArtworkUploaderProps) {
  return (
    <section className="space-y-2">
      {artworkFile ? (
        <div className="fs-card overflow-hidden">
          <div className="flex items-center justify-between gap-2 border-b border-fs-border px-3 py-2">
            <span className="truncate text-xs font-medium text-fs-primary">
              {artworkFile.name}
            </span>
            <button
              type="button"
              onClick={() => onArtworkSelect(null)}
              className="fs-btn fs-btn-ghost shrink-0 px-2 py-1"
            >
              Remove
            </button>
          </div>
          <label className="flex cursor-pointer items-center justify-center px-3 py-2 text-xs text-fs-muted hover:bg-fs-bg-elevated">
            Replace photo
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                onArtworkSelect(file);
              }}
            />
          </label>
        </div>
      ) : (
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-[var(--fs-radius-lg)] border border-dashed border-fs-border-strong bg-fs-bg-elevated px-4 py-6 transition-colors hover:border-fs-gold hover:bg-fs-gold-muted/40">
          <span className="text-sm font-medium text-fs-primary">Upload artwork photo</span>
          <span className="mt-1 text-center text-xs text-fs-muted">
            Photograph the artwork on a wall or table. PNG, JPG, or WebP.
          </span>
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              onArtworkSelect(file);
            }}
          />
        </label>
      )}
    </section>
  );
}
