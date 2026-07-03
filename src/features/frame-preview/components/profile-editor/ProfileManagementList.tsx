"use client";

import { useCallback, useEffect, useState } from "react";
import type { SavedFrameProfileSummary } from "../../framing.types";
import {
  deleteFrameProfile,
  listSavedFrameProfiles,
} from "../../storage/frameProfileStorage";

interface ProfileManagementListProps {
  activeProfileId: string | null;
  refreshKey: number;
  onSelectProfile: (id: string) => void;
  onProfileDeleted: (id: string) => void;
  onCatalogueChanged: () => void;
}

export function ProfileManagementList({
  activeProfileId,
  refreshKey,
  onSelectProfile,
  onProfileDeleted,
  onCatalogueChanged,
}: ProfileManagementListProps) {
  const [profiles, setProfiles] = useState<SavedFrameProfileSummary[]>([]);

  const reload = useCallback(async () => {
    const items = await listSavedFrameProfiles();
    setProfiles(items);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void listSavedFrameProfiles().then((items) => {
      if (!cancelled) {
        setProfiles(items);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const handleDelete = async (profile: SavedFrameProfileSummary) => {
    if (
      !window.confirm(
        `Delete saved profile "${profile.name}"? This cannot be undone.`,
      )
    ) {
      return;
    }

    await deleteFrameProfile(profile.id);
    await reload();
    onCatalogueChanged();
    onProfileDeleted(profile.id);
  };

  if (profiles.length === 0) {
    return (
      <p className="fs-caption border-t border-fs-border pt-3">
        No saved profiles yet. Save to add to your catalogue.
      </p>
    );
  }

  return (
    <div className="space-y-2 border-t border-fs-border pt-3">
      <span className="fs-subheading text-xs">Saved profiles</span>
      <ul className="space-y-1">
        {profiles.map((profile) => {
          const isActive = activeProfileId === profile.id;
          return (
            <li
              key={profile.id}
              className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 ${
                isActive ? "border-fs-gold bg-fs-gold-muted/50" : "border-fs-border"
              }`}
            >
              <button
                type="button"
                onClick={() => onSelectProfile(profile.id)}
                className="min-w-0 flex-1 truncate text-left text-xs font-medium text-fs-primary hover:underline"
              >
                {profile.name}
              </button>
              <button
                type="button"
                onClick={() => void handleDelete(profile)}
                className="fs-btn fs-btn-danger shrink-0 px-2 py-1"
                aria-label={`Delete ${profile.name}`}
              >
                Delete
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
