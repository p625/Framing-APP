import {
  DEFAULT_FRAME_PROFILES,
  defaultFrameProfileToSerializable,
  getDefaultFrameProfile,
  isDefaultFrameProfileId,
  type DefaultFrameProfile,
} from "../data/defaultFrameProfiles";
import {
  fetchAllCloudFrameProfilesForEditor,
  loadCloudFrameProfile,
  logCloudProfileDebug,
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
  isPublished?: boolean;
  customerTag?: string | null;
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
    category: profile.category || "Cloud",
    kind: "cloud",
    thumbnailUrl: profile.thumbnailUrl || undefined,
    isFeatured: profile.isFeatured,
    isPublished: profile.isPublished,
    customerTag: profile.customerTag,
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

  const cloudProfile = await loadCloudFrameProfile(id, { publishedOnly: false });
  if (cloudProfile) {
    return { ...cloudProfile, kind: "cloud" };
  }

  const builtinProfile = await loadBuiltinFrameProfile(id);
  if (builtinProfile) {
    return { ...builtinProfile, kind: "builtin" };
  }

  return null;
}

export async function loadCatalogueFrameProfileForSummary(
  profile: CatalogueFrameProfileSummary,
): Promise<{
  name: string;
  data: SerializableFrameProfile;
  kind: CatalogueFrameProfileKind;
} | null> {
  if (profile.kind === "cloud") {
    const cloudProfile = await loadCloudFrameProfile(profile.id, { publishedOnly: true });
    return cloudProfile ? { ...cloudProfile, kind: "cloud" } : null;
  }

  if (profile.kind === "builtin") {
    const builtinProfile = await loadBuiltinFrameProfile(profile.id);
    return builtinProfile ? { ...builtinProfile, kind: "builtin" } : null;
  }

  const userProfile = await loadFrameProfile(profile.id);
  return userProfile ? { ...userProfile, kind: "user" } : null;
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
  const merged = [...localProfiles];
  const indexById = new Map(merged.map((profile, index) => [profile.id, index]));

  for (const cloudProfile of cloudProfiles) {
    const existingIndex = indexById.get(cloudProfile.id);
    if (existingIndex !== undefined) {
      const localProfile = merged[existingIndex];
      logCloudProfileDebug("catalogue id collision", {
        id: cloudProfile.id,
        localKind: localProfile.kind,
        localName: localProfile.name,
        cloudName: cloudProfile.name,
      });
      merged[existingIndex] = cloudProfile;
      continue;
    }

    indexById.set(cloudProfile.id, merged.length);
    merged.push(cloudProfile);
  }

  return merged;
}

export async function listEditorFrameProfiles(): Promise<{
  profiles: CatalogueFrameProfileSummary[];
  cloudError: string | null;
}> {
  const [localProfiles, cloudResult] = await Promise.all([
    listLocalCatalogueFrameProfiles(),
    fetchAllCloudFrameProfilesForEditor(),
  ]);

  const cloudProfiles = cloudResult.profiles.map(cloudSummaryToCatalogueSummary);

  return {
    profiles: mergeCatalogueProfiles(localProfiles, cloudProfiles),
    cloudError: cloudResult.error,
  };
}

export async function getCatalogueFrameProfileThumbnailUrl(
  profile: CatalogueFrameProfileSummary,
): Promise<string | null> {
  if (profile.kind === "builtin" || profile.kind === "cloud") {
    return profile.thumbnailUrl ?? null;
  }

  return getFrameProfileThumbnailUrl(profile.id);
}
