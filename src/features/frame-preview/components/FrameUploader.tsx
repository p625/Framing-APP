"use client";

interface FrameUploaderProps {
  customFrameFile: File | null;
  onCustomFrameSelect: (file: File | null) => void;
}

export function FrameUploader({ customFrameFile, onCustomFrameSelect }: FrameUploaderProps) {
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-medium text-zinc-900">Custom frame</h2>
      <label className="flex cursor-pointer items-center justify-between rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm transition-colors hover:border-zinc-300">
        <span className="truncate text-zinc-600">
          {customFrameFile ? customFrameFile.name : "Upload custom texture"}
        </span>
        <span className="ml-2 shrink-0 text-xs text-zinc-400">Browse</span>
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0] ?? null;
            onCustomFrameSelect(file);
          }}
        />
      </label>
      {customFrameFile && (
        <button
          type="button"
          onClick={() => onCustomFrameSelect(null)}
          className="text-xs text-zinc-500 underline hover:text-zinc-700"
        >
          Remove custom frame
        </button>
      )}
    </section>
  );
}
