import { describe, expect, it } from "vitest";

import {
  clampQuantity,
  messages,
  normalizeEmail,
  parseQuantity,
  validateConsent,
  validateEmail,
} from "@/lib/interest/validation";

describe("e-poštni naslov", () => {
  it.each(["ana@primer.si", "a.b+c@sub.domena.com", "  ana@primer.si  "])(
    "sprejme %s",
    (email) => expect(validateEmail(email)).toBeNull(),
  );

  it("zahteva vnos", () => {
    expect(validateEmail("")).toBe(messages.emailRequired);
    expect(validateEmail("   ")).toBe(messages.emailRequired);
    expect(validateEmail(undefined)).toBe(messages.emailRequired);
  });

  it.each([
    "ana",
    "ana@",
    "@primer.si",
    "ana@primer",
    "ana @primer.si",
    "ana@@primer.si",
    "ana@primer..si",
  ])("zavrne %s", (email) =>
    expect(validateEmail(email)).toBe(messages.emailInvalid),
  );

  it("zavrne predolg naslov", () => {
    expect(validateEmail(`${"a".repeat(250)}@x.si`)).toBe(
      messages.emailInvalid,
    );
    expect(validateEmail(`${"a".repeat(65)}@primer.si`)).toBe(
      messages.emailInvalid,
    );
  });

  it("normalizira naslov", () => {
    expect(normalizeEmail("  Ana@Primer.SI ")).toBe("ana@primer.si");
  });
});

describe("količina", () => {
  it.each([
    [1, 1],
    [99, 99],
    ["7", 7],
    [" 12 ", 12],
  ])("sprejme %s", (value, expected) => {
    expect(parseQuantity(value)).toBe(expected);
  });

  it.each([
    0,
    100,
    -1,
    1.5,
    Number.NaN,
    "",
    "abc",
    "1.5",
    "1e2",
    "100",
    null,
    undefined,
    true,
  ])("zavrne %s", (value) => expect(parseQuantity(value)).toBeNull());

  it("omeji vrednost na 1–99", () => {
    expect(clampQuantity(0)).toBe(1);
    expect(clampQuantity(150)).toBe(99);
    expect(clampQuantity(Number.NaN)).toBe(1);
  });
});

describe("privolitev", () => {
  it("zahteva izrecno true", () => {
    expect(validateConsent(true)).toBeNull();
    expect(validateConsent(false)).toBe(messages.consentRequired);
    expect(validateConsent("true")).toBe(messages.consentRequired);
  });
});
