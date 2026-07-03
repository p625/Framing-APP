"use client";

import { useCallback, useEffect, useState } from "react";
import { BUILTIN_ENVIRONMENTS } from "../../defaults/builtinEnvironments";
import type { SavedEnvironmentSummary } from "../../framing.types";
import type { EnvironmentSelection } from "../../framing.types";
import {
  deleteEnvironment,
  getEnvironmentThumbnailUrl,
  listSavedEnvironments,
  renameEnvironment,
  saveEnvironment,
} from "../../storage/environmentStorage";

interface EnvironmentCatalogueProps {
  selection: EnvironmentSelection;
  refreshKey: number;
  onSelectBuiltin: (id: string) => void;
  onSelectSaved: (id: string) => void;
  onCatalogueChanged: () => void;
}

export function EnvironmentCatalogue({
  selection,
  refreshKey,
  onSelectBuiltin,
  onSelectSaved,
  onCatalogueChanged,
}: EnvironmentCatalogueProps) {
  const [saved, setSaved] = useState<SavedEnvironmentSummary[]>([]);
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [uploadName, setUploadName] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const reload = useCallback(async () => {
    const items = await listSavedEnvironments();
    setSaved(items);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void listSavedEnvironments().then((items) => {
      if (!cancelled) {
        setSaved(items);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  useEffect(() => {
    let cancelled = false;
    const urls: string[] = [];

    void (async () => {
      const next: Record<string, string> = {};
      for (const item of saved) {
        const url = await getEnvironmentThumbnailUrl(item.id);
        if (cancelled) {
          if (url) URL.revokeObjectURL(url);
          continue;
        }
        if (url) {
          next[item.id] = url;
          urls.push(url);
        }
      }
      if (!cancelled) {
        setThumbnails((previous) => {
          Object.values(previous).forEach((url) => URL.revokeObjectURL(url));
          return next;
        });
      }
    })();

    return () => {
      cancelled = true;
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [saved]);

  const isSelected = (kind: "builtin" | "saved", id: string) =>
    selection?.kind === kind && selection.id === id;

  const handleUpload = async (file: File | null) => {
    if (!file) {
      return;
    }
    const name = uploadName.trim() || file.name.replace(/\.[^.]+$/, "");
    try {
      const id = await saveEnvironment(name, file);
      onCatalogueChanged();
      await reload();
      onSelectSaved(id);
      setUploadName(name);
      setStatus(`Saved environment "${name}".`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Upload failed.");
    }
  };

  const handleDelete = async (item: SavedEnvironmentSummary) => {
    if (!window.confirm(`Delete environment "${item.name}"?`)) {
      return;
    }
    await deleteEnvironment(item.id);
    onCatalogueChanged();
    await reload();
    setStatus(`Deleted "${item.name}".`);
  };

  const commitRename = async () => {
    if (!renamingId || !renameValue.trim()) {
      setRenamingId(null);
      return;
    }
    await renameEnvironment(renamingId, renameValue);
    setRenamingId(null);
    onCatalogueChanged();
    await reload();
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {BUILTIN_ENVIRONMENTS.map((env) => (
          <button
            key={env.id}
            type="button"
            onClick={() => onSelectBuiltin(env.id)}
            className={`fs-card text-left ${
              isSelected("builtin", env.id) ? "fs-card-selected" : ""
            }`}
          >
            <div className="aspect-[5/3] overflow-hidden bg-fs-bg-elevated">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={env.thumbnailUrl} alt="" className="h-full w-full object-cover" />
            </div>
            <div className="px-2 py-2">
              <p className="text-xs font-medium text-fs-primary">{env.name}</p>
              <p className="text-[10px] text-fs-muted">Built-in</p>
            </div>
          </button>
        ))}

        {saved.map((item) => (
          <div
            key={item.id}
            className={`fs-card text-left ${
              isSelected("saved", item.id) ? "fs-card-selected" : ""
            }`}
          >
            <button
              type="button"
              onClick={() => onSelectSaved(item.id)}
              className="w-full text-left"
            >
              <div className="aspect-[5/3] overflow-hidden bg-fs-bg-elevated">
                {thumbnails[item.id] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={thumbnails[item.id]}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </div>
              <div className="px-2 py-2">
                {renamingId === item.id ? (
                  <input
                    value={renameValue}
                    onChange={(event) => setRenameValue(event.target.value)}
                    onBlur={() => void commitRename()}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        void commitRename();
                      }
                    }}
                    className="fs-input w-full text-xs"
                    autoFocus
                  />
                ) : (
                  <p className="truncate text-xs font-medium text-fs-primary">{item.name}</p>
                )}
                <p className="text-[10px] text-fs-gold">Your room</p>
              </div>
            </button>
            <div className="flex gap-2 px-2 pb-2">
              <button
                type="button"
                onClick={() => {
                  setRenamingId(item.id);
                  setRenameValue(item.name);
                }}
                className="text-[10px] text-fs-muted hover:text-fs-primary"
              >
                Rename
              </button>
              <button
                type="button"
                onClick={() => void handleDelete(item)}
                className="text-[10px] text-fs-error hover:underline"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-2 border-t border-fs-border pt-3">
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-[var(--fs-radius-lg)] border border-dashed border-fs-border-strong bg-fs-bg-elevated px-3 py-4 text-center hover:border-fs-gold">
          <span className="text-xs font-medium text-fs-primary">Upload environment</span>
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(event) => void handleUpload(event.target.files?.[0] ?? null)}
          />
        </label>
        <input
          type="text"
          value={uploadName}
          onChange={(event) => setUploadName(event.target.value)}
          placeholder="Name for new environment (optional)"
          className="fs-input w-full text-xs"
        />
      </div>

      {status ? <p className="fs-caption">{status}</p> : null}
    </div>
  );
}
