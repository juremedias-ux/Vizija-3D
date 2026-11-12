import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";

import type { InterestRepository } from "./interest-repository";

/** Shramba prijav v datoteki SQLite (lokalni razvoj ali strežnik s trajnim diskom). */
export function createSqliteInterestRepository(
  getDb: () => DatabaseSync,
): InterestRepository {
  return {
    async save(input) {
      const db = getDb();
      const newId = randomUUID();
      const timestamp = input.now.toISOString();
      const row = db
        .prepare(
          `INSERT INTO interest_submissions (
             id, product_id, email, quantity, status,
             consent_at, consent_text_version, created_at, updated_at
           ) VALUES (?, ?, ?, ?, 'active', ?, ?, ?, ?)
           ON CONFLICT (product_id, email) DO UPDATE SET
             quantity = excluded.quantity,
             status = 'active',
             consent_at = excluded.consent_at,
             consent_text_version = excluded.consent_text_version,
             updated_at = excluded.updated_at
           RETURNING id`,
        )
        .get(
          newId,
          input.productId,
          input.email,
          input.quantity,
          timestamp,
          input.consentTextVersion,
          timestamp,
          timestamp,
        ) as { id: string } | undefined;

      if (!row) {
        throw new Error("Prijava ni bila shranjena.");
      }
      return { id: row.id, updated: row.id !== newId };
    },
  };
}
