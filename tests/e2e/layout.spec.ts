import { expect, test } from "@playwright/test";

import { expectNoHorizontalOverflow, waitForHeader } from "./helpers";

const PLATFORM_HEADLINE = "Ustvari svoj 3D model brez znanja 3D oblikovanja.";
const PRODUCTS_HEADLINE = "Tvoj prostor. Pravi izdelki. Na pravem mestu.";

test("domača stran: naslov, jezik, metapodatki in vstopne točke", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "sl");
  await expect(page).toHaveTitle(/Vizija 3D/);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    /3D tisk/,
  );
  const h1 = page.locator("h1");
  await expect(h1).toHaveCount(1);
  expect((await h1.textContent())?.replace(/\s+/g, " ").trim()).toBe(
    PLATFORM_HEADLINE,
  );
  await expect(
    page.getByText(
      "Opiši predmet, naloži sliko ali uredi obstoječi model — in pripravi datoteko za 3D tisk.",
    ),
  ).toBeVisible();
  for (const [label, nacin] of [
    ["Ustvari iz besedila", "besedilo"],
    ["Ustvari iz slike", "slika"],
    ["Uredi obstoječi model", "model"],
  ]) {
    await expect(
      page.getByRole("link", { name: new RegExp(label) }),
    ).toHaveAttribute("href", `/studio?nacin=${nacin}`);
  }
  await expect(
    page.getByRole("link", { name: "Začni brezplačno" }).first(),
  ).toBeVisible();
  for (const useCase of [
    "Darila",
    "Dekoracija",
    "Organizatorji",
    "Popravki",
    "Figure",
    "Personalizirani predmeti",
  ]) {
    await expect(
      page.getByRole("heading", { name: useCase, exact: true }),
    ).toBeVisible();
  }
  await expect(page.locator("#kako-deluje ol > li")).toHaveCount(4);
});

test("stran z izdelki ohrani katalog in uvod", async ({ page }) => {
  await page.goto("/izdelki");
  expect(
    (await page.locator("h1").textContent())?.replace(/\s+/g, " ").trim(),
  ).toBe(PRODUCTS_HEADLINE);
  const hero = page.locator("section").first();
  await hero.getByRole("link", { name: "Oglej si naše izdelke" }).click();
  await expect(page).toHaveURL(/#izdelki$/);
  await expect(page.locator("#izdelki-naslov")).toBeInViewport();
  await page.goto("/izdelki");
  await hero.getByRole("link", { name: "Spoznaj aplikacijo" }).click();
  await expect(page).toHaveURL(/#vizualizacija$/);
});

test("namizna navigacija vodi na vse strani in označi trenutno", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Glavna navigacija" });
  await expect(page.getByRole("button", { name: "Odpri meni" })).toBeHidden();
  for (const [label, path, heading] of [
    ["Studio", "/studio", "Ustvari in pripravi model za 3D tisk"],
    ["Moji modeli", "/moji-modeli", "Tvoji projekti"],
    ["Pomoč", "/pomoc", "3D tisk, razložen preprosto"],
    ["O platformi", "/o-platformi", "Od ideje do datoteke za 3D tisk"],
    ["Izdelki", "/izdelki", PRODUCTS_HEADLINE],
    ["Domov", "/", PLATFORM_HEADLINE],
  ]) {
    await nav.getByRole("link", { name: label, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${path === "/" ? "/$" : path}`));
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(heading);
    await expect(
      nav.getByRole("link", { name: label, exact: true }),
    ).toHaveAttribute("aria-current", "page");
  }
});

test("mobilni meni: odpiranje, Escape, povezave", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await waitForHeader(page);
  const toggle = page.getByRole("button", { name: "Odpri meni" });
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  const mobileNav = page.getByRole("navigation", {
    name: "Mobilna navigacija",
  });
  await expect(mobileNav).toBeHidden();

  await toggle.focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("button", { name: "Zapri meni" }),
  ).toHaveAttribute("aria-expanded", "true");
  await expect(mobileNav).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(mobileNav).toBeHidden();
  await expect(page.getByRole("button", { name: "Odpri meni" })).toBeFocused();

  await page.getByRole("button", { name: "Odpri meni" }).click();
  await mobileNav.getByRole("link", { name: "Pomoč" }).click();
  await expect(page).toHaveURL(/\/pomoc$/);
  await expect(mobileNav).toBeHidden();
});

for (const width of [320, 390, 768, 1024, 1440]) {
  test(`brez vodoravnega prelivanja pri širini ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const path of [
      "/",
      "/studio",
      "/moji-modeli",
      "/pomoc",
      "/o-platformi",
      "/izdelki",
      "/zasebnost",
    ]) {
      await page.goto(path);
      await expectNoHorizontalOverflow(page);
    }
  });
}

test("postavitev kataloga: 1, 2 in 3 stolpci", async ({ page }) => {
  const columns = async () =>
    page.evaluate(() => {
      const items = [...document.querySelectorAll("#izdelki ul")][0].children;
      return new Set(
        [...items].map((el) => Math.round(el.getBoundingClientRect().left)),
      ).size;
    });
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto("/izdelki");
  expect(await columns()).toBe(1);
  await page.setViewportSize({ width: 820, height: 900 });
  expect(await columns()).toBe(2);
  await page.setViewportSize({ width: 1440, height: 900 });
  expect(await columns()).toBe(3);
});

test("preskok na vsebino in viden fokus s tipkovnico", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Preskoči na vsebino" });
  await expect(skip).toBeFocused();
  await expect(skip).toBeVisible();
  await page.keyboard.press("Tab");
  const outline = await page.evaluate(() => {
    const style = getComputedStyle(document.activeElement as HTMLElement);
    return { style: style.outlineStyle, width: style.outlineWidth };
  });
  expect(outline.style).not.toBe("none");
  expect(outline.width).not.toBe("0px");
});

test("zmanjšano gibanje izklopi gladko drsenje", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  expect(
    await page.evaluate(
      () => getComputedStyle(document.documentElement).scrollBehavior,
    ),
  ).toBe("auto");
});

