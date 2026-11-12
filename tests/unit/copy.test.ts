import { describe, expect, it } from "vitest";

import { HERO_HEADLINE } from "@/content/copy";
import {
  CONSENT_TEXT_VERSION,
  EMAIL_USAGE_TEXT,
  NON_BINDING_NOTICE,
} from "@/lib/interest/consent";

describe("obvezna besedila", () => {
  it("naslov je dobesedno enak zahtevanemu", () => {
    expect(HERO_HEADLINE).toBe(
      "fotografiraj prostor, si umesti izdelke, naroči izdelavo.",
    );
  });

  it("besedila ob obrazcu in v potrditvi so dobesedno enaka zahtevanim", () => {
    expect(EMAIL_USAGE_TEXT).toBe(
      "Tvoj e-poštni naslov bomo uporabili za obvestilo o razpoložljivosti izbranega izdelka.",
    );
    expect(NON_BINDING_NOTICE).toBe(
      "Izdelek je v razvoju. Oddaja pomeni nezavezujočo prijavo zanimanja, brez plačila.",
    );
  });

  it("različica privolitve odraža privolitev z oddajo obrazca", () => {
    expect(CONSENT_TEXT_VERSION).toBe("2026-11-v2");
  });
});
