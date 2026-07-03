"use client";

import { useCallback, useEffect, useState } from "react";
import type { SavedFrameProfileSummary } from "../framing.types";
import {
  deleteFrameProfile,
  listSavedFrameProfiles,
  loadFrameProfile,
  saveFrameProfile,
} from "../storage/frameProfileStorage";
import { LOCAL_STORAGE_HINT } from "./SidebarSection";

interface SavedFrameProfilesPanelProps {
  hasCustomFrame: boolean;
  onExportProfile: () => Promise<import("../framing.types").SerializableFrameProfile | null>;
  onImportProfile: (profile: import("../framing.types").SerializableFrameProfile) => void;
}

function formatSavedAt(timestamp: number): string {
  return new Date(timestamp).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function SavedFrameProfilesPanel({
  hasCustomFrame,
  onExportProfile,
  onImportProfile,
}: SavedFrameProfilesPanelProps) {
  const [profileName, setProfileName] = useState("");
  const [profiles, setProfiles] = useState<SavedFrameProfileSummary[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refreshProfiles = useCallback(async () => {
    const items = await listSavedFrameProfiles();
    setProfiles(items);
    setSelectedId((current) =>
      current && items.some((item) => item.id === current) ? current : (items[0]?.id ?? ""),
    );
    return items;
  }, []);

  useEffect(() => {
    let cancelled = false;
    void listSavedFrameProfiles().then((items) => {
      if (cancelled) {
        return;
      }
      setProfiles(items);
      setSelectedId(items[0]?.id ?? "");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async () => {
    if (!profileName.trim()) {
      setStatus("Enter a profile name.");
      return;
    }

    if (!hasCustomFrame) {
      setStatus("Upload a custom frame sample before saving a profile.");
      return;
    }

    setBusy(true);
    setStatus(null);
    try {
      const data = await onExportProfile();
      if (!data) {
        setStatus("Upload a custom frame sample before saving a profile.");
        return;
      }
      const id = await saveFrameProfile(profileName, data);
      await refreshProfiles();
      setSelectedId(id);
      setStatus(`Saved profile "${profileName.trim()}".`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not save profile.");
    } finally {
      setBusy(false);
    }
  };

  const handleLoad = async () => {
    if (!selectedId) {
      setStatus("Select a profile to load.");
      return;
    }

    setBusy(true);
    setStatus(null);
    try {
      const record = await loadFrameProfile(selectedId);
      if (!record) {
        setStatus("Profile not found.");
        return;
      }
      onImportProfile(record.data);
      setProfileName(record.name);
      setStatus(`Loaded profile "${record.name}".`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not load profile.");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedId) {
      setStatus("Select a profile to delete.");
      return;
    }

    const selected = profiles.find((item) => item.id === selectedId);
    if (!selected) {
      return;
    }

    if (!window.confirm(`Delete saved frame profile "${selected.name}"?`)) {
      return;
    }

    setBusy(true);
    setStatus(null);
    try {
      await deleteFrameProfile(selectedId);
      await refreshProfiles();
      setStatus(`Deleted "${selected.name}".`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not delete profile.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3 border-b border-zinc-100 pb-4">
      <h3 className="text-xs font-medium text-zinc-700">Saved frame profiles</h3>
      <p className="text-xs text-zinc-500">{LOCAL_STORAGE_HINT}</p>

      <div className="space-y-2">
        <label className="block text-xs font-medium text-zinc-700" htmlFor="profile-name">
          Profile name
        </label>
        <input
          id="profile-name"
          type="text"
          value={profileName}
          onChange={(event) => setProfileName(event.target.value)}
          placeholder="Oak corner profile"
          className="w-full rounded-md border border-zinc-200 px-2.5 py-1.5 text-sm text-zinc-900 outline-none focus:border-zinc-400"
        />
      </div>

      <button
        type="button"
        onClick={() => void handleSave()}
        disabled={busy || !hasCustomFrame}
        className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50"
      >
        Save current frame
      </button>

      <div className="space-y-2">
        <label className="block text-xs font-medium text-zinc-700" htmlFor="saved-profile">
          Load profile
        </label>
        <select
          id="saved-profile"
          value={selectedId}
          onChange={(event) => setSelectedId(event.target.value)}
          className="w-full rounded-md border border-zinc-200 px-2.5 py-1.5 text-sm text-zinc-900 outline-none focus:border-zinc-400"
        >
          {profiles.length === 0 ? (
            <option value="">No saved profiles</option>
          ) : (
            profiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.name} ({formatSavedAt(profile.savedAt)})
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
          Load profile
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
    </div>
  );
}
