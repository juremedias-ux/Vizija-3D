import { expect, test } from "@playwright/test";

import {
  fillForm,
  productCard,
  uniqueEmail,
  waitForHydration,
} from "./helpers";

test.describe("katalog", () => {
  test("ima deset mest: tri aktivne kartice in sedem praznih mest", async ({
    page,
  }) => {
    await page.goto("/");
    const catalog = page.locator("#izdelki");
    await expect(catalog.locator("article")).toHaveCount(10);
    await expect(catalog.locator("form")).toHaveCount(3);

    const placeholders = catalog.locator("article", {
      has: page.getByRole("heading", { name: "Nov izdelek prihaja" }),
    });
    await expect(placeholders).toHaveCount(7);
    await expect(placeholders.locator("form, input, button")).toHaveCount(0);
  });

  test("aktivna kartica vsebuje vse zahtevane elemente", async ({ page }) => {
    await page.goto("/");
    const card = productCard(page, "Izdelek 01");
    await expect(
      card.getByRole("button", { name: "Povečaj sliko: Izdelek 01" }),
    ).toBeVisible();
    await expect(card.getByText("V razvoju", { exact: true })).toBeVisible();
    await expect(
      card.getByText("Cena bo objavljena ob začetku prodaje."),
    ).toBeVisible();
    await expect(card.getByLabel("Količina", { exact: true })).toHaveValue("1");
    await expect(card.getByLabel("E-poštni naslov")).toBeVisible();
    const consent = card.getByLabel(
      /Želim prejeti obvestilo, ko bo izbrani izdelek na voljo\./,
    );
    await expect(consent).not.toBeChecked();
    await expect(
      card.getByText(
        "Tvoj e-poštni naslov bomo uporabili za obvestilo o razpoložljivosti izbranega izdelka.",
      ),
    ).toBeVisible();

    // Obvestilo o nezavezujoči oddaji je tik nad gumbom.
    const notice = card.getByText(
      "Izdelek je v razvoju. Oddaja pomeni nezavezujočo prijavo zanimanja, brez plačila.",
    );
    const button = card.getByRole("button", { name: "Oddaj naročilo" });
    await expect(notice).toBeVisible();
    const noticeBox = await notice.boundingBox();
    const buttonBox = await button.boundingBox();
    expect(noticeBox!.y + noticeBox!.height).toBeLessThanOrEqual(buttonBox!.y);
    expect(buttonBox!.y - (noticeBox!.y + noticeBox!.height)).toBeLessThan(24);
  });

  test("povečan prikaz slike: odpiranje, Escape, gumb Zapri, fokus", async ({
    page,
  }) => {
    await page.goto("/");
    await waitForHydration(page);
    const trigger = page.getByRole("button", {
      name: "Povečaj sliko: Izdelek 02",
    });
    await trigger.focus();
    await page.keyboard.press("Enter");

    const dialog = page.getByRole("dialog", { name: "Izdelek 02" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Zapri" })).toBeFocused();
    await expect(dialog.getByRole("img")).toHaveAttribute(
      "alt",
      /Konceptna grafika/,
    );

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();

    await trigger.click();
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Zapri" }).click();
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();

    // Klik ob sliki (na ozadje) zapre prikaz.
    await trigger.click();
    await expect(dialog).toBeVisible();
    await page.mouse.click(5, 5);
    await expect(dialog).toBeHidden();
  });
});

test.describe("izbira količine", () => {
  test("gumba plus in minus ter meje 1–99", async ({ page }) => {
    await page.goto("/");
    const card = productCard(page, "Izdelek 01");
    const input = card.getByLabel("Količina", { exact: true });
    const minus = card.getByRole("button", { name: "Zmanjšaj količino" });
    const plus = card.getByRole("button", { name: "Povečaj količino" });

    await expect(
      card.getByRole("button", { name: "Oddaj naročilo" }),
    ).toBeEnabled();
    await expect(minus).toHaveAttribute("aria-disabled", "true");
    await minus.click({ force: true });
    await expect(input).toHaveValue("1");

    await plus.click();
    await plus.click();
    await expect(input).toHaveValue("3");
    await minus.click();
    await expect(input).toHaveValue("2");

    await input.fill("99");
    await expect(plus).toHaveAttribute("aria-disabled", "true");
    await plus.click({ force: true });
    await expect(input).toHaveValue("99");

    await input.fill("50");
    await input.press("ArrowUp");
    await expect(input).toHaveValue("51");
    await input.press("ArrowDown");
    await input.press("ArrowDown");
    await expect(input).toHaveValue("49");
  });

  for (const value of ["0", "100", "abc", "", "2.5"]) {
    test(`neveljavna količina »${value}« prepreči oddajo`, async ({ page }) => {
      await page.goto("/");
      let requests = 0;
      page.on("request", (req) => {
        if (req.url().endsWith("/api/zanimanje")) requests += 1;
      });
      const card = productCard(page, "Izdelek 01");
      await fillForm(card, { quantity: value, email: uniqueEmail("kolicina") });
      await card.getByRole("button", { name: "Oddaj naročilo" }).click();
      const input = card.getByLabel("Količina", { exact: true });
      await expect(
        card.getByText("Količina mora biti celo število od 1 do 99."),
      ).toBeVisible();
      await expect(input).toHaveAttribute("aria-invalid", "true");
      await expect(input).toBeFocused();
      expect(requests).toBe(0);
    });
  }
});

test.describe("e-pošta in privolitev", () => {
  test("prazna oddaja pokaže napake in ne pošlje zahteve", async ({ page }) => {
    await page.goto("/");
    let requests = 0;
    page.on("request", (req) => {
      if (req.url().endsWith("/api/zanimanje")) requests += 1;
    });
    const card = productCard(page, "Izdelek 01");
    await expect(
      card.getByRole("button", { name: "Oddaj naročilo" }),
    ).toBeEnabled();
    await card.getByRole("button", { name: "Oddaj naročilo" }).click();
    await expect(card.getByText("Vpiši e-poštni naslov.")).toBeVisible();
    await expect(
      card.getByText("Za oddajo potrdi, da želiš prejeti obvestilo."),
    ).toBeVisible();
    await expect(card.getByLabel("E-poštni naslov")).toBeFocused();
    expect(requests).toBe(0);
  });

  test("neveljaven e-poštni naslov", async ({ page }) => {
    await page.goto("/");
    const card = productCard(page, "Izdelek 01");
    await fillForm(card, { email: "ana@primer" });
    await card.getByRole("button", { name: "Oddaj naročilo" }).click();
    const email = card.getByLabel("E-poštni naslov");
    await expect(
      card.getByText(
        "Vpiši veljaven e-poštni naslov, na primer ime@domena.si.",
      ),
    ).toBeVisible();
    await expect(email).toHaveAttribute("aria-invalid", "true");
    await expect(email).toHaveAttribute("aria-describedby", /napaka/);
  });

  test("privolitev je obvezna", async ({ page }) => {
    await page.goto("/");
    const card = productCard(page, "Izdelek 01");
    await fillForm(card, { email: uniqueEmail("privolitev"), consent: false });
    await card.getByRole("button", { name: "Oddaj naročilo" }).click();
    await expect(
      card.getByText("Za oddajo potrdi, da želiš prejeti obvestilo."),
    ).toBeVisible();
    await expect(card.getByLabel(/Želim prejeti obvestilo/)).toBeFocused();
  });
});
