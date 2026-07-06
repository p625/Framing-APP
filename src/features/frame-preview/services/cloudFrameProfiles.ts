import { getSupabaseClient, isSupabaseConfigured } from "@/src/lib/supabase/client";
import {
  SERIALIZABLE_FRAME_PROFILE_VERSION,
  type FrameCornerCalibration,
  type FrameSampleMode,
  type RailSourceMode,
  type RailSourceSide,
  type SerializableFrameProfile,
  type SourceCornerSetting,
} from "../framing.types";
import { getCalibrationOrDefault } from "../utils/frameCalibration";
import { blobFromUrl } from "../storage/blobUtils";

export interface CloudFrameProfileRow {
  id: string;
  name: string;
  category: string;
  description: string | null;
  sample_mode: string;
  source_corner: string;
  rail_source_mode: string;
  rail_source_side: string;
  frame_width_cm: number;
  texture_scale: number;
  fallback_color: string;
  calibration_json: Record<string, unknown> | null;
  sample_image_url: string;
  thumbnail_url: string;
  is_published: boolean;
  is_featured: boolean;
  customer_tag: string | null;
  created_at: string;
  updated_at: string;
}

export interface CloudFrameProfileSummary {
  id: string;
  name: string;
  category: string;
  thumbnailUrl: string;
  isFeatured: boolean;
  isPublished: boolean;
}

export interface FetchPublishedCloudProfilesResult {
  profiles: CloudFrameProfileSummary[];
  error: string | null;
}

const cloudProfileCache = new Map<string, CloudFrameProfileRow>();

const FRAME_PROFILE_COLUMNS =
  "id, name, category, description, sample_mode, source_corner, rail_source_mode, rail_source_side, frame_width_cm, texture_scale, fallback_color, calibration_json, sample_image_url, thumbnail_url, is_published, is_featured, customer_tag, created_at, updated_at";

function isFrameSampleMode(value: string): value is FrameSampleMode {
  return value === "corner" || value === "texture";
}

function isSourceCornerSetting(value: string): value is SourceCornerSetting {
  return (
    value === "auto" ||
    value === "top-left" ||
    value === "top-right" ||
    value === "bottom-right" ||
    value === "bottom-left"
  );
}

function isRailSourceMode(value: string): value is RailSourceMode {
  return (
    value === "separate" || value === "horizontal-all" || value === "vertical-all"
  );
}

function isRailSourceSide(value: string): value is RailSourceSide {
  return value === "top" || value === "right" || value === "bottom" || value === "left";
}

function parseCalibrationJson(
  calibrationJson: Record<string, unknown> | null,
): Partial<FrameCornerCalibration> {
  if (!calibrationJson) {
    return {};
  }

  return calibrationJson as Partial<FrameCornerCalibration>;
}

export function mapCloudRowToFrameCornerCalibration(
  row: CloudFrameProfileRow,
): FrameCornerCalibration {
  const fromJson = parseCalibrationJson(row.calibration_json);
  const base = getCalibrationOrDefault(null);

  return getCalibrationOrDefault({
    innerCorner: fromJson.innerCorner ?? base.innerCorner,
    outerCorner: fromJson.outerCorner ?? base.outerCorner,
    cornerCropRect: fromJson.cornerCropRect ?? base.cornerCropRect,
    horizontalStrip: fromJson.horizontalStrip ?? base.horizontalStrip,
    verticalStrip: fromJson.verticalStrip ?? base.verticalStrip,
    sourceCorner: isSourceCornerSetting(row.source_corner)
      ? row.source_corner
      : (fromJson.sourceCorner ?? base.sourceCorner),
    railSourceMode: isRailSourceMode(row.rail_source_mode)
      ? row.rail_source_mode
      : (fromJson.railSourceMode ?? base.railSourceMode),
    railSourceSide: isRailSourceSide(row.rail_source_side)
      ? row.rail_source_side
      : (fromJson.railSourceSide ?? base.railSourceSide),
  });
}

