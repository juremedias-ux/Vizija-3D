import type {
  CreationMode,
  MeshSpec,
  ModelSettings,
  ParametricSpec,
  Rotation,
} from "./types";

/**
 * »Moji modeli«: projekti se shranijo samo v tem brskalniku (IndexedDB).
 * Ničesar ne pošiljamo na strežnik; ob brisanju podatkov brskalnika se projekti izbrišejo.
 */

export type ProjectStatus = "osnutek" | "pripravljen" | "potrebuje-popravek";

export type StoredSource =
  | { type: "parametric"; spec: ParametricSpec; rotation: Rotation }
  | { type: "mesh"; spec: MeshSpec; rotation: Rotation };

export interface StoredProject {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  status: ProjectStatus;
  mode: CreationMode;
  prompt: string;
  settings: ModelSettings;
  source: StoredSource;
  /** Sličica (data URL, JPEG). */
  thumbnail: string | null;
}

export type ProjectSummary = Omit<StoredProject, "source">;

const DB_NAME = "vizija3d";
const STORE = "projekti";
const VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB ni na voljo."));
      return;
    }
    const request = indexedDB.open(DB_NAME, VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const request = run(tx.objectStore(STORE));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}

export function saveProject(project: StoredProject): Promise<IDBValidKey> {
  return withStore("readwrite", (store) => store.put(project));
}

export function getProject(id: string): Promise<StoredProject | undefined> {
  return withStore(
    "readonly",
    (store) => store.get(id) as IDBRequest<StoredProject | undefined>,
  );
}

export async function listProjects(): Promise<ProjectSummary[]> {
  const all = await withStore(
    "readonly",
    (store) => store.getAll() as IDBRequest<StoredProject[]>,
  );
  return all
    .map((project) => ({
      id: project.id,
      name: project.name,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      status: project.status,
      mode: project.mode,
      prompt: project.prompt,
      settings: project.settings,
      thumbnail: project.thumbnail,
    }))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function deleteProject(id: string): Promise<undefined> {
  return withStore(
    "readwrite",
    (store) => store.delete(id) as IDBRequest<undefined>,
  );
}

export function newProjectId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto)
    return crypto.randomUUID();
  return `p-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
