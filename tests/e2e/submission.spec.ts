import { expect, test } from "@playwright/test";

import { fillForm, productCard, readSubmissions, uniqueEmail } from "./helpers";

test("uspešna oddaja: stanje pošiljanja, potrditev in trajni zapis", async ({
  page,
}) => {
  await page.goto("/");
  const email = uniqueEmail("uspeh");
  const card = productCard(page, "Držalo za metlo");

  // Upočasnjen odgovor, da je stanje »Pošiljanje …« vidno.
  await page.route("**/api/zanimanje", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    await route.continue();
  });

  await fillForm(card, { quantity: "4", email });
  await card.getByRole("button", { name: "Oddaj naročilo" }).click();
  const submitting = card.getByRole("button", { name: "Pošiljanje …" });
  await expect(submitting).toBeVisible();
  await expect(submitting).toHaveAttribute("aria-disabled", "true");

  const confirmation = card
    .getByRole("status")
    .filter({ hasText: "Hvala za zanimanje!" });
  await expect(confirmation).toBeVisible();
  await expect(confirmation).toContainText(
    `Hvala za zanimanje! Obvestili te bomo na ${email}, ko bo izdelek na voljo. To ni potrjeno naročilo in plačilo ni bilo izvedeno.`,
  );
  await expect(confirmation).toContainText(
    "Izdelek je v razvoju. Oddaja pomeni nezavezujočo prijavo zanimanja, brez plačila.",
  );
  await expect(confirmation).toContainText("Držalo za metlo");
  await expect(confirmation.locator("dd").nth(1)).toHaveText("4");
  await expect(confirmation).toBeFocused();
  await expect(
    confirmation.getByRole("link", { name: "Nadaljuj z ogledom izdelkov" }),
  ).toBeVisible();

  const rows = readSubmissions(email);
  expect(rows).toEqual([
    expect.objectContaining({
      product_id: "drzalo-za-metlo",
      email,
      quantity: 4,
      status: "active",
    }),
  ]);

  // E-poštni naslov se v istem obisku ponudi tudi pri drugih izdelkih.
  await expect(
    productCard(page, "Škatlica za metke").getByLabel("E-poštni naslov"),
  ).toHaveValue(email);

  // Naslov se ne zapiše v brskalniško shrambo.
  const stored = await page.evaluate(
    () =>
      JSON.stringify({ ...localStorage }) +
      JSON.stringify({ ...sessionStorage }) +
      document.cookie,
  );
  expect(stored).not.toContain(email);
});

test("več izdelkov z istim naslovom in ponovna oddaja posodobi količino", async ({
  page,
}) => {
  await page.goto("/");
  const email = uniqueEmail("vec");

  const first = productCard(page, "Držalo za metlo");
  await fillForm(first, { quantity: "2", email });
  await first.getByRole("button", { name: "Oddaj naročilo" }).click();
  await expect(first.getByText(/Hvala za zanimanje!/)).toBeVisible();

  const second = productCard(page, "Podloga za zapestje");
  await fillForm(second, { quantity: "1" });
  await second.getByRole("button", { name: "Oddaj naročilo" }).click();
  await expect(second.getByText(/Hvala za zanimanje!/)).toBeVisible();

  // Ponovna oddaja za držalo za metlo z drugo količino.
  await first.getByRole("button", { name: "Spremeni količino" }).click();
  const quantity = first.getByLabel("Količina", { exact: true });
  await expect(quantity).toBeFocused();
  await expect(quantity).toHaveValue("2");
  await quantity.fill("5");
  await first.getByRole("button", { name: "Oddaj naročilo" }).click();
  await expect(
    first.getByText(/smo količino posodobili na zadnjo izbrano/),
  ).toBeVisible();

  const rows = readSubmissions(email);
  expect(rows.map((r) => [r.product_id, r.quantity])).toEqual([
    ["drzalo-za-metlo", 5],
    ["podloga-za-zapestje", 1],
  ]);
});

test("napaka strežnika: brez potrditve, podatki ohranjeni, ponovni poskus uspe", async ({
  page,
}) => {
  await page.goto("/");
  const email = uniqueEmail("napaka");
  const card = productCard(page, "Škatlica za metke");

  await page.route("**/api/zanimanje", (route) =>
    route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({
        ok: false,
        error: "server",
        message:
          "Prijave trenutno ni bilo mogoče shraniti. Poskusi znova čez nekaj trenutkov.",
      }),
    }),
  );

  await fillForm(card, { quantity: "7", email });
  await card.getByRole("button", { name: "Oddaj naročilo" }).click();

  const alert = card.getByRole("alert");
  await expect(alert).toContainText("Zanimanja ni bilo mogoče oddati.");
  await expect(alert).toContainText(
    "Prijave trenutno ni bilo mogoče shraniti.",
  );
  await expect(card.getByText(/Hvala za zanimanje!/)).toHaveCount(0);
  await expect(card.getByLabel("Količina", { exact: true })).toHaveValue("7");
  await expect(card.getByLabel("E-poštni naslov")).toHaveValue(email);
  expect(readSubmissions(email)).toHaveLength(0);

  await page.unroute("**/api/zanimanje");
  await alert.getByRole("button", { name: "Poskusi znova" }).click();
  await expect(card.getByText(/Hvala za zanimanje!/)).toBeVisible();
  expect(readSubmissions(email).map((r) => r.quantity)).toEqual([7]);
});

test("omrežna napaka prikaže sporočilo in ohrani podatke", async ({ page }) => {
  await page.goto("/");
  const email = uniqueEmail("omrezje");
  const card = productCard(page, "Podloga za zapestje");
  await page.route("**/api/zanimanje", (route) => route.abort("failed"));

  await fillForm(card, { quantity: "3", email });
  await card.getByRole("button", { name: "Oddaj naročilo" }).click();
  await expect(card.getByRole("alert")).toContainText(
    "Povezava s strežnikom ni uspela.",
  );
  await expect(card.getByLabel("E-poštni naslov")).toHaveValue(email);
  await expect(
    card.getByRole("button", { name: "Poskusi znova" }),
  ).toBeVisible();
});

test("ponavljajoči se kliki pošljejo samo eno zahtevo", async ({ page }) => {
  await page.goto("/");
  const email = uniqueEmail("dvojni");
  const card = productCard(page, "Škatlica za metke");
  let requests = 0;
  await page.route("**/api/zanimanje", async (route) => {
    requests += 1;
    await new Promise((resolve) => setTimeout(resolve, 800));
    await route.continue();
  });

  await fillForm(card, { email });
  const button = card.getByRole("button", { name: "Oddaj naročilo" });
  await button.click();
  await card
    .getByRole("button", { name: "Pošiljanje …" })
    .click({ force: true });
  await card.getByRole("button", { name: "Pošiljanje …" }).press("Enter");
  await expect(card.getByText(/Hvala za zanimanje!/)).toBeVisible();
  expect(requests).toBe(1);
  expect(readSubmissions(email)).toHaveLength(1);
});
