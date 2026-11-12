import { afterEach, describe, expect, it, vi } from "vitest";

import { CONSENT_TEXT_VERSION } from "@/lib/interest/consent";
import { getInterestRepository } from "@/lib/server/repository";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("izbira shrambe", () => {
  it("na Vercelu brez DATABASE_URL ne shrani in vrne napako", async () => {
    vi.stubEnv("DATABASE_URL", "");
    vi.stubEnv("VERCEL", "1");
    await expect(
      getInterestRepository().save({
        productId: "drzalo-za-metlo",
        email: "ana@primer.si",
        quantity: 1,
        consentTextVersion: CONSENT_TEXT_VERSION,
        now: new Date(),
      }),
    ).rejects.toThrow(/DATABASE_URL/);
  });

  it("z DATABASE_URL uporabi isto povezavo za zaporedne zahteve", () => {
    vi.stubEnv(
      "DATABASE_URL",
      "postgres://uporabnik:geslo@localhost:5432/baza",
    );
    expect(getInterestRepository()).toBe(getInterestRepository());
  });
});
