/**
 * Preverjanje vnosov za prijavo zanimanja. Uporablja se na odjemalcu in na strežniku.
 */

export const QUANTITY_MIN = 1;
export const QUANTITY_MAX = 99;
export const EMAIL_MAX_LENGTH = 254;

/** Ime skritega polja (honeypot). Resnični obiskovalci ga ne vidijo. */
export const HONEYPOT_FIELD = "spletna_stran";

export const messages = {
  emailRequired: "Vpiši e-poštni naslov.",
  emailInvalid: "Vpiši veljaven e-poštni naslov, na primer ime@domena.si.",
  quantityInvalid: `Količina mora biti celo število od ${QUANTITY_MIN} do ${QUANTITY_MAX}.`,
  consentRequired: "Za oddajo potrdi, da želiš prejeti obvestilo.",
  productInvalid: "Za izbrani izdelek oddaja zanimanja ni mogoča.",
} as const;

export type InterestField = "email" | "quantity" | "consent" | "productId";
export type FieldErrors = Partial<Record<InterestField, string>>;

// Namenoma preprost vzorec: brez presledkov, en @, domena s piko.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/;

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function validateEmail(value: unknown): string | null {
  if (typeof value !== "string" || value.trim() === "") {
    return messages.emailRequired;
  }
  const email = value.trim();
  const [local = ""] = email.split("@");
  if (
    email.length > EMAIL_MAX_LENGTH ||
    local.length > 64 ||
    !EMAIL_PATTERN.test(email)
  ) {
    return messages.emailInvalid;
  }
  return null;
}

/**
 * Pretvori vnos količine v celo število ali vrne null, če vnos ni veljaven.
 * Sprejme število ali niz samih števk (npr. iz vnosnega polja).
 */
export function parseQuantity(value: unknown): number | null {
  let parsed: number;
  if (typeof value === "number") {
    parsed = value;
  } else if (typeof value === "string" && /^\s*\d{1,3}\s*$/.test(value)) {
    parsed = Number(value.trim());
  } else {
    return null;
  }
  if (!Number.isInteger(parsed)) return null;
  if (parsed < QUANTITY_MIN || parsed > QUANTITY_MAX) return null;
  return parsed;
}

export function validateQuantity(value: unknown): string | null {
  return parseQuantity(value) === null ? messages.quantityInvalid : null;
}

export function validateConsent(value: unknown): string | null {
  return value === true ? null : messages.consentRequired;
}

export function clampQuantity(value: number): number {
  if (!Number.isFinite(value)) return QUANTITY_MIN;
  return Math.min(QUANTITY_MAX, Math.max(QUANTITY_MIN, Math.round(value)));
}
