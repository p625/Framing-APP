"use client";

interface ArtworkUploaderProps {
  artworkFile: File | null;
  onArtworkSelect: (file: File | null) => void;
}

export function ArtworkUploader({ artworkFile, onArtworkSelect }: ArtworkUploaderProps) {
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-medium text-zinc-900">Artwork</h2>
      <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-4 py-6 transition-colors hover:border-zinc-400 hover:bg-zinc-100">
        <span className="text-sm text-zinc-600">
          {artworkFile ? artworkFile.name : "Click to upload an image"}
        </span>
        <span className="mt-1 text-xs text-zinc-400">PNG, JPG, or WebP</span>
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0] ?? null;
            onArtworkSelect(file);
          }}
        />
      </label>
      {artworkFile && (
        <button
          type="button"
          onClick={() => onArtworkSelect(null)}
          className="text-xs text-zinc-500 underline hover:text-zinc-700"
        >
          Remove artwork
        </button>
      )}
    </section>
  );
}
