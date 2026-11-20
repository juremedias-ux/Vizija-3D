import { readFileSync } from "node:fs";
import path from "node:path";

import { type Page, expect, test } from "@playwright/test";

const FIXTURES = path.join(__dirname, "fixtures");

async function createFromText(page: Page, prompt: string) {
  await page.goto("/studio?nacin=besedilo");
  await page.getByLabel("Opiši predmet").fill(prompt);
  await page.getByRole("button", { name: "Naprej" }).click();
  await expect(
    page.getByRole("heading", { name: "3. Nastavitve" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Ustvari model" }).click();
  await expect(page.getByText("Ustvarjam osnovno obliko …")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "4. Uredi model" }),
  ).toBeVisible({ timeout: 20_000 });
}

test("demo način je jasno označen in API brez ključa ne ustvarja", async ({
  page,
  request,
}) => {
  const info = await (await request.get("/api/3d/ponudnik")).json();
  expect(info.mode).toBe("demo");
  const create = await request.post("/api/3d/naloge", {
    data: { kind: "besedilo", prompt: "posoda" },
  });
  expect(create.status()).toBe(409);
  await page.goto("/studio");
  await expect(page.getByText("Demo način", { exact: true })).toBeVisible();
});

test("iz besedila: predogled, urejanje, preverjanje in prenosi", async ({
  page,
}) => {
  await createFromText(
    page,
    "Minimalistična posoda za ključe, 12 x 8 x 3 cm, za 3D tisk",
  );
  await expect(page.getByRole("img", { name: /3D predogled/ })).toBeVisible();
  await expect(page.getByLabel("Širina (cm)")).toHaveValue("12");

  // urejanje: luknja in nova širina (sorazmerno)
  await page.getByRole("checkbox", { name: /Luknja v dnu/ }).check();
  await page.getByLabel("Širina (cm)").fill("15");
  await page.getByLabel("Širina (cm)").press("Enter");
  await expect(page.getByLabel("Globina (cm)")).toHaveValue("10");
  const history = page.getByRole("region", { name: "Zgodovina sprememb" });
  await expect(history.getByText("Spremenjene mere")).toBeVisible();
  await expect(history.getByText("Dodana luknja")).toBeVisible();

  await page.getByRole("button", { name: "Naprej: Pripravi za tisk" }).click();
  await expect(page.getByText("Model je pripravljen za tisk")).toBeVisible({
    timeout: 20_000,
  });
  await expect(
    page.getByText(
      "Pred tiskom preveri dimenzije, debelino sten in geometrijo modela.",
    ),
  ).toBeVisible();
  await expect(page.getByText("15 × 10 × 3,8 cm")).toBeVisible();

  const [stl] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Prenesi STL" }).click(),
  ]);
  expect(stl.suggestedFilename()).toBe("minimalisticna-posoda-za-kljuce.stl");
  const stlData = readFileSync((await stl.path())!);
  const triangles = stlData.readUInt32LE(80);
  expect(stlData.length).toBe(84 + triangles * 50);

  const [glb] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Prenesi GLB" }).click(),
  ]);
  const glbData = readFileSync((await glb.path())!);
  expect(glbData.subarray(0, 4).toString("ascii")).toBe("glTF");

  const [zip] = await Promise.all([
    page.waitForEvent("download"),
    page
      .getByRole("button", { name: "Pripravi datoteko za pošiljanje" })
      .click(),
  ]);
  expect(zip.suggestedFilename()).toBe(
    "minimalisticna-posoda-za-kljuce-za-tisk.zip",
  );
  const zipData = readFileSync((await zip.path())!);
  expect(zipData.readUInt32LE(0)).toBe(0x04034b50);
  const text = zipData.toString("latin1");
  expect(text).toContain("specifikacija.txt");
  expect(text).toContain("minimalisticna-posoda-za-kljuce.stl");
  expect(text).toContain("minimalisticna-posoda-za-kljuce.glb");
  await expect(page.getByText(/Paket je pripravljen/)).toBeVisible();
});

test("izboljšaj opis predlaga dodatke", async ({ page }) => {
  await page.goto("/studio?nacin=besedilo");
  await page.getByLabel("Opiši predmet").fill("Posoda");
  await page.getByRole("button", { name: "Izboljšaj opis" }).click();
  await expect(page.getByText("Predlogi za boljši opis")).toBeVisible();
  await page.getByRole("button", { name: "Uporabi izboljšan opis" }).click();
  await expect(page.getByLabel("Opiši predmet")).toHaveValue(
    /^Posoda, velikost približno/,
  );
});

test("prepovedan opis je zavrnjen", async ({ page }) => {
  await page.goto("/studio?nacin=besedilo");
  await page.getByLabel("Opiši predmet").fill("pištola za igro");
  await page.getByRole("button", { name: "Naprej" }).click();
  await expect(page.getByText(/Tega ne moremo ustvariti/)).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "3. Nastavitve" }),
  ).toHaveCount(0);
});

