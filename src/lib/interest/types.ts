import type { FieldErrors } from "./validation";

/** Telo zahteve POST /api/zanimanje. */
export interface InterestRequestBody {
  productId: string;
  email: string;
  quantity: number;
  consent: boolean;
  consentVersion: string;
  [honeypot: string]: unknown;
}

export type InterestErrorCode =
  | "validation"
  | "rate_limited"
  | "consent_outdated"
  | "rejected"
  | "unsupported"
  | "server";

export type InterestResponse =
  | {
      ok: true;
      productId: string;
      email: string;
      quantity: number;
      /** true, če je bila obstoječa prijava posodobljena. */
      updated: boolean;
    }
  | {
      ok: false;
      error: InterestErrorCode;
      message: string;
      fieldErrors?: FieldErrors;
    };
