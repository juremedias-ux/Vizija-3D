import { describe, expect, it } from "vitest";

import { HERO_HEADLINE } from "@/content/copy";
import {
  CONSENT_TEXT,
  EMAIL_USAGE_TEXT,
  NON_BINDING_NOTICE,
} from "@/lib/interest/consent";

describe("obvezna besedila", () => {
  it("naslov je dobesedno enak zahtevanemu", () => {
    expect(HERO_HEADLINE).toBe(
      "fotografiraj prostor, si umesti izdelke, naroči izdelavo.",
    );
  });

  it("besedila ob obrazcu so dobesedno enaka zahtevanim", () => {
    expect(CONSENT_TEXT).toBe(
      "Želim prejeti obvestilo, ko bo izbrani izdelek na voljo.",
    );
    expect(EMAIL_USAGE_TEXT).toBe(
      "Tvoj e-poštni naslov bomo uporabili za obvestilo o razpoložljivosti izbranega izdelka.",
    );
    expect(NON_BINDING_NOTICE).toBe(
      "Izdelek je v razvoju. Oddaja pomeni nezavezujočo prijavo zanimanja, brez plačila.",
    );
  });
});
