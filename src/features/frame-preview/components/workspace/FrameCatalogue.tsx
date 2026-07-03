"use client";

import { useCallback, useEffect, useState } from "react";
import { SAMPLE_FRAMES } from "../../sampleFrames";
import type { SavedFrameProfileSummary } from "../../framing.types";
import {
  getFrameProfileThumbnailUrl,
  listSavedFrameProfiles,
  loadFrameProfile,
} from "../../storage/frameProfileStorage";
import type { FrameCatalogueSelection } from "../../ui/appUi.types";

interface FrameCatalogueProps {
  selection: FrameCatalogueSelection | null;
  onSelectBuiltin: (id: string) => void;
  onSelectProfile: (id: string, data: import("../../framing.types").SerializableFrameProfile) => void;
}

export function FrameCatalogue({
  selection,
  onSelectBuiltin,
  onSelectProfile,
}: FrameCatalogueProps) {
  const [profiles, setProfiles] = useState<SavedFrameProfileSummary[]>([]);
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});

  const refreshProfiles = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    let cancelled = false;
    const urls: string[] = [];

    void (async () => {
      const next: Record<string, string> = {};
      for (const profile of profiles) {
        const url = await getFrameProfileThumbnailUrl(profile.id);
        if (cancelled) {
          if (url) URL.revokeObjectURL(url);
          continue;
        }
        if (url) {
          next[profile.id] = url;
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
  }, [profiles]);

  const handleProfileClick = async (id: string) => {
    const record = await loadFrameProfile(id);
    if (!record) {
      return;
    }
    onSelectProfile(id, record.data);
  };

  const isSelected = (kind: "builtin" | "profile", id: string) =>
    selection?.kind === kind && selection.id === id;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {SAMPLE_FRAMES.map((frame) => (
          <button
            key={frame.id}
            type="button"
            onClick={() => onSelectBuiltin(frame.id)}
            className={`fs-card text-left ${
              isSelected("builtin", frame.id) ? "fs-card-selected" : ""
            }`}
          >
            <div
              className="aspect-[5/3]"
              style={{ backgroundColor: frame.fallbackColor }}
            >
              {frame.textureUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={frame.textureUrl}
                  alt=""
                  className="h-full w-full object-cover opacity-90"
                />
              ) : null}
            </div>
            <div className="px-2 py-2">
              <p className="text-xs font-medium text-fs-primary">{frame.name}</p>
              <p className="text-[10px] text-fs-muted">Library</p>
            </div>
          </button>
        ))}

        {profiles.map((profile) => (
          <button
            key={profile.id}
            type="button"
            onClick={() => void handleProfileClick(profile.id)}
            className={`fs-card text-left ${
              isSelected("profile", profile.id) ? "fs-card-selected" : ""
            }`}
          >
            <div className="aspect-[5/3] bg-fs-bg-elevated">
              {thumbnails[profile.id] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={thumbnails[profile.id]}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : null}
            </div>
            <div className="px-2 py-2">
              <p className="text-xs font-medium text-fs-primary">{profile.name}</p>
              <p className="text-[10px] text-fs-gold">Your profile</p>
            </div>
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => void refreshProfiles()}
        className="text-[10px] text-fs-muted-light hover:text-fs-gold"
      >
        Refresh profiles
      </button>
    </div>
  );
}
