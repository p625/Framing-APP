import type {
  SavedFrameProfileSummary,
  SerializableFrameProfile,
} from "../framing.types";
import { getDb, type FrameProfileRecord } from "./db";

export async function listSavedFrameProfiles(): Promise<SavedFrameProfileSummary[]> {
  const db = await getDb();
  const records = await db.getAllFromIndex("frameProfiles", "bySavedAt");
  return records
    .sort((a, b) => b.savedAt - a.savedAt)
    .map((record) => ({
      id: record.id,
      name: record.name,
      savedAt: record.savedAt,
    }));
}

async function findProfileByName(
  name: string,
): Promise<FrameProfileRecord | undefined> {
  const db = await getDb();
  const records = await db.getAll("frameProfiles");
  const normalized = name.trim().toLowerCase();
  return records.find((record) => record.name.trim().toLowerCase() === normalized);
}

export async function saveFrameProfile(
  name: string,
  data: SerializableFrameProfile,
): Promise<string> {
  const trimmedName = name.trim();
  if (!trimmedName) {
    throw new Error("Profile name is required");
  }

  const existing = await findProfileByName(trimmedName);
  const record: FrameProfileRecord = {
    id: existing?.id ?? crypto.randomUUID(),
    name: trimmedName,
    savedAt: Date.now(),
    data,
  };

  const db = await getDb();
  await db.put("frameProfiles", record);
  return record.id;
}

export async function loadFrameProfile(
  id: string,
): Promise<{ name: string; data: SerializableFrameProfile } | null> {
  const db = await getDb();
  const record = await db.get("frameProfiles", id);
  if (!record) {
    return null;
  }
  return { name: record.name, data: record.data };
}

export async function deleteFrameProfile(id: string): Promise<void> {
  const db = await getDb();
  await db.delete("frameProfiles", id);
}

export async function renameFrameProfile(id: string, name: string): Promise<void> {
  const trimmedName = name.trim();
  if (!trimmedName) {
    throw new Error("Profile name is required");
  }

  const db = await getDb();
  const record = await db.get("frameProfiles", id);
  if (!record) {
    throw new Error("Profile not found");
  }

  await db.put("frameProfiles", {
    ...record,
    name: trimmedName,
    savedAt: Date.now(),
  });
}

export async function getFrameProfileThumbnailUrl(id: string): Promise<string | null> {
  const record = await loadFrameProfile(id);
  if (!record) {
    return null;
  }

  return URL.createObjectURL(record.data.frameImage.blob);
}
