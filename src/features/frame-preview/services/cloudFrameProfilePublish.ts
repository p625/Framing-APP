import { getSupabaseClientForPublish } from "@/src/lib/supabase/cloudPublish";
import type { SerializableFrameProfile } from "../framing.types";
import { getCalibrationOrDefault } from "../utils/frameCalibration";
import {
  clearCloudFrameProfileCache,
  logCloudProfileDebug,
  refreshPublishedCloudFrameProfiles,
  verifyPublishedFrameProfileRow,
  type CloudFrameProfileRow,
} from "./cloudFrameProfiles";

export const FRAME_PROFILE_STORAGE_BUCKET = "frame-profile-images";

export interface PublishCloudFrameProfileInput {
  profile: SerializableFrameProfile;
  name: string;
  category: string;
  description?: string | null;
  cloudProfileId?: string | null;
  isFeatured?: boolean;
  customerTag?: string | null;
}

export interface PublishCloudFrameProfileResult {
  id: string;
  sampleImageUrl: string;
  catalogueCount: number;
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
  const calibration = getCalibrationOrDefault(profile.frameCornerCalibration);

  return {
    innerCorner: calibration.innerCorner,
    outerCorner: calibration.outerCorner,
    cornerCropRect: calibration.cornerCropRect,
    horizontalStrip: calibration.horizontalStrip,
    verticalStrip: calibration.verticalStrip,
    sourceCorner: calibration.sourceCorner,
    railSourceMode: calibration.railSourceMode,
    railSourceSide: calibration.railSourceSide,
    repeatMode: calibration.repeatMode,
  };
}

function buildFrameProfileRow(
  profileId: string,
  input: PublishCloudFrameProfileInput,
  sampleImageUrl: string,
): Omit<CloudFrameProfileRow, "created_at" | "updated_at"> {
  const calibration = getCalibrationOrDefault(input.profile.frameCornerCalibration);
  const thumbnailUrl = sampleImageUrl.trim();
  const customerTag = input.customerTag?.trim() || null;

  return {
    id: profileId,
    name: input.name.trim(),
    category: input.category.trim() || "Cloud",
    description: input.description?.trim() || null,
    sample_mode: input.profile.frameSampleMode,
    source_corner: calibration.sourceCorner,
    rail_source_mode: calibration.railSourceMode,
    rail_source_side: calibration.railSourceSide,
    frame_width_cm: input.profile.frameWidthCm,
    texture_scale: input.profile.textureScale,
    fallback_color: input.profile.fallbackColor,
    calibration_json: extractCalibrationJson(input.profile),
    sample_image_url: thumbnailUrl,
    thumbnail_url: thumbnailUrl,
    is_published: true,
    is_featured: input.isFeatured ?? false,
    customer_tag: customerTag,
  };
}

function getSampleObjectPath(profileId: string, fileName: string): string {
  const extension = sanitizeFileExtension(fileName);
  return `${profileId}/sample.${extension}`;
}

async function deleteUploadedSampleImage(objectPath: string): Promise<void> {
  const client = getSupabaseClientForPublish();
  const { error } = await client.storage
    .from(FRAME_PROFILE_STORAGE_BUCKET)
    .remove([objectPath]);

  if (error) {
    logCloudProfileDebug("storage cleanup failed", { objectPath, error: error.message });
  }
}

async function uploadFrameSampleImage(
  profileId: string,
  profile: SerializableFrameProfile,
): Promise<{ publicUrl: string; objectPath: string }> {
  const client = getSupabaseClientForPublish();
  const objectPath = getSampleObjectPath(profileId, profile.frameImage.name);

  logCloudProfileDebug("storage upload start", { objectPath, profileId });

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
    await deleteUploadedSampleImage(objectPath);
    throw new Error("Image upload succeeded but public URL is missing.");
  }

  logCloudProfileDebug("storage upload complete", {
    objectPath,
    publicUrl: data.publicUrl,
  });

  return {
    publicUrl: data.publicUrl,
    objectPath,
  };
}

async function upsertFrameProfileRow(
  row: Omit<CloudFrameProfileRow, "created_at" | "updated_at">,
): Promise<void> {
  const client = getSupabaseClientForPublish();

  logCloudProfileDebug("upsert payload", row);

  const { error } = await client.from("frame_profiles").upsert(row, { onConflict: "id" });

  if (error) {
    logCloudProfileDebug("upsert error", { message: error.message, details: error });
    throw new Error(`Failed to save cloud profile: ${error.message}`);
  }

  logCloudProfileDebug("upsert complete", { id: row.id });
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
  let uploadedObjectPath: string | null = null;
  let dbSaved = false;

  try {
    const { publicUrl, objectPath } = await uploadFrameSampleImage(profileId, input.profile);
    uploadedObjectPath = objectPath;

    const row = buildFrameProfileRow(profileId, input, publicUrl);
    await upsertFrameProfileRow(row);
    dbSaved = true;

    const verified = await verifyPublishedFrameProfileRow(profileId);
    clearCloudFrameProfileCache();

    const catalogue = await refreshPublishedCloudFrameProfiles();
    const inCatalogue = catalogue.profiles.some((profile) => profile.id === profileId);

    if (catalogue.error) {
      throw new Error(
        `Profile saved but catalogue refresh failed: ${catalogue.error}`,
      );
    }

    if (!inCatalogue) {
      throw new Error(
        "Profile saved but does not appear in the published catalogue. " +
          "Confirm is_published=true and that anon SELECT policy allows published rows.",
      );
    }

    return {
      id: verified.id,
      sampleImageUrl: verified.sample_image_url,
      catalogueCount: catalogue.profiles.length,
    };
  } catch (error) {
    if (uploadedObjectPath && !dbSaved) {
      await deleteUploadedSampleImage(uploadedObjectPath);
    }

    throw error instanceof Error
      ? error
      : new Error("Failed to publish profile to cloud.");
  }
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
  await refreshPublishedCloudFrameProfiles();
}
