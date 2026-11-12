import type { InterestRepository } from "./interest-repository";
import {
  createPostgresClient,
  createPostgresInterestRepository,
} from "./postgres-repository";

/**
 * Izbira shrambe prijav:
 *  - DATABASE_URL je nastavljen → PostgreSQL (Supabase),
 *  - na Vercelu brez DATABASE_URL → oddaja vrne napako (datotečni sistem ni trajen),
 *  - sicer → lokalna datoteka SQLite (DATABASE_PATH).
 */

const missingStorage: InterestRepository = {
  async save() {
    throw new Error(
      "Shramba prijav ni nastavljena: na Vercelu nastavi spremenljivko DATABASE_URL.",
    );
  },
};

const sqliteStorage: InterestRepository = {
  async save(input) {
    // node:sqlite se naloži samo, kadar se SQLite dejansko uporablja.
    const [{ getDatabase }, { createSqliteInterestRepository }] =
      await Promise.all([import("./db"), import("./sqlite-repository")]);
    return createSqliteInterestRepository(getDatabase).save(input);
  },
};

let postgresStorage: { url: string; repository: InterestRepository } | null =
  null;

export function getInterestRepository(): InterestRepository {
  const url = process.env.DATABASE_URL?.trim();
  if (url) {
    if (postgresStorage?.url !== url) {
      postgresStorage = {
        url,
        repository: createPostgresInterestRepository(createPostgresClient(url)),
      };
    }
    return postgresStorage.repository;
  }
  if (process.env.VERCEL) return missingStorage;
  return sqliteStorage;
}
