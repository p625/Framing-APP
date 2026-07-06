"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { SAMPLE_FRAMES } from "../../sampleFrames";
import type { SerializableFrameProfile } from "../../framing.types";
import {
  refreshPublishedCloudFrameProfiles,
} from "../../services/cloudFrameProfiles";
import {
  cloudSummaryToCatalogueSummary,
  getCatalogueFrameProfileThumbnailUrl,
  listLocalCatalogueFrameProfiles,
  loadCatalogueFrameProfileForSummary,
  mergeCatalogueProfiles,
  type CatalogueFrameProfileSummary,
} from "../../storage/frameProfileCatalogue";
import type { FrameCatalogueSelection } from "../../ui/appUi.types";

type CatalogueProfileKind = "builtin-profile" | "cloud-profile" | "profile";

interface FrameCatalogueProps {
  selection: FrameCatalogueSelection | null;
  catalogueRefreshKey?: number;
  onSelectBuiltin: (id: string) => void;
  onSelectProfile: (
    id: string,
    data: SerializableFrameProfile,
    kind: CatalogueProfileKind,
  ) => void;
}

function catalogueKindFromSummary(
  kind: CatalogueFrameProfileSummary["kind"],
): CatalogueProfileKind {
  if (kind === "builtin") {
    return "builtin-profile";
  }
  if (kind === "cloud") {
    return "cloud-profile";
  }
  return "profile";
}

function sourceLabel(profile: CatalogueFrameProfileSummary): string {
  if (profile.kind === "cloud") {
    const parts = ["Cloud"];
    if (profile.category) {
      parts.push(profile.category);
    }
    if (profile.isFeatured) {
      parts.push("Featured");
    }
    return parts.join(" · ");
  }
  if (profile.kind === "builtin") {
    return profile.category ? `Category: ${profile.category}` : "Built-in profile";
  }
  return "Your profile";
}

export function FrameCatalogue({
  selection,
  catalogueRefreshKey = 0,
  onSelectBuiltin,
  onSelectProfile,
}: FrameCatalogueProps) {
  const [localProfiles, setLocalProfiles] = useState<CatalogueFrameProfileSummary[]>([]);
  const [cloudProfiles, setCloudProfiles] = useState<CatalogueFrameProfileSummary[]>([]);
  const [cloudLoading, setCloudLoading] = useState(true);
  const [cloudError, setCloudError] = useState<string | null>(null);
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [loadingProfileId, setLoadingProfileId] = useState<string | null>(null);

  const profiles = useMemo(
    () => mergeCatalogueProfiles(localProfiles, cloudProfiles),
    [cloudProfiles, localProfiles],
  );

  const refreshProfiles = useCallback(async () => {
    setCloudLoading(true);
    setCloudError(null);

    const [local, cloudResult] = await Promise.all([
      listLocalCatalogueFrameProfiles(),
      refreshPublishedCloudFrameProfiles(),
    ]);

    setLocalProfiles(local);
    setCloudProfiles(cloudResult.profiles.map(cloudSummaryToCatalogueSummary));
    setCloudError(cloudResult.error);
    setCloudLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setCloudLoading(true);
      setCloudError(null);

      const [local, cloudResult] = await Promise.all([
        listLocalCatalogueFrameProfiles(),
        refreshPublishedCloudFrameProfiles(),
      ]);

      if (cancelled) {
        return;
      }

      setLocalProfiles(local);
      setCloudProfiles(cloudResult.profiles.map(cloudSummaryToCatalogueSummary));
      setCloudError(cloudResult.error);
      setCloudLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [catalogueRefreshKey]);

  useEffect(() => {
    let cancelled = false;
    const urls: string[] = [];

    void (async () => {
      const next: Record<string, string> = {};
      for (const profile of profiles) {
        const url = await getCatalogueFrameProfileThumbnailUrl(profile);
        if (cancelled) {
          if (url?.startsWith("blob:")) {
            URL.revokeObjectURL(url);
          }
          continue;
        }
        if (url) {
          next[profile.id] = url;
          if (url.startsWith("blob:")) {
            urls.push(url);
          }
        }
      }
      if (!cancelled) {
        setThumbnails((previous) => {
          Object.values(previous).forEach((url) => {
            if (url.startsWith("blob:")) {
              URL.revokeObjectURL(url);
            }
          });
          return next;
        });
      }
    })();

    return () => {
      cancelled = true;
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [profiles]);

  const handleProfileClick = async (profile: CatalogueFrameProfileSummary) => {
    setLoadingProfileId(profile.id);
    try {
      const record = await loadCatalogueFrameProfileForSummary(profile);
      if (!record) {
        return;
      }
      onSelectProfile(profile.id, record.data, catalogueKindFromSummary(profile.kind));
    } finally {
      setLoadingProfileId(null);
    }
  };

  const isSelected = (kind: FrameCatalogueSelection["kind"], id: string) =>
    selection?.kind === kind && selection.id === id;

  const builtinProfiles = profiles.filter((profile) => profile.kind === "builtin");
  const cloudCatalogueProfiles = profiles.filter((profile) => profile.kind === "cloud");
  const userProfiles = profiles.filter((profile) => profile.kind === "user");

  const renderProfileCard = (
    profile: CatalogueFrameProfileSummary,
    selectedKind: FrameCatalogueSelection["kind"],
  ) => (
    <button
      key={profile.id}
      type="button"
      onClick={() => void handleProfileClick(profile)}
      disabled={loadingProfileId === profile.id}
      className={`fs-card text-left ${
        isSelected(selectedKind, profile.id) ? "fs-card-selected" : ""
      } ${profile.isFeatured ? "ring-1 ring-fs-gold/60" : ""} ${
        loadingProfileId === profile.id ? "opacity-70" : ""
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
        <p
          className={`text-[10px] ${
            profile.kind === "user" ? "text-fs-gold" : "text-fs-muted"
          }`}
        >
          {sourceLabel(profile)}
        </p>
      </div>
    </button>
  );

  return (
    <div className="space-y-3">
      {cloudLoading ? (
        <p className="fs-caption text-[11px]">Loading cloud profiles…</p>
      ) : null}

      {cloudError ? (
        <p className="rounded-lg border border-fs-warning/25 bg-fs-warning-bg px-2 py-1.5 text-[11px] text-fs-warning">
          Cloud profiles unavailable: {cloudError}
        </p>
      ) : null}

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

        {builtinProfiles.map((profile) =>
          renderProfileCard(profile, "builtin-profile"),
        )}

        {cloudCatalogueProfiles.map((profile) =>
          renderProfileCard(profile, "cloud-profile"),
        )}

        {userProfiles.map((profile) => renderProfileCard(profile, "profile"))}
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
