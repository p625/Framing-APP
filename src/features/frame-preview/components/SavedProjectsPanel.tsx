"use client";

import { useCallback, useEffect, useState } from "react";
import type { SavedProjectSummary } from "../framing.types";
import {
  deleteProject,
  listSavedProjects,
  loadProject,
  saveProject,
} from "../storage/projectStorage";
import { LOCAL_STORAGE_HINT, SidebarSection } from "./SidebarSection";

interface SavedProjectsPanelProps {
  onExportProject: () => Promise<import("../framing.types").SerializableProject>;
  onImportProject: (project: import("../framing.types").SerializableProject) => void;
}

function formatSavedAt(timestamp: number): string {
  return new Date(timestamp).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function SavedProjectsPanel({
  onExportProject,
  onImportProject,
}: SavedProjectsPanelProps) {
  const [projectName, setProjectName] = useState("");
  const [projects, setProjects] = useState<SavedProjectSummary[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refreshProjects = useCallback(async () => {
    const items = await listSavedProjects();
    setProjects(items);
    setSelectedId((current) =>
      current && items.some((item) => item.id === current) ? current : (items[0]?.id ?? ""),
    );
    return items;
  }, []);

  useEffect(() => {
    let cancelled = false;
    void listSavedProjects().then((items) => {
      if (cancelled) {
        return;
      }
      setProjects(items);
      setSelectedId(items[0]?.id ?? "");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async () => {
    if (!projectName.trim()) {
      setStatus("Enter a project name.");
      return;
    }

    setBusy(true);
    setStatus(null);
    try {
      const data = await onExportProject();
      const id = await saveProject(projectName, data);
      await refreshProjects();
      setSelectedId(id);
      setStatus(`Saved "${projectName.trim()}".`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not save project.");
    } finally {
      setBusy(false);
    }
  };

  const handleLoad = async () => {
    if (!selectedId) {
      setStatus("Select a project to load.");
      return;
    }

    setBusy(true);
    setStatus(null);
    try {
      const record = await loadProject(selectedId);
      if (!record) {
        setStatus("Project not found.");
        return;
      }
      onImportProject(record.data);
      setProjectName(record.name);
      setStatus(`Loaded "${record.name}".`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not load project.");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedId) {
      setStatus("Select a project to delete.");
      return;
    }

    const selected = projects.find((item) => item.id === selectedId);
    if (!selected) {
      return;
    }

    if (!window.confirm(`Delete saved project "${selected.name}"?`)) {
      return;
    }

    setBusy(true);
    setStatus(null);
    try {
      await deleteProject(selectedId);
      await refreshProjects();
      setStatus(`Deleted "${selected.name}".`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not delete project.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SidebarSection title="Saved work">
      <p className="text-xs text-zinc-500">{LOCAL_STORAGE_HINT}</p>

      <div className="space-y-2">
        <label className="block text-xs font-medium text-zinc-700" htmlFor="project-name">
          Project name
        </label>
        <input
          id="project-name"
          type="text"
          value={projectName}
          onChange={(event) => setProjectName(event.target.value)}
          placeholder="My framing project"
          className="w-full rounded-md border border-zinc-200 px-2.5 py-1.5 text-sm text-zinc-900 outline-none focus:border-zinc-400"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={busy}
          className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50"
        >
          Save project
        </button>
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-medium text-zinc-700" htmlFor="saved-project">
          Load project
        </label>
        <select
          id="saved-project"
          value={selectedId}
          onChange={(event) => setSelectedId(event.target.value)}
          className="w-full rounded-md border border-zinc-200 px-2.5 py-1.5 text-sm text-zinc-900 outline-none focus:border-zinc-400"
        >
          {projects.length === 0 ? (
            <option value="">No saved projects</option>
          ) : (
            projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name} ({formatSavedAt(project.savedAt)})
              </option>
            ))
          )}
        </select>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void handleLoad()}
          disabled={busy || !selectedId}
          className="rounded-md border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-800 transition-colors hover:border-zinc-300 disabled:opacity-50"
        >
          Load
        </button>
        <button
          type="button"
          onClick={() => void handleDelete()}
          disabled={busy || !selectedId}
          className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:border-red-300 disabled:opacity-50"
        >
          Delete
        </button>
      </div>

      {status ? <p className="text-xs text-zinc-600">{status}</p> : null}
    </SidebarSection>
  );
}
