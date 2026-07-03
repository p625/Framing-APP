"use client";

import { useCallback, useEffect, useState } from "react";
import type { SavedProjectSummary } from "../../framing.types";
import {
  deleteProject,
  getProjectThumbnailUrl,
  listSavedProjects,
  loadProject,
  renameProject,
  saveProject,
} from "../../storage/projectStorage";

interface SavedArtworksGridProps {
  onExportProject: () => Promise<import("../../framing.types").SerializableProject>;
  onImportProject: (project: import("../../framing.types").SerializableProject) => void;
}

interface ThumbnailState {
  url: string;
}

export function SavedArtworksGrid({
  onExportProject,
  onImportProject,
}: SavedArtworksGridProps) {
  const [projects, setProjects] = useState<SavedProjectSummary[]>([]);
  const [thumbnails, setThumbnails] = useState<Record<string, ThumbnailState>>({});
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [saveName, setSaveName] = useState("");

  const refresh = useCallback(async () => {
    const items = await listSavedProjects();
    setProjects(items);
    return items;
  }, []);

  useEffect(() => {
    let cancelled = false;
    void listSavedProjects().then((items) => {
      if (!cancelled) {
        setProjects(items);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const urlsToRevoke: string[] = [];
    let cancelled = false;

    void (async () => {
      const next: Record<string, ThumbnailState> = {};
      for (const project of projects) {
        const url = await getProjectThumbnailUrl(project.id);
        if (cancelled) {
          if (url) URL.revokeObjectURL(url);
          continue;
        }
        if (url) {
          next[project.id] = { url };
          urlsToRevoke.push(url);
        }
      }
      if (!cancelled) {
        setThumbnails((previous) => {
          Object.values(previous).forEach((item) => URL.revokeObjectURL(item.url));
          return next;
        });
      }
    })();

    return () => {
      cancelled = true;
      urlsToRevoke.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [projects]);

  const handleSaveCurrent = async () => {
    if (!saveName.trim()) {
      setStatus("Enter a name to save.");
      return;
    }
    try {
      const data = await onExportProject();
      await saveProject(saveName, data);
      await refresh();
      setStatus(`Saved "${saveName.trim()}".`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Save failed.");
    }
  };

  const handleLoad = async (id: string) => {
    const record = await loadProject(id);
    if (!record) {
      setStatus("Project not found.");
      return;
    }
    onImportProject(record.data);
    setSaveName(record.name);
    setStatus(`Opened "${record.name}".`);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}"?`)) {
      return;
    }
    await deleteProject(id);
    await refresh();
    setStatus(`Deleted "${name}".`);
  };

  const startRename = (project: SavedProjectSummary) => {
    setRenamingId(project.id);
    setRenameValue(project.name);
  };

  const commitRename = async () => {
    if (!renamingId || !renameValue.trim()) {
      setRenamingId(null);
      return;
    }
    await renameProject(renamingId, renameValue);
    setRenamingId(null);
    await refresh();
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-zinc-500">Saved locally in this browser.</p>

      <div className="flex gap-2">
        <input
          type="text"
          value={saveName}
          onChange={(event) => setSaveName(event.target.value)}
          placeholder="Save current work as…"
          className="min-w-0 flex-1 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs outline-none focus:border-zinc-400"
        />
        <button
          type="button"
          onClick={() => void handleSaveCurrent()}
          className="shrink-0 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800"
        >
          Save
        </button>
      </div>

      {projects.length === 0 ? (
        <p className="text-xs text-zinc-400">No saved artworks yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {projects.map((project) => {
            const thumb = thumbnails[project.id];
            return (
              <div
                key={project.id}
                role="button"
                tabIndex={0}
                onDoubleClick={() => void handleLoad(project.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    void handleLoad(project.id);
                  }
                }}
                className="group overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="aspect-[4/3] bg-zinc-100">
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={thumb.url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[10px] text-zinc-400">
                      No preview
                    </div>
                  )}
                </div>
                <div className="space-y-1 p-2">
                  {renamingId === project.id ? (
                    <input
                      value={renameValue}
                      onChange={(event) => setRenameValue(event.target.value)}
                      onBlur={() => void commitRename()}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          void commitRename();
                        }
                      }}
                      className="w-full rounded border border-zinc-200 px-1 py-0.5 text-xs"
                      autoFocus
                    />
                  ) : (
                    <p className="truncate text-xs font-medium text-zinc-800">{project.name}</p>
                  )}
                  <p className="text-[10px] text-zinc-400">
                    {new Date(project.savedAt).toLocaleDateString()}
                  </p>
                  <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => startRename(project)}
                      className="text-[10px] text-zinc-500 hover:text-zinc-900"
                    >
                      Rename
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(project.id, project.name)}
                      className="text-[10px] text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {status ? <p className="text-xs text-zinc-500">{status}</p> : null}
    </div>
  );
}
