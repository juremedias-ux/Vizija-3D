#!/usr/bin/env node
/**
 * Upravljanje prijav zanimanja iz ukazne vrstice (brez javnega vmesnika).
 *
 *   npm run prijave -- povzetek                      število prijav in skupna količina po izdelkih
 *   npm run prijave -- izvoz > prijave.csv           vse prijave v obliki CSV
 *   npm run prijave -- izbrisi ime@domena.si         izbriše vse prijave za naslov (umik privolitve, izbris)
 *   npm run prijave -- izbrisi-izdelek <id>          izbriše prijave za izdelek (po poslanem obvestilu)
 *   npm run prijave -- pocisti                       izbriše prijave, starejše od roka hrambe (24 mesecev)
 *
 * Baza: DATABASE_URL (PostgreSQL/Supabase) ali, če ni nastavljen,
 * DATABASE_PATH oziroma privzeto data/vizija3d.sqlite.
 */
import { existsSync } from "node:fs";
import path from "node:path";

const RETENTION_MONTHS = 24;
const COLUMNS = [
  "id",
  "product_id",
  "email",
  "quantity",
  "status",
  "consent_at",
  "consent_text_version",
  "created_at",
  "updated_at",
];

const [command, argument] = process.argv.slice(2);

function fail(message) {
  console.error(message);
  process.exit(1);
}

/** Enoten vmesnik za SQLite in PostgreSQL; poizvedbe uporabljajo $1, $2 … */
async function openStore() {
  const url = process.env.DATABASE_URL?.trim();
  if (url) {
    const { default: postgres } = await import("postgres");
    const local = /@(localhost|127\.0\.0\.1)[:/]/.test(url);
    const sql = postgres(url, {
      prepare: false,
      max: 1,
      onnotice: false,
      ...(/[?&]sslmode=/.test(url) || local ? {} : { ssl: "require" }),
    });
    const exists =
      await sql`select to_regclass('public.interest_submissions') as t`;
    if (!exists[0]?.t) {
      await sql.end();
      fail("V bazi še ni tabele s prijavami.");
    }
    return {
      label: "PostgreSQL",
      all: (text, params = []) => sql.unsafe(text, params),
      run: async (text, params = []) => (await sql.unsafe(text, params)).count,
      close: () => sql.end(),
    };
  }

  const dbPath = path.resolve(
    process.cwd(),
    process.env.DATABASE_PATH?.trim() || "data/vizija3d.sqlite",
  );
  if (!existsSync(dbPath)) fail(`Baza ne obstaja: ${dbPath}`);
  const { DatabaseSync } = await import("node:sqlite");
  const db = new DatabaseSync(dbPath);
  const toSqlite = (text) => text.replace(/\$\d+/g, "?");
  return {
    label: `SQLite (${dbPath})`,
    all: async (text, params = []) => db.prepare(toSqlite(text)).all(...params),
    run: async (text, params = []) =>
      Number(db.prepare(toSqlite(text)).run(...params).changes),
    close: async () => db.close(),
  };
}

function csvCell(value) {
  let text = value instanceof Date ? value.toISOString() : String(value ?? "");
  // Prepreči, da bi preglednica vrednost razumela kot formulo.
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

const store = await openStore();

try {
  switch (command) {
    case "povzetek": {
      const rows = await store.all(
        `SELECT product_id, COUNT(*) AS prijave, SUM(quantity) AS kolicina
         FROM interest_submissions WHERE status = 'active'
         GROUP BY product_id ORDER BY product_id`,
      );
      console.error(`Baza: ${store.label}`);
      if (rows.length === 0) console.log("Ni aktivnih prijav.");
      else
        console.table(
          rows.map((r) => ({
            izdelek: r.product_id,
            prijave: Number(r.prijave),
            kolicina: Number(r.kolicina),
          })),
        );
      break;
    }
    case "izvoz": {
      const rows = await store.all(
        `SELECT ${COLUMNS.join(", ")} FROM interest_submissions ORDER BY created_at`,
      );
      console.log(COLUMNS.join(","));
      for (const row of rows) {
        console.log(COLUMNS.map((c) => csvCell(row[c])).join(","));
      }
      break;
    }
    case "izbrisi": {
      const email = argument?.trim().toLowerCase();
      if (!email || !email.includes("@")) {
        fail(
          "Navedi e-poštni naslov: npm run prijave -- izbrisi ime@domena.si",
        );
      }
      const count = await store.run(
        "DELETE FROM interest_submissions WHERE email = $1",
        [email],
      );
      console.log(`Izbrisanih prijav: ${count}`);
      break;
    }
    case "izbrisi-izdelek": {
      const productId = argument?.trim();
      if (!productId) {
        fail(
          "Navedi id izdelka: npm run prijave -- izbrisi-izdelek drzalo-za-metlo",
        );
      }
      const count = await store.run(
        "DELETE FROM interest_submissions WHERE product_id = $1",
        [productId],
      );
      console.log(`Izbrisanih prijav za ${productId}: ${count}`);
      break;
    }
    case "pocisti": {
      const cutoff = new Date();
      cutoff.setMonth(cutoff.getMonth() - RETENTION_MONTHS);
      const count = await store.run(
        "DELETE FROM interest_submissions WHERE updated_at < $1",
        [cutoff.toISOString()],
      );
      console.log(
        `Izbrisanih prijav, starejših od ${RETENTION_MONTHS} mesecev: ${count}`,
      );
      break;
    }
    default:
      fail(
        "Uporaba: npm run prijave -- povzetek | izvoz | izbrisi <e-pošta> | izbrisi-izdelek <id> | pocisti",
      );
  }
} finally {
  await store.close();
}
