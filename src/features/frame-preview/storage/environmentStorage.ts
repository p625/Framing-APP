import type { SavedEnvironmentSummary } from "../framing.types";
import { createImageThumbnailBlob } from "../utils/createThumbnail";
import { getDb, type EnvironmentRecord } from "./db";
import { storedImageFromFile } from "./blobUtils";

export async function listSavedEnvironments(): Promise<SavedEnvironmentSummary[]> {
  const db = await getDb();
  const records = await db.getAllFromIndex("environments", "byUpdatedAt");
  return records
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .map((record) => ({
      id: record.id,
      name: record.name,
      updatedAt: record.updatedAt,
    }));
}

async function findEnvironmentByName(
  name: string,
): Promise<EnvironmentRecord | undefined> {
  const db = await getDb();
  const records = await db.getAll("environments");
  const normalized = name.trim().toLowerCase();
  return records.find((record) => record.name.trim().toLowerCase() === normalized);
}

export async function saveEnvironment(name: string, file: File): Promise<string> {
  const trimmedName = name.trim();
  if (!trimmedName) {
    throw new Error("Environment name is required");
  }

  const thumbnailBlob = await createImageThumbnailBlob(file);
  const thumbnailFile = new File([thumbnailBlob], `thumb-${file.name}`, {
    type: thumbnailBlob.type || "image/jpeg",
  });

  const existing = await findEnvironmentByName(trimmedName);
  const now = Date.now();
  const record: EnvironmentRecord = {
    id: existing?.id ?? crypto.randomUUID(),
    name: trimmedName,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    image: storedImageFromFile(file),
    thumbnail: storedImageFromFile(thumbnailFile),
  };

  const db = await getDb();
  await db.put("environments", record);
  return record.id;
}

export async function loadEnvironment(
  id: string,
): Promise<{ name: string; imageUrl: string } | null> {
  const db = await getDb();
  const record = await db.get("environments", id);
  if (!record) {
    return null;
  }

  return {
    name: record.name,
    imageUrl: URL.createObjectURL(record.image.blob),
  };
}

export async function deleteEnvironment(id: string): Promise<void> {
  const db = await getDb();
  await db.delete("environments", id);
}

export async function renameEnvironment(id: string, name: string): Promise<void> {
  const trimmedName = name.trim();
  if (!trimmedName) {
    throw new Error("Environment name is required");
  }

  const db = await getDb();
  const record = await db.get("environments", id);
  if (!record) {
    throw new Error("Environment not found");
  }

  await db.put("environments", {
    ...record,
    name: trimmedName,
    updatedAt: Date.now(),
  });
}

export async function getEnvironmentThumbnailUrl(id: string): Promise<string | null> {
  const db = await getDb();
  const record = await db.get("environments", id);
  if (!record) {
    return null;
  }

  return URL.createObjectURL(record.thumbnail.blob);
}
