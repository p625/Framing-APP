import type { SavedProjectSummary, SerializableProject } from "../framing.types";
import { getDb, type ProjectRecord } from "./db";

export async function listSavedProjects(): Promise<SavedProjectSummary[]> {
  const db = await getDb();
  const records = await db.getAllFromIndex("projects", "bySavedAt");
  return records
    .sort((a, b) => b.savedAt - a.savedAt)
    .map((record) => ({
      id: record.id,
      name: record.name,
      savedAt: record.savedAt,
    }));
}

async function findProjectByName(name: string): Promise<ProjectRecord | undefined> {
  const db = await getDb();
  const records = await db.getAll("projects");
  const normalized = name.trim().toLowerCase();
  return records.find((record) => record.name.trim().toLowerCase() === normalized);
}

export async function saveProject(
  name: string,
  data: SerializableProject,
): Promise<string> {
  const trimmedName = name.trim();
  if (!trimmedName) {
    throw new Error("Project name is required");
  }

  const existing = await findProjectByName(trimmedName);
  const record: ProjectRecord = {
    id: existing?.id ?? crypto.randomUUID(),
    name: trimmedName,
    savedAt: Date.now(),
    data,
  };

  const db = await getDb();
  await db.put("projects", record);
  return record.id;
}

export async function loadProject(
  id: string,
): Promise<{ name: string; data: SerializableProject } | null> {
  const db = await getDb();
  const record = await db.get("projects", id);
  if (!record) {
    return null;
  }
  return { name: record.name, data: record.data };
}

export async function deleteProject(id: string): Promise<void> {
  const db = await getDb();
  await db.delete("projects", id);
}

export async function renameProject(id: string, name: string): Promise<void> {
  const trimmedName = name.trim();
  if (!trimmedName) {
    throw new Error("Project name is required");
  }

  const db = await getDb();
  const record = await db.get("projects", id);
  if (!record) {
    throw new Error("Project not found");
  }

  await db.put("projects", {
    ...record,
    name: trimmedName,
    savedAt: Date.now(),
  });
}

export async function getProjectThumbnailUrl(id: string): Promise<string | null> {
  const record = await loadProject(id);
  if (!record) {
    return null;
  }

  const blob =
    record.data.croppedArtwork ??
    record.data.correctedArtwork ??
    record.data.artworkOriginal?.blob ??
    null;

  if (!blob) {
    return null;
  }

  return URL.createObjectURL(blob);
}