test("iz slike: relief, potrebna je potrditev pravic", async ({ page }) => {
  await page.goto("/studio?nacin=slika");
  await page
    .locator('input[type="file"]')
    .setInputFiles(path.join(FIXTURES, "skica.png"));
  await expect(
    page.getByRole("img", { name: /Naložena slika 1/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Naprej" }).click();
  await expect(
    page.getByText("Potrdi, da imaš pravico uporabiti naložene slike."),
  ).toBeVisible();
  await page
    .getByRole("checkbox", { name: /Potrjujem, da imam pravico/ })
    .check();
  await page.getByRole("button", { name: "Naprej" }).click();
  await page.getByRole("button", { name: "Ustvari model" }).click();
  await expect(
    page.getByRole("heading", { name: "4. Uredi model" }),
  ).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText(/iz slike smo naredili relief/)).toBeVisible();
});

test("uredi obstoječi model: zazna luknjo in jo popravi", async ({ page }) => {
  await page.goto("/studio?nacin=model");
  await page
    .locator('input[type="file"]')
    .setInputFiles(path.join(FIXTURES, "odprta-kocka.stl"));
  await expect(
    page.getByText("Izbrana datoteka: odprta-kocka.stl"),
  ).toBeVisible();
  await page
    .getByRole("checkbox", { name: /Potrjujem, da imam pravico/ })
    .check();
  await page.getByRole("button", { name: "Naprej" }).click();
  await page.getByRole("button", { name: "Pripravi predogled" }).click();
  await expect(
    page.getByRole("heading", { name: "4. Uredi model" }),
  ).toBeVisible({ timeout: 20_000 });
  await expect(
    page.getByText(/tega v tej različici ni mogoče urejati/).first(),
  ).toBeVisible();
  await page.getByRole("button", { name: "Naprej: Pripravi za tisk" }).click();
  await expect(page.getByText("Površina ima luknje")).toBeVisible({
    timeout: 20_000,
  });
  await page.getByRole("button", { name: "Poskusi popraviti model" }).click();
  await expect(
    page.getByText(/Popravek končan: zaprtih lukenj: 1/),
  ).toBeVisible();
  await expect(page.getByText("Model je pripravljen za tisk")).toBeVisible({
    timeout: 20_000,
  });
});

test("napačna datoteka modela prikaže razumljivo napako", async ({ page }) => {
  await page.goto("/studio?nacin=model");
  await page.locator('input[type="file"]').setInputFiles({
    name: "pokvarjen.stl",
    mimeType: "model/stl",
    buffer: Buffer.from("to ni model"),
  });
  await page
    .getByRole("checkbox", { name: /Potrjujem, da imam pravico/ })
    .check();
  await page.getByRole("button", { name: "Naprej" }).click();
  await page.getByRole("button", { name: "Pripravi predogled" }).click();
  await expect(page.getByText("Ustvarjanje ni uspelo")).toBeVisible({
    timeout: 20_000,
  });
});

test("moji modeli: projekt se shrani in nadaljuje", async ({ page }) => {
  await createFromText(page, 'Obesek za ključe z imenom "ŽAN", 5 x 3 x 0,4 cm');
  await expect(
    page.getByText("Shranjeno v Moji modeli (v tem brskalniku)."),
  ).toBeVisible({ timeout: 20_000 });
  await expect(page).toHaveURL(/\/studio\?projekt=/);
  await page.goto("/moji-modeli");
  const card = page.locator("article", {
    has: page.getByRole("heading", { name: "Obesek za ključe z imenom" }),
  });
  await expect(card).toBeVisible();
  await expect(card.getByRole("img")).toBeVisible();
  await card.getByRole("link", { name: "Nadaljuj urejanje" }).click();
  await expect(
    page.getByRole("heading", { name: "4. Uredi model" }),
  ).toBeVisible({ timeout: 20_000 });
  await expect(page.getByLabel("Ime projekta")).toHaveValue(
    "Obesek za ključe z imenom",
  );
  await expect(page.getByLabel("Besedilo napisa")).toHaveValue("ŽAN");
});

test("mobilno: koraki eden za drugim", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/studio");
  await expect(
    page.getByRole("radio", { name: /Ustvari iz besedila/ }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "2. Vnos" })).toHaveCount(0);
  await page.getByRole("radio", { name: /Ustvari iz besedila/ }).click();
  await expect(page.getByRole("heading", { name: "2. Vnos" })).toBeVisible();
  await expect(
    page.getByRole("radio", { name: /Ustvari iz besedila/ }),
  ).toBeHidden();
  await page
    .getByLabel("Opiši predmet")
    .fill("Lonček za sukulente z luknjo za odtok");
  await page.getByRole("button", { name: "Naprej" }).click();
  await page.getByRole("button", { name: "Ustvari model" }).click();
  await expect(
    page.getByRole("heading", { name: "4. Uredi model" }),
  ).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole("img", { name: /3D predogled/ })).toBeVisible();
  await expect(
    page.getByRole("checkbox", { name: /Luknja v dnu/ }),
  ).toBeChecked();
});
