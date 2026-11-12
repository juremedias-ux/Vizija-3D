import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { CONSENT_TEXT_VERSION } from "@/lib/interest/consent";
import {
  createPostgresClient,
  createPostgresInterestRepository,
} from "@/lib/server/postgres-repository";

/**
 * Testi shrambe v PostgreSQL. Izvedejo se samo, če je nastavljena
 * spremenljivka TEST_DATABASE_URL (testna baza; tabela se izprazni!).
 */
const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)("shramba prijav v PostgreSQL", () => {
  const sql = createPostgresClient(url ?? "postgres://localhost/none");
  const repository = createPostgresInterestRepository(sql);

  const input = (
    patch: Partial<Parameters<typeof repository.save>[0]> = {},
  ) => ({
    productId: "drzalo-za-metlo",
    email: "ana@primer.si",
    quantity: 2,
    consentTextVersion: CONSENT_TEXT_VERSION,
    now: new Date("2026-11-12T10:00:00.000Z"),
    ...patch,
  });

  beforeAll(async () => {
    await sql`drop table if exists public.interest_submissions`;
  });

  beforeEach(async () => {
    await sql`select 1`;
    const exists =
      await sql`select to_regclass('public.interest_submissions') as t`;
    if (exists[0]?.t) await sql`truncate public.interest_submissions`;
  });

  afterAll(async () => {
    await sql.end();
  });

  it("ob prvi uporabi ustvari tabelo z RLS in shrani zapis", async () => {
    const result = await repository.save(input());
    expect(result.updated).toBe(false);
    const rows = await sql`
      select id::text, product_id, email, quantity, status, consent_text_version,
             consent_at, created_at, updated_at
      from public.interest_submissions`;
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      id: result.id,
      product_id: "drzalo-za-metlo",
      email: "ana@primer.si",
      quantity: 2,
      status: "active",
      consent_text_version: CONSENT_TEXT_VERSION,
    });
    expect(new Date(rows[0].created_at).toISOString()).toBe(
      "2026-11-12T10:00:00.000Z",
    );
    const [rls] = await sql`
      select relrowsecurity from pg_class where oid = 'public.interest_submissions'::regclass`;
    expect(rls.relrowsecurity).toBe(true);
  });

  it("ponovna oddaja posodobi količino in ne ustvari novega zapisa", async () => {
    const first = await repository.save(input({ quantity: 5 }));
    const second = await repository.save(
      input({ quantity: 1, now: new Date("2026-11-12T11:00:00.000Z") }),
    );
    expect(second).toEqual({ id: first.id, updated: true });
    const rows =
      await sql`select quantity, created_at, updated_at from public.interest_submissions`;
    expect(rows).toHaveLength(1);
    expect(rows[0].quantity).toBe(1);
    expect(new Date(rows[0].created_at).toISOString()).toBe(
      "2026-11-12T10:00:00.000Z",
    );
    expect(new Date(rows[0].updated_at).toISOString()).toBe(
      "2026-11-12T11:00:00.000Z",
    );
  });

  it("za različne izdelke ustvari ločene zapise", async () => {
    await repository.save(input());
    await repository.save(input({ productId: "podloga-za-zapestje" }));
    const [{ count }] =
      await sql`select count(*)::int as count from public.interest_submissions`;
    expect(count).toBe(2);
  });

  it("zavrne količino zunaj obsega", async () => {
    await expect(repository.save(input({ quantity: 100 }))).rejects.toThrow();
  });
});
