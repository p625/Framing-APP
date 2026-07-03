import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type {
  SerializableFrameProfile,
  SerializableProject,
  StoredImagePayload,
} from "../framing.types";

const DB_NAME = "framing-app";
const DB_VERSION = 2;

export interface ProjectRecord {
  id: string;
  name: string;
  savedAt: number;
  data: SerializableProject;
}

export interface FrameProfileRecord {
  id: string;
  name: string;
  savedAt: number;
  data: SerializableFrameProfile;
}

export interface EnvironmentRecord {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  image: StoredImagePayload;
  thumbnail: StoredImagePayload;
}

interface FramingDBSchema extends DBSchema {
  projects: {
    key: string;
    value: ProjectRecord;
    indexes: { bySavedAt: number };
  };
  frameProfiles: {
    key: string;
    value: FrameProfileRecord;
    indexes: { bySavedAt: number };
  };
  environments: {
    key: string;
    value: EnvironmentRecord;
    indexes: { byUpdatedAt: number };
  };
}

let dbPromise: Promise<IDBPDatabase<FramingDBSchema>> | null = null;

export function getDb(): Promise<IDBPDatabase<FramingDBSchema>> {
  if (!dbPromise) {
    dbPromise = openDB<FramingDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(database) {
        if (!database.objectStoreNames.contains("projects")) {
          const store = database.createObjectStore("projects", { keyPath: "id" });
          store.createIndex("bySavedAt", "savedAt");
        }
        if (!database.objectStoreNames.contains("frameProfiles")) {
          const store = database.createObjectStore("frameProfiles", {
            keyPath: "id",
          });
          store.createIndex("bySavedAt", "savedAt");
        }
        if (!database.objectStoreNames.contains("environments")) {
          const store = database.createObjectStore("environments", {
            keyPath: "id",
          });
          store.createIndex("byUpdatedAt", "updatedAt");
        }
      },
    });
  }
  return dbPromise;
}
