import { findInterestProduct } from "@/content/products";
import { CONSENT_TEXT_VERSION } from "@/lib/interest/consent";
import type { InterestResponse } from "@/lib/interest/types";
import {
  HONEYPOT_FIELD,
  type FieldErrors,
  messages,
  normalizeEmail,
  parseQuantity,
  validateConsent,
  validateEmail,
} from "@/lib/interest/validation";
import type { InterestRepository } from "./interest-repository";
import type { RateLimiter } from "./rate-limit";

const MAX_BODY_BYTES = 4096;

export interface InterestHandlerDeps {
  repository: InterestRepository;
  rateLimiter: RateLimiter;
  now?: () => Date;
  logError?: (message: string, error: unknown) => void;
}

function json(body: InterestResponse, status: number): Response {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function fail(
  status: number,
  error: Extract<InterestResponse, { ok: false }>["error"],
  message: string,
  fieldErrors?: FieldErrors,
): Response {
  return json({ ok: false, error, message, fieldErrors }, status);
}

/** IP naslov odjemalca za omejevanje zahtev. Ne shranjuje se v bazo. */
export function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip")?.trim() || "neznano";
}

/** Zavrne zahteve z drugih spletnih mest (osnovna zaščita pred CSRF). */
export function isCrossSite(request: Request): boolean {
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "none") {
    return true;
  }
  const origin = request.headers.get("origin");
  if (!origin) return false;
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  try {
    return new URL(origin).host !== host;
  } catch {
    return true;
  }
}

export async function handleInterestRequest(
  request: Request,
  deps: InterestHandlerDeps,
): Promise<Response> {
  const now = deps.now ?? (() => new Date());
  const logError =
    deps.logError ??
    ((message: string, error: unknown) => console.error(message, error));

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return fail(415, "unsupported", "Zahteva ni v pričakovani obliki.");
  }

  if (isCrossSite(request)) {
    return fail(403, "rejected", "Prijave ni bilo mogoče sprejeti.");
  }

  if (!deps.rateLimiter.consume(clientKey(request))) {
    return fail(
      429,
      "rate_limited",
      "Prejeli smo preveč poskusov. Počakaj nekaj minut in poskusi znova.",
    );
  }

  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return fail(400, "unsupported", "Zahteve ni bilo mogoče prebrati.");
  }
  if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) {
    return fail(413, "unsupported", "Zahteva je prevelika.");
  }

  let body: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("not an object");
    }
    body = parsed as Record<string, unknown>;
  } catch {
    return fail(400, "unsupported", "Zahteva ni v pričakovani obliki.");
  }

  // Skrito polje izpolnijo samo samodejni programi.
  const honeypot = body[HONEYPOT_FIELD];
  if (
    typeof honeypot === "string" ? honeypot.trim() !== "" : honeypot != null
  ) {
    return fail(400, "rejected", "Prijave ni bilo mogoče sprejeti.");
  }

  const fieldErrors: FieldErrors = {};
  const product = findInterestProduct(body.productId);
  if (!product) fieldErrors.productId = messages.productInvalid;

  const emailError = validateEmail(body.email);
  if (emailError) fieldErrors.email = emailError;

  // Strežnik sprejme samo celo število (ne niza).
  const quantity =
    typeof body.quantity === "number" ? parseQuantity(body.quantity) : null;
  if (quantity === null) fieldErrors.quantity = messages.quantityInvalid;

  const consentError = validateConsent(body.consent);
  if (consentError) fieldErrors.consent = consentError;

  if (Object.keys(fieldErrors).length > 0 || !product || quantity === null) {
    return fail(400, "validation", "Preveri označena polja.", fieldErrors);
  }

  if (body.consentVersion !== CONSENT_TEXT_VERSION) {
    return fail(
      409,
      "consent_outdated",
      "Besedilo privolitve se je spremenilo. Osveži stran in poskusi znova.",
    );
  }

  const email = normalizeEmail(body.email as string);

  try {
    const result = await deps.repository.save({
      productId: product.id,
      email,
      quantity,
      consentTextVersion: CONSENT_TEXT_VERSION,
      now: now(),
    });
    return json(
      {
        ok: true,
        productId: product.id,
        email,
        quantity,
        updated: result.updated,
      },
      result.updated ? 200 : 201,
    );
  } catch (error) {
    logError("Shranjevanje prijave zanimanja ni uspelo.", error);
    return fail(
      500,
      "server",
      "Prijave trenutno ni bilo mogoče shraniti. Poskusi znova čez nekaj trenutkov.",
    );
  }
}
