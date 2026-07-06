"use client";

import { useCallback, useEffect, useState } from "react";
import {
  isBuiltinFrameProfileId,
  listCatalogueFrameProfiles,
  type CatalogueFrameProfileSummary,
} from "../../storage/frameProfileCatalogue";
import { deleteFrameProfile } from "../../storage/frameProfileStorage";

interface ProfileManagementListProps {
  activeProfileId: string | null;
  refreshKey: number;
  onSelectProfile: (id: string) => void;
  onProfileDeleted: (id: string) => void;
  onCatalogueChanged: () => void;
  onDuplicateBuiltin?: (id: string) => void;
}

export function ProfileManagementList({
  activeProfileId,
  refreshKey,
  onSelectProfile,
  onProfileDeleted,
  onCatalogueChanged,
  onDuplicateBuiltin,
}: ProfileManagementListProps) {
  const [profiles, setProfiles] = useState<CatalogueFrameProfileSummary[]>([]);

  const reload = useCallback(async () => {
    const items = await listCatalogueFrameProfiles();
    setProfiles(items);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void listCatalogueFrameProfiles().then((items) => {
      if (!cancelled) {
        setProfiles(items);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const handleDelete = async (profile: CatalogueFrameProfileSummary) => {
    if (profile.kind === "builtin") {
      return;
    }

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
        No profiles available yet.
      </p>
    );
  }

  return (
    <div className="space-y-2 border-t border-fs-border pt-3">
      <span className="fs-subheading text-xs">Catalogue profiles</span>
      <ul className="space-y-1">
        {profiles.map((profile) => {
          const isActive = activeProfileId === profile.id;
          const isBuiltin = profile.kind === "builtin";
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
              {isBuiltin ? (
                <button
                  type="button"
                  onClick={() => onDuplicateBuiltin?.(profile.id)}
                  className="fs-btn fs-btn-secondary shrink-0 px-2 py-1 text-[10px]"
                >
                  Duplicate
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void handleDelete(profile)}
                  className="fs-btn fs-btn-danger shrink-0 px-2 py-1"
                  aria-label={`Delete ${profile.name}`}
                >
                  Delete
                </button>
              )}
            </li>
          );
        })}
      </ul>
      {profiles.some((profile) => isBuiltinFrameProfileId(profile.id)) ? (
        <p className="text-[10px] text-fs-muted-light">
          Built-in profiles are read-only. Duplicate one to create an editable copy.
        </p>
      ) : null}
    </div>
  );
}
