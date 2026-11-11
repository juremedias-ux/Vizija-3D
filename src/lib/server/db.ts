import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

/**
 * Povezava s podatkovno bazo SQLite (vgrajen modul node:sqlite).
 *
 * Pot do datoteke nastavi spremenljivka okolja DATABASE_PATH.
 * Privzeto: ./data/vizija3d.sqlite (mapa data/ ni v sistemu git).
 */

const DEFAULT_DATABASE_PATH = "data/vizija3d.sqlite";
const SCHEMA_VERSION = 1;

export function resolveDatabasePath(): string {
  const configured = process.env.DATABASE_PATH?.trim();
  return path.resolve(
    /* turbopackIgnore: true */ process.cwd(),
    configured || DEFAULT_DATABASE_PATH,
  );
}

export function migrate(db: DatabaseSync): void {
  const row = db.prepare("PRAGMA user_version").get() as
    | { user_version: number }
    | undefined;
  const version = row?.user_version ?? 0;

  if (version < 1) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS interest_submissions (
        id TEXT PRIMARY KEY,
        product_id TEXT NOT NULL,
        email TEXT NOT NULL,
        quantity INTEGER NOT NULL CHECK (quantity BETWEEN 1 AND 99),
        status TEXT NOT NULL DEFAULT 'active'
          CHECK (status IN ('active', 'notified', 'withdrawn')),
        consent_at TEXT NOT NULL,
        consent_text_version TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        UNIQUE (product_id, email)
      );
      CREATE INDEX IF NOT EXISTS idx_interest_submissions_email
        ON interest_submissions (email);
      PRAGMA user_version = ${SCHEMA_VERSION};
    `);
  }
}

export function openDatabase(filePath: string): DatabaseSync {
  if (filePath !== ":memory:") {
    mkdirSync(path.dirname(filePath), { recursive: true });
  }
  const db = new DatabaseSync(filePath);
  db.exec("PRAGMA busy_timeout = 5000;");
  if (filePath !== ":memory:") {
    db.exec("PRAGMA journal_mode = WAL;");
  }
  migrate(db);
  return db;
}

const globalForDb = globalThis as unknown as {
  __vizijaDb?: { path: string; db: DatabaseSync };
};

/** Ena povezava na proces (tudi pri ponovnem nalaganju modulov v razvoju). */
export function getDatabase(): DatabaseSync {
  const filePath = resolveDatabasePath();
  const cached = globalForDb.__vizijaDb;
  if (cached && cached.path === filePath) return cached.db;
  const db = openDatabase(filePath);
  globalForDb.__vizijaDb = { path: filePath, db };
  return db;
}