export function mapCloudRowToSerializable(
  row: CloudFrameProfileRow,
  frameImage: SerializableFrameProfile["frameImage"],
): SerializableFrameProfile {
  if (!isFrameSampleMode(row.sample_mode)) {
    throw new Error(`Unsupported sample_mode "${row.sample_mode}" for profile "${row.name}".`);
  }

  return {
    version: SERIALIZABLE_FRAME_PROFILE_VERSION,
    frameSampleMode: row.sample_mode,
    frameCornerCalibration: mapCloudRowToFrameCornerCalibration(row),
    frameWidthCm: Number(row.frame_width_cm),
    textureScale: Number(row.texture_scale),
    fallbackColor: row.fallback_color,
    frameImage,
  };
}

function rowToSummary(row: CloudFrameProfileRow): CloudFrameProfileSummary {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    thumbnailUrl: row.thumbnail_url,
    isFeatured: row.is_featured,
    isPublished: row.is_published,
  };
}

function cacheRows(rows: CloudFrameProfileRow[]): CloudFrameProfileSummary[] {
  for (const row of rows) {
    cloudProfileCache.set(row.id, row);
  }

  return rows.map(rowToSummary);
}

export function getCachedCloudFrameProfileRow(
  id: string,
): CloudFrameProfileRow | undefined {
  return cloudProfileCache.get(id);
}

export async function fetchPublishedCloudFrameProfiles(): Promise<FetchPublishedCloudProfilesResult> {
  if (!isSupabaseConfigured()) {
    return {
      profiles: [],
      error: null,
    };
  }

  const client = getSupabaseClient();
  if (!client) {
    return {
      profiles: [],
      error: "Cloud catalogue is unavailable (Supabase not configured).",
    };
  }

  const { data, error } = await client
    .from("frame_profiles")
    .select(FRAME_PROFILE_COLUMNS)
    .eq("is_published", true)
    .order("is_featured", { ascending: false })
    .order("name", { ascending: true });

  if (error) {
    return {
      profiles: [],
      error: error.message,
    };
  }

  const rows = (data ?? []) as CloudFrameProfileRow[];
  return {
    profiles: cacheRows(rows),
    error: null,
  };
}

export async function fetchAllCloudFrameProfilesForEditor(): Promise<{
  profiles: CloudFrameProfileSummary[];
  error: string | null;
}> {
  if (!isSupabaseConfigured()) {
    return { profiles: [], error: null };
  }

  const client = getSupabaseClient();
  if (!client) {
    return { profiles: [], error: "Cloud catalogue is unavailable (Supabase not configured)." };
  }

  const { data, error } = await client
    .from("frame_profiles")
    .select(FRAME_PROFILE_COLUMNS)
    .order("is_published", { ascending: false })
    .order("name", { ascending: true });

  if (error) {
    return { profiles: [], error: error.message };
  }

  const rows = (data ?? []) as CloudFrameProfileRow[];
  return {
    profiles: cacheRows(rows),
    error: null,
  };
}

export async function loadCloudFrameProfile(
  id: string,
  options?: { publishedOnly?: boolean },
): Promise<{ name: string; data: SerializableFrameProfile } | null> {
  const publishedOnly = options?.publishedOnly ?? true;
  let row = cloudProfileCache.get(id);

  if (!row && isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (client) {
      let query = client.from("frame_profiles").select(FRAME_PROFILE_COLUMNS).eq("id", id);
      if (publishedOnly) {
        query = query.eq("is_published", true);
      }
      const { data, error } = await query.maybeSingle();

      if (!error && data) {
        row = data as CloudFrameProfileRow;
        cloudProfileCache.set(id, row);
      }
    }
  }

  if (!row) {
    return null;
  }

  if (publishedOnly && !row.is_published) {
    return null;
  }

  try {
    const blob = await blobFromUrl(row.sample_image_url);
    const fileName = row.sample_image_url.split("/").pop() ?? "frame-sample.png";

    return {
      name: row.name,
      data: mapCloudRowToSerializable(row, {
        blob,
        name: fileName,
        type: blob.type || "image/png",
      }),
    };
  } catch {
    return null;
  }
}

export function clearCloudFrameProfileCache(): void {
  cloudProfileCache.clear();
}
