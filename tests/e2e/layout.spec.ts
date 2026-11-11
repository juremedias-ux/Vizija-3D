import { expect, test } from "@playwright/test";

import { expectNoHorizontalOverflow, waitForHydration } from "./helpers";

const HEADLINE = "fotografiraj prostor, si umesti izdelke, naroči izdelavo.";

test("naslov, jezik in metapodatki", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "sl");
  await expect(page).toHaveTitle(/Vizija 3D/);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    /nezavezujoče zanimanje/,
  );

  const h1 = page.locator("h1");
  await expect(h1).toHaveCount(1);
  const text = (await h1.textContent())?.replace(/\s+/g, " ").trim();
  expect(text).toBe(HEADLINE);

  await expect(
    page.getByText("Izdelki v razvoju", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Vizualizacija prostora prihaja", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Razvijamo platformo, na kateri boš lahko fotografiral svoj prostor, vanj umestil naše izdelke in naročil izdelavo. Za zdaj razišči ponudbo in oddaj nezavezujoče zanimanje.",
    ),
  ).toBeVisible();
});

test("gumba v uvodu pomakneta na ustrezna razdelka", async ({ page }) => {
  await page.goto("/");
  const hero = page.locator("section").first();
  await hero.getByRole("link", { name: /Razišči izdelke/ }).click();
  await expect(page).toHaveURL(/#izdelki$/);
  await expect(page.locator("#izdelki-naslov")).toBeInViewport();

  await page.goto("/");
  await hero.getByRole("link", { name: "Oglej si vizijo platforme" }).click();
  await expect(page).toHaveURL(/#vizualizacija$/);
  await expect(page.locator("#vizualizacija-naslov")).toBeInViewport();
});

test("namizna navigacija vodi na vse razdelke", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Glavna navigacija" });
  await expect(page.getByRole("button", { name: "Odpri meni" })).toBeHidden();
  for (const [label, id] of [
    ["Izdelki", "izdelki"],
    ["Kako deluje", "kako-deluje"],
    ["Vizualizacija", "vizualizacija"],
    ["Pogosta vprašanja", "vprasanja"],
  ]) {
    await nav.getByRole("link", { name: label }).click();
    await expect(page).toHaveURL(new RegExp(`#${id}$`));
    await expect(page.locator(`#${id}-naslov`)).toBeInViewport();
  }
});

test("mobilni meni: odpiranje, Escape, povezave", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await waitForHydration(page);
  const toggle = page.getByRole("button", { name: "Odpri meni" });
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  const mobileNav = page.getByRole("navigation", {
    name: "Mobilna navigacija",
  });
  await expect(mobileNav).toBeHidden();

  await toggle.focus();
  await page.keyboard.press("Enter");
  const close = page.getByRole("button", { name: "Zapri meni" });
  await expect(close).toHaveAttribute("aria-expanded", "true");
  await expect(mobileNav).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(mobileNav).toBeHidden();
  await expect(page.getByRole("button", { name: "Odpri meni" })).toBeFocused();

  await page.getByRole("button", { name: "Odpri meni" }).click();
  await mobileNav.getByRole("link", { name: "Pogosta vprašanja" }).click();
  await expect(page).toHaveURL(/#vprasanja$/);
  await expect(mobileNav).toBeHidden();
  await expect(page.locator("#vprasanja-naslov")).toBeInViewport();
});

for (const width of [320, 360, 390, 768, 1024, 1440]) {
  test(`brez vodoravnega prelivanja pri širini ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expectNoHorizontalOverflow(page);
    await page.goto("/zasebnost");
    await expectNoHorizontalOverflow(page);
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
  await page.goto("/");
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
    const el = document.activeElement as HTMLElement;
    const style = getComputedStyle(el);
    return { style: style.outlineStyle, width: style.outlineWidth };
  });
  expect(outline.style).not.toBe("none");
  expect(outline.width).not.toBe("0px");
});

test("zmanjšano gibanje izklopi gladko drsenje", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const behavior = await page.evaluate(
    () => getComputedStyle(document.documentElement).scrollBehavior,
  );
  expect(behavior).toBe("auto");
});

test("noga: opis, obvestilo, leto in povezava na zasebnost", async ({
  page,
}) => {
  await page.goto("/");
  const footer = page.locator("footer");
  await expect(
    footer.getByText(
      "Uporabne ideje za dom in delovni prostor, izdelane s 3D tiskanjem.",
    ),
  ).toBeVisible();
  await expect(
    footer.getByText("Izdelki in vizualizacija prostora so v razvoju."),
  ).toBeVisible();
  await expect(footer).toContainText(`© ${new Date().getFullYear()} Vizija 3D`);
  await footer.getByRole("link", { name: "Zasebnost" }).click();
  await expect(page).toHaveURL(/\/zasebnost$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Zasebnost" }),
  ).toBeVisible();
  await expect(page.getByText("Besedilo še ni dokončano.")).toBeVisible();
});

test("ločitev obstoječih in prihodnjih funkcij", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('input[type="file"]')).toHaveCount(0);

  const today = page.locator("#kako-deluje");
  await expect(
    today.getByText("Do svojih favoritov v treh korakih"),
  ).toBeVisible();
  await expect(
    today.getByText("Brez plačila in brez obveznosti nakupa."),
  ).toBeVisible();
  await expect(today).not.toContainText("fotografij");

  const future = page.locator("#vizualizacija");
  await expect(
    future.getByRole("heading", {
      name: "Tvoj prostor. Naši izdelki. Tvoja vizija.",
    }),
  ).toBeVisible();
  await expect(future.getByText("Funkcija v pripravi")).toBeVisible();
  await expect(
    future.getByText(
      "Konceptni prikaz prihodnje funkcije — vizualizacija še ni na voljo.",
    ),
  ).toBeVisible();
  await expect(future.locator("form, input, button")).toHaveCount(0);
});

test("pogosta vprašanja se odprejo s tipkovnico", async ({ page }) => {
  await page.goto("/");
  const summary = page.locator("#vprasanja summary").first();
  await summary.focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByText(/Gumb »Oddaj naročilo« trenutno odda le nezavezujočo/),
  ).toBeVisible();
});

test("API ne izpostavlja prijav prek GET", async ({ request }) => {
  const response = await request.get("/api/zanimanje");
  expect(response.status()).toBe(405);
});
