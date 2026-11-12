import { DatabaseSync } from "node:sqlite";

import { type Locator, type Page, expect } from "@playwright/test";

export type SubmissionRow = {
  product_id: string;
  email: string;
  quantity: number;
  status: string;
  consent_text_version: string;
};

export function readSubmissions(email: string): SubmissionRow[] {
  const db = new DatabaseSync(process.env.E2E_DATABASE_PATH!, {
    readOnly: true,
  });
  try {
    return db
      .prepare(
        "SELECT product_id, email, quantity, status, consent_text_version FROM interest_submissions WHERE email = ? ORDER BY product_id",
      )
      .all(email) as SubmissionRow[];
  } finally {
    db.close();
  }
}

export function uniqueEmail(label: string): string {
  return `test-${label}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@primer.si`;
}

export function productCard(page: Page, name: string): Locator {
  return page.locator("article", {
    has: page.getByRole("heading", { level: 3, name, exact: true }),
  });
}

export async function fillForm(
  card: Locator,
  { quantity, email }: { quantity?: string; email?: string },
) {
  // Obrazec je aktiven šele po nalaganju JavaScripta.
  await expect(
    card.getByRole("button", { name: "Oddaj naročilo" }),
  ).toBeEnabled();
  if (quantity !== undefined)
    await card.getByLabel("Količina", { exact: true }).fill(quantity);
  if (email !== undefined) await card.getByLabel("E-poštni naslov").fill(email);
}

export async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
}

/** Počaka, da se na začetni strani naloži JavaScript (obrazci postanejo aktivni). */
export async function waitForHydration(page: Page) {
  await expect(
    page.getByRole("button", { name: "Oddaj naročilo" }).first(),
  ).toBeEnabled();
}
