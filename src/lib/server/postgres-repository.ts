import { randomUUID } from "node:crypto";

import postgres, { type Sql } from "postgres";

import type { InterestRepository } from "./interest-repository";

/**
 * Shramba prijav v bazi PostgreSQL (Supabase).
 *
 * Povezavo nastavi spremenljivka okolja DATABASE_URL. Na Vercelu uporabi
 * povezavo prek Supabase poolerja v načinu »Transaction« (vrata 6543).
 * Tabela se ob prvi uporabi ustvari samodejno (glej tudi supabase/schema.sql).
 */

/** Stavki za ustvarjanje sheme; enaki so v supabase/schema.sql. */
export const POSTGRES_SCHEMA_STATEMENTS = [
  `create table if not exists public.interest_submissions (
     id uuid primary key,
     product_id text not null,
     email text not null,
     quantity integer not null check (quantity between 1 and 99),
     status text not null default 'active'
       check (status in ('active', 'notified', 'withdrawn')),
     consent_at timestamptz not null,
     consent_text_version text not null,
     created_at timestamptz not null,
     updated_at timestamptz not null,
     unique (product_id, email)
   )`,
  `create index if not exists interest_submissions_email_idx
     on public.interest_submissions (email)`,
  // Brez pravil RLS do tabele ni dostopa prek javnega API-ja Supabase;
  // strežnik dostopa neposredno prek povezave DATABASE_URL.
  `alter table public.interest_submissions enable row level security`,
];

const SCHEMA_LOCK_ID = 72_450_131;

function isLocalHost(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return host === "localhost" || host === "127.0.0.1" || host === "::1";
  } catch {
    return false;
  }
}

export function createPostgresClient(url: string): Sql {
  const hasSslMode = /[?&]sslmode=/.test(url);
  return postgres(url, {
    // Pooler v načinu »Transaction« ne podpira poimenovanih pripravljenih stavkov.
    prepare: false,
    max: 1,
    max_pipeline: 1,
    idle_timeout: 20,
    connect_timeout: 10,
    query_timeout: 10,
    onnotice: false,
    ...(hasSslMode || isLocalHost(url) ? {} : { ssl: "require" as const }),
  });
}

export async function ensurePostgresSchema(sql: Sql): Promise<void> {
  await sql.begin(async (tx) => {
    await tx`select pg_advisory_xact_lock(${SCHEMA_LOCK_ID})`;
    for (const statement of POSTGRES_SCHEMA_STATEMENTS) {
      await tx.unsafe(statement);
    }
  });
}

export function createPostgresInterestRepository(sql: Sql): InterestRepository {
  let schemaReady: Promise<void> | null = null;

  return {
    async save(input) {
      schemaReady ??= ensurePostgresSchema(sql).catch((error: unknown) => {
        schemaReady = null;
        throw error;
      });
      await schemaReady;

      const newId = randomUUID();
      const timestamp = input.now.toISOString();
      const rows = await sql<{ id: string }[]>`
        insert into public.interest_submissions (
          id, product_id, email, quantity, status,
          consent_at, consent_text_version, created_at, updated_at
        ) values (
          ${newId}, ${input.productId}, ${input.email}, ${input.quantity}, 'active',
          ${timestamp}, ${input.consentTextVersion}, ${timestamp}, ${timestamp}
        )
        on conflict (product_id, email) do update set
          quantity = excluded.quantity,
          status = 'active',
          consent_at = excluded.consent_at,
          consent_text_version = excluded.consent_text_version,
          updated_at = excluded.updated_at
        returning id::text as id
      `;
      const row = rows[0];
      if (!row) throw new Error("Prijava ni bila shranjena.");
      return { id: row.id, updated: row.id !== newId };
    },
  };
}
