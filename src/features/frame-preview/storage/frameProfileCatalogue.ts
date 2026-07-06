import {
  DEFAULT_FRAME_PROFILES,
  defaultFrameProfileToSerializable,
  getDefaultFrameProfile,
  isDefaultFrameProfileId,
  type DefaultFrameProfile,
} from "../data/defaultFrameProfiles";
import {
  loadCloudFrameProfile,
  type CloudFrameProfileSummary,
} from "../services/cloudFrameProfiles";
import type { SavedFrameProfileSummary, SerializableFrameProfile } from "../framing.types";
import { blobFromUrl } from "../storage/blobUtils";
import {
  getFrameProfileThumbnailUrl,
  listSavedFrameProfiles,
  loadFrameProfile,
} from "../storage/frameProfileStorage";

export type CatalogueFrameProfileKind = "builtin" | "user" | "cloud";

export interface CatalogueFrameProfileSummary {
  id: string;
  name: string;
  category?: string;
  kind: CatalogueFrameProfileKind;
  thumbnailUrl?: string;
  savedAt?: number;
  isFeatured?: boolean;
}

export { isDefaultFrameProfileId as isBuiltinFrameProfileId, getDefaultFrameProfile };

export function isCloudFrameProfileKind(
  kind: CatalogueFrameProfileKind,
): kind is "cloud" {
  return kind === "cloud";
}

export function cloudSummaryToCatalogueSummary(
  profile: CloudFrameProfileSummary,
): CatalogueFrameProfileSummary {
  return {
    id: profile.id,
    name: profile.name,
    category: profile.category,
    kind: "cloud",
    thumbnailUrl: profile.thumbnailUrl,
    isFeatured: profile.isFeatured,
  };
}

export async function loadBuiltinFrameProfile(
  id: string,
): Promise<{ name: string; data: SerializableFrameProfile } | null> {
  const profile = getDefaultFrameProfile(id);
  if (!profile) {
    return null;
  }

  const blob = await blobFromUrl(profile.sampleImageUrl);
  const fileName = profile.sampleImageUrl.split("/").pop() ?? "frame-sample.svg";

  return {
    name: profile.name,
    data: defaultFrameProfileToSerializable(profile, {
      blob,
      name: fileName,
      type: blob.type || "image/svg+xml",
    }),
  };
}

export async function loadCatalogueFrameProfile(
  id: string,
): Promise<{
  name: string;
  data: SerializableFrameProfile;
  kind: CatalogueFrameProfileKind;
} | null> {
  const userProfile = await loadFrameProfile(id);
  if (userProfile) {
    return { ...userProfile, kind: "user" };
  }

  const cloudProfile = await loadCloudFrameProfile(id);
  if (cloudProfile) {
    return { ...cloudProfile, kind: "cloud" };
  }

  const builtinProfile = await loadBuiltinFrameProfile(id);
  if (builtinProfile) {
    return { ...builtinProfile, kind: "builtin" };
  }

  return null;
}

function builtinSummary(profile: DefaultFrameProfile): CatalogueFrameProfileSummary {
  return {
    id: profile.id,
    name: profile.name,
    category: profile.category,
    kind: "builtin",
    thumbnailUrl: profile.thumbnailUrl,
  };
}

function userSummary(profile: SavedFrameProfileSummary): CatalogueFrameProfileSummary {
  return {
    id: profile.id,
    name: profile.name,
    kind: "user",
    savedAt: profile.savedAt,
  };
}

export async function listLocalCatalogueFrameProfiles(): Promise<
  CatalogueFrameProfileSummary[]
> {
  const userProfiles = await listSavedFrameProfiles();
  const overriddenBuiltinIds = new Set(
    userProfiles
      .map((profile) => profile.id)
      .filter((id) => isDefaultFrameProfileId(id)),
  );

  const builtins = DEFAULT_FRAME_PROFILES.filter(
    (profile) => !overriddenBuiltinIds.has(profile.id),
  ).map(builtinSummary);

  const users = userProfiles.map(userSummary);

  return [...builtins, ...users];
}

/** @deprecated Use listLocalCatalogueFrameProfiles in the profile editor. */
export async function listCatalogueFrameProfiles(): Promise<CatalogueFrameProfileSummary[]> {
  return listLocalCatalogueFrameProfiles();
}

export function mergeCatalogueProfiles(
  localProfiles: CatalogueFrameProfileSummary[],
  cloudProfiles: CatalogueFrameProfileSummary[],
): CatalogueFrameProfileSummary[] {
  const localIds = new Set(localProfiles.map((profile) => profile.id));
  const cloud = cloudProfiles.filter((profile) => !localIds.has(profile.id));
  return [...localProfiles, ...cloud];
}

export async function getCatalogueFrameProfileThumbnailUrl(
  profile: CatalogueFrameProfileSummary,
): Promise<string | null> {
  if (profile.kind === "builtin" || profile.kind === "cloud") {
    return profile.thumbnailUrl ?? null;
  }

  return getFrameProfileThumbnailUrl(profile.id);
}