test("noga: opis, leto in povezava na zasebnost", async ({ page }) => {
  await page.goto("/");
  const footer = page.locator("footer");
  await expect(
    footer.getByText(
      "Uporabne ideje za dom in delovni prostor, izdelane s 3D tiskanjem.",
    ),
  ).toBeVisible();
  await expect(footer).toContainText(`© ${new Date().getFullYear()} Vizija 3D`);
  await footer.getByRole("link", { name: "Zasebnost" }).click();
  await expect(page).toHaveURL(/\/zasebnost$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Zasebnost" }),
  ).toBeVisible();
});

test("izdelki: ločitev obstoječih in prihodnjih funkcij", async ({ page }) => {
  await page.goto("/izdelki");
  const today = page.locator("#kako-deluje");
  await expect(
    today.getByText("Do svojih favoritov v treh korakih"),
  ).toBeVisible();
  await expect(
    today.getByText("Brez plačila in brez obveznosti nakupa."),
  ).toBeVisible();
  const future = page.locator("#vizualizacija");
  await expect(future.getByText("Funkcija v pripravi")).toBeVisible();
  await expect(
    future.getByText(
      "Konceptni prikaz prihodnje funkcije — vizualizacija še ni na voljo.",
    ),
  ).toBeVisible();
  await expect(future.locator("form, input, button")).toHaveCount(0);
});

test("pogosta vprašanja se odprejo s tipkovnico", async ({ page }) => {
  await page.goto("/izdelki");
  const summary = page.locator("#vprasanja summary").first();
  await summary.focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByText(/Gumb »Oddaj naročilo« trenutno odda le nezavezujočo/),
  ).toBeVisible();
});

test("pomoč in o platformi", async ({ page }) => {
  await page.goto("/pomoc");
  for (const heading of [
    "Kaj je 3D model?",
    "Kaj so STL, GLB in OBJ?",
    "Zakaj model včasih ni primeren za tisk?",
    "Kako izbrati velikost?",
    "Kako izbrati debelino sten?",
    "Pravila uporabe",
    "Pogosta vprašanja",
  ]) {
    await expect(
      page.getByRole("heading", { level: 2, name: heading }),
    ).toBeVisible();
  }
  await expect(page.locator("#pravila")).toContainText(
    "Nalagaj samo slike in modele",
  );
  await page.goto("/o-platformi");
  await expect(
    page.getByRole("heading", { name: "Kaj že deluje" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Česa še ni" })).toBeVisible();
});

test("API ne izpostavlja prijav prek GET", async ({ request }) => {
  expect((await request.get("/api/zanimanje")).status()).toBe(405);
});
