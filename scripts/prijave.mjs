#!/usr/bin/env node
/**
 * Upravljanje prijav zanimanja iz ukazne vrstice (brez javnega vmesnika).
 *
 *   npm run prijave -- povzetek          število prijav in skupna količina po izdelkih
 *   npm run prijave -- izvoz > prijave.csv  vse prijave v obliki CSV
 *   npm run prijave -- izbrisi ime@domena.si  izbriše vse prijave za naslov (zahteva za izbris)
 *
 * Baza: spremenljivka DATABASE_PATH ali privzeto data/vizija3d.sqlite.
 */
import { existsSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const dbPath = path.resolve(
  process.cwd(),
  process.env.DATABASE_PATH?.trim() || "data/vizija3d.sqlite",
);
const [command, argument] = process.argv.slice(2);

function fail(message) {
  console.error(message);
  process.exit(1);
}

if (!existsSync(dbPath)) fail(`Baza ne obstaja: ${dbPath}`);

const db = new DatabaseSync(dbPath);

function csvCell(value) {
  let text = String(value ?? "");
  // Prepreči, da bi preglednica vrednost razumela kot formulo.
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

switch (command) {
  case "povzetek": {
    const rows = db
      .prepare(
        `SELECT product_id, COUNT(*) AS prijave, SUM(quantity) AS kolicina
         FROM interest_submissions WHERE status = 'active'
         GROUP BY product_id ORDER BY product_id`,
      )
      .all();
    if (rows.length === 0) console.log("Ni aktivnih prijav.");
    else console.table(rows);
    break;
  }
  case "izvoz": {
    const columns = [
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
    const rows = db
      .prepare(
        `SELECT ${columns.join(", ")} FROM interest_submissions ORDER BY created_at`,
      )
      .all();
    console.log(columns.join(","));
    for (const row of rows)
      console.log(columns.map((c) => csvCell(row[c])).join(","));
    break;
  }
  case "izbrisi": {
    const email = argument?.trim().toLowerCase();
    if (!email || !email.includes("@"))
      fail("Navedi e-poštni naslov: npm run prijave -- izbrisi ime@domena.si");
    const result = db
      .prepare("DELETE FROM interest_submissions WHERE email = ?")
      .run(email);
    console.log(`Izbrisanih prijav: ${result.changes}`);
    break;
  }
  default:
    fail("Uporaba: npm run prijave -- povzetek | izvoz | izbrisi <e-pošta>");
}

db.close();
