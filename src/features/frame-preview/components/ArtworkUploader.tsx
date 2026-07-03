"use client";

interface ArtworkUploaderProps {
  artworkFile: File | null;
  onArtworkSelect: (file: File | null) => void;
}

export function ArtworkUploader({ artworkFile, onArtworkSelect }: ArtworkUploaderProps) {
  return (
    <section className="space-y-2">
      {artworkFile ? (
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
          <div className="flex items-center justify-between gap-2 border-b border-zinc-200 px-3 py-2">
            <span className="truncate text-xs font-medium text-zinc-700">
              {artworkFile.name}
            </span>
            <button
              type="button"
              onClick={() => onArtworkSelect(null)}
              className="shrink-0 text-xs text-zinc-500 hover:text-zinc-900"
            >
              Remove
            </button>
          </div>
          <label className="flex cursor-pointer items-center justify-center px-3 py-2 text-xs text-zinc-600 hover:bg-zinc-100">
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
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-4 py-6 transition-colors hover:border-zinc-400 hover:bg-zinc-100">
          <span className="text-sm font-medium text-zinc-700">Upload artwork photo</span>
          <span className="mt-1 text-center text-xs text-zinc-500">
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
