"use client";

import { useCallback, useEffect, useState } from "react";
import {
  isBuiltinFrameProfileId,
  listEditorFrameProfiles,
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
  const [cloudError, setCloudError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const result = await listEditorFrameProfiles();
    setProfiles(result.profiles);
    setCloudError(result.cloudError);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void listEditorFrameProfiles().then((result) => {
      if (!cancelled) {
        setProfiles(result.profiles);
        setCloudError(result.cloudError);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const handleDelete = async (profile: CatalogueFrameProfileSummary) => {
    if (profile.kind === "builtin" || profile.kind === "cloud") {
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

  if (profiles.length === 0 && !cloudError) {
    return (
      <p className="fs-caption border-t border-fs-border pt-3">
        No profiles available yet.
      </p>
    );
  }

  return (
    <div className="space-y-2 border-t border-fs-border pt-3">
      <span className="fs-subheading text-xs">Catalogue profiles</span>

      {cloudError ? (
        <p className="rounded-lg border border-fs-warning/25 bg-fs-warning-bg px-2 py-1.5 text-[10px] text-fs-warning">
          Cloud profiles unavailable: {cloudError}
        </p>
      ) : null}

      <ul className="space-y-1">
        {profiles.map((profile) => {
          const isActive = activeProfileId === profile.id;
          const isBuiltin = profile.kind === "builtin";
          const isCloud = profile.kind === "cloud";
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
                {isCloud ? (
                  <span className="ml-1 text-[10px] font-normal text-fs-muted">
                    {profile.isPublished === false ? "(unpublished)" : "(cloud)"}
                  </span>
                ) : null}
              </button>
              {isBuiltin ? (
                <button
                  type="button"
                  onClick={() => onDuplicateBuiltin?.(profile.id)}
                  className="fs-btn fs-btn-secondary shrink-0 px-2 py-1 text-[10px]"
                >
                  Duplicate
                </button>
              ) : isCloud ? null : (
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
