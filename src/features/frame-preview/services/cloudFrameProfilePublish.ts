import { getSupabaseClientForPublish } from "@/src/lib/supabase/cloudPublish";
import type { SerializableFrameProfile } from "../framing.types";
import {
  clearCloudFrameProfileCache,
  type CloudFrameProfileRow,
} from "./cloudFrameProfiles";

export const FRAME_PROFILE_STORAGE_BUCKET = "frame-profile-images";

export interface PublishCloudFrameProfileInput {
  profile: SerializableFrameProfile;
  name: string;
  category: string;
  description?: string | null;
  cloudProfileId?: string | null;
}

export interface PublishCloudFrameProfileResult {
  id: string;
  sampleImageUrl: string;
}

function sanitizeFileExtension(fileName: string): string {
  const match = fileName.match(/\.([a-zA-Z0-9]+)$/);
  const ext = match?.[1]?.toLowerCase();
  if (ext === "jpg" || ext === "jpeg" || ext === "png" || ext === "webp" || ext === "svg") {
    return ext;
  }
  return "png";
}

function extractCalibrationJson(
  profile: SerializableFrameProfile,
): Record<string, unknown> {
  const calibration = profile.frameCornerCalibration;
  return {
    innerCorner: calibration.innerCorner,
    outerCorner: calibration.outerCorner,
    horizontalStrip: calibration.horizontalStrip,
    verticalStrip: calibration.verticalStrip,
  };
}

function buildFrameProfileRow(
  profileId: string,
  input: PublishCloudFrameProfileInput,
  sampleImageUrl: string,
): Omit<CloudFrameProfileRow, "created_at" | "updated_at"> {
  const calibration = input.profile.frameCornerCalibration;

  return {
    id: profileId,
    name: input.name.trim(),
    category: input.category.trim(),
    description: input.description?.trim() || null,
    sample_mode: input.profile.frameSampleMode,
    source_corner: calibration.sourceCorner,
    rail_source_mode: calibration.railSourceMode,
    rail_source_side: calibration.railSourceSide,
    frame_width_cm: input.profile.frameWidthCm,
    texture_scale: input.profile.textureScale,
    fallback_color: input.profile.fallbackColor,
    calibration_json: extractCalibrationJson(input.profile),
    sample_image_url: sampleImageUrl,
    thumbnail_url: sampleImageUrl,
    is_published: true,
    is_featured: false,
    customer_tag: null,
  };
}

async function uploadFrameSampleImage(
  profileId: string,
  profile: SerializableFrameProfile,
): Promise<string> {
  const client = getSupabaseClientForPublish();
  const extension = sanitizeFileExtension(profile.frameImage.name);
  const objectPath = `${profileId}/sample.${extension}`;

  const { error: uploadError } = await client.storage
    .from(FRAME_PROFILE_STORAGE_BUCKET)
    .upload(objectPath, profile.frameImage.blob, {
      upsert: true,
      contentType: profile.frameImage.type || "image/png",
      cacheControl: "3600",
    });

  if (uploadError) {
    throw new Error(`Image upload failed: ${uploadError.message}`);
  }

  const { data } = client.storage
    .from(FRAME_PROFILE_STORAGE_BUCKET)
    .getPublicUrl(objectPath);

  if (!data.publicUrl) {
    throw new Error("Image upload succeeded but public URL is missing.");
  }

  return data.publicUrl;
}

export async function publishCloudFrameProfile(
  input: PublishCloudFrameProfileInput,
): Promise<PublishCloudFrameProfileResult> {
  const trimmedName = input.name.trim();
  const trimmedCategory = input.category.trim();

  if (!trimmedName) {
    throw new Error("Profile name is required before publishing.");
  }

  if (!trimmedCategory) {
    throw new Error("Category is required before publishing.");
  }

  const profileId = input.cloudProfileId ?? crypto.randomUUID();
  const sampleImageUrl = await uploadFrameSampleImage(profileId, input.profile);
  const row = buildFrameProfileRow(profileId, input, sampleImageUrl);
  const client = getSupabaseClientForPublish();

  const { data, error } = await client
    .from("frame_profiles")
    .upsert(row, { onConflict: "id" })
    .select("id, sample_image_url")
    .single();

  if (error) {
    throw new Error(`Failed to save cloud profile: ${error.message}`);
  }

  clearCloudFrameProfileCache();

  return {
    id: data.id as string,
    sampleImageUrl: data.sample_image_url as string,
  };
}

export async function unpublishCloudFrameProfile(profileId: string): Promise<void> {
  if (!profileId) {
    throw new Error("Cloud profile id is required.");
  }

  const client = getSupabaseClientForPublish();
  const { error } = await client
    .from("frame_profiles")
    .update({ is_published: false })
    .eq("id", profileId);

  if (error) {
    throw new Error(`Failed to unpublish profile: ${error.message}`);
  }

  clearCloudFrameProfileCache();
}
