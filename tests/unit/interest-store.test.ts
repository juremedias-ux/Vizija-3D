import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import type { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { CONSENT_TEXT_VERSION } from "@/lib/interest/consent";
import { HONEYPOT_FIELD } from "@/lib/interest/validation";
import { openDatabase } from "@/lib/server/db";
import { handleInterestRequest } from "@/lib/server/interest-handler";
import {
  type InterestRepository,
  createSqliteInterestRepository,
} from "@/lib/server/interest-repository";
import { createRateLimiter } from "@/lib/server/rate-limit";

type Row = {
  id: string;
  product_id: string;
  email: string;
  quantity: number;
  status: string;
  consent_at: string;
  consent_text_version: string;
  created_at: string;
  updated_at: string;
};

let dir: string;
let db: DatabaseSync;
let repository: InterestRepository;

function rows(): Row[] {
  return db
    .prepare("SELECT * FROM interest_submissions ORDER BY created_at")
    .all() as Row[];
}

function request(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request("http://localhost:3000/api/zanimanje", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      host: "localhost:3000",
      ...headers,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

const valid = {
  productId: "drzalo-za-metlo",
  email: "Ana@Primer.si",
  quantity: 3,
  consent: true,
  consentVersion: CONSENT_TEXT_VERSION,
  [HONEYPOT_FIELD]: "",
};

function deps(
  overrides: Partial<Parameters<typeof handleInterestRequest>[1]> = {},
) {
  return {
    repository,
    rateLimiter: createRateLimiter({ limit: 100, windowMs: 60_000 }),
    logError: () => {},
    ...overrides,
  };
}

beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), "vizija-test-"));
  db = openDatabase(path.join(dir, "test.sqlite"));
  repository = createSqliteInterestRepository(() => db);
});

afterEach(() => {
  db.close();
  rmSync(dir, { recursive: true, force: true });
});

describe("shramba prijav", () => {
  it("shrani vse zahtevane podatke", () => {
    const now = new Date("2026-11-11T10:00:00.000Z");
    const result = repository.save({
      productId: "drzalo-za-metlo",
      email: "ana@primer.si",
      quantity: 2,
      consentTextVersion: CONSENT_TEXT_VERSION,
      now,
    });
    expect(result.updated).toBe(false);
    const [row] = rows();
    expect(row).toMatchObject({
      id: result.id,
      product_id: "drzalo-za-metlo",
      email: "ana@primer.si",
      quantity: 2,
      status: "active",
      consent_at: now.toISOString(),
      consent_text_version: CONSENT_TEXT_VERSION,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    });
    expect(row.id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("ponovna oddaja za isti izdelek in naslov posodobi količino (ne sešteje)", () => {
    const first = repository.save({
      productId: "drzalo-za-metlo",
      email: "ana@primer.si",
      quantity: 5,
      consentTextVersion: CONSENT_TEXT_VERSION,
      now: new Date("2026-11-11T10:00:00.000Z"),
    });
    const second = repository.save({
      productId: "drzalo-za-metlo",
      email: "ana@primer.si",
      quantity: 2,
      consentTextVersion: CONSENT_TEXT_VERSION,
      now: new Date("2026-11-11T11:00:00.000Z"),
    });
    expect(second).toEqual({ id: first.id, updated: true });
    const all = rows();
    expect(all).toHaveLength(1);
    expect(all[0].quantity).toBe(2);
    expect(all[0].created_at).toBe("2026-11-11T10:00:00.000Z");
    expect(all[0].updated_at).toBe("2026-11-11T11:00:00.000Z");
  });

  it("za različne izdelke ustvari ločene zapise", () => {
    for (const productId of ["drzalo-za-metlo", "skatlica-za-metke"]) {
      repository.save({
        productId,
        email: "ana@primer.si",
        quantity: 1,
        consentTextVersion: CONSENT_TEXT_VERSION,
        now: new Date(),
      });
    }
    expect(rows()).toHaveLength(2);
  });

  it("baza zavrne količino zunaj obsega", () => {
    expect(() =>
      repository.save({
        productId: "drzalo-za-metlo",
        email: "ana@primer.si",
        quantity: 100,
        consentTextVersion: CONSENT_TEXT_VERSION,
        now: new Date(),
      }),
    ).toThrow();
  });
});

describe("POST /api/zanimanje", () => {
  it("shrani veljavno prijavo in vrne 201", async () => {
    const response = await handleInterestRequest(request(valid), deps());
    expect(response.status).toBe(201);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({
      ok: true,
      productId: "drzalo-za-metlo",
      email: "ana@primer.si",
      quantity: 3,
      updated: false,
    });
    expect(rows()).toHaveLength(1);
  });

  it("ponovna oddaja vrne 200 in posodobi količino", async () => {
    await handleInterestRequest(request(valid), deps());
    const response = await handleInterestRequest(
      request({ ...valid, email: "ana@primer.si", quantity: 7 }),
      deps(),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      ok: true,
      updated: true,
      quantity: 7,
    });
    expect(rows()).toHaveLength(1);
    expect(rows()[0].quantity).toBe(7);
  });

  it.each([
    ["količina 0", { quantity: 0 }, "quantity"],
    ["količina 100", { quantity: 100 }, "quantity"],
    ["decimalna količina", { quantity: 1.5 }, "quantity"],
    ["količina kot niz", { quantity: "3" }, "quantity"],
    ["neveljaven e-naslov", { email: "ana@" }, "email"],
    ["brez privolitve", { consent: false }, "consent"],
    ["prazno mesto", { productId: "mesto-05" }, "productId"],
    ["neznan izdelek", { productId: "x" }, "productId"],
  ])("zavrne: %s", async (_label, patch, field) => {
    const response = await handleInterestRequest(
      request({ ...valid, ...patch }),
      deps(),
    );
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.error).toBe("validation");
    expect(body.fieldErrors[field]).toBeTruthy();
    expect(rows()).toHaveLength(0);
  });

  it("zavrne izpolnjeno skrito polje in ne shrani ničesar", async () => {
    const response = await handleInterestRequest(
      request({ ...valid, [HONEYPOT_FIELD]: "https://spam.example" }),
      deps(),
    );
    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe("rejected");
    expect(rows()).toHaveLength(0);
  });

  it("zavrne zastarelo različico privolitve", async () => {
    const response = await handleInterestRequest(
      request({ ...valid, consentVersion: "stara" }),
      deps(),
    );
    expect(response.status).toBe(409);
    expect(rows()).toHaveLength(0);
  });

  it("zavrne napačno vrsto vsebine in neveljaven JSON", async () => {
    const wrongType = new Request("http://localhost:3000/api/zanimanje", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: "email=a",
    });
    expect((await handleInterestRequest(wrongType, deps())).status).toBe(415);
    expect(
      (await handleInterestRequest(request("{ne-json"), deps())).status,
    ).toBe(400);
    expect((await handleInterestRequest(request("[1,2]"), deps())).status).toBe(
      400,
    );
  });

  it("zavrne preveliko zahtevo", async () => {
    const response = await handleInterestRequest(
      request({ ...valid, padding: "x".repeat(5000) }),
      deps(),
    );
    expect(response.status).toBe(413);
  });

  it("zavrne zahteve z drugega spletnega mesta", async () => {
    const response = await handleInterestRequest(
      request(valid, { origin: "https://drugo-mesto.example" }),
      deps(),
    );
    expect(response.status).toBe(403);
    const crossSite = await handleInterestRequest(
      request(valid, { "sec-fetch-site": "cross-site" }),
      deps(),
    );
    expect(crossSite.status).toBe(403);
    const sameOrigin = await handleInterestRequest(
      request(valid, {
        origin: "http://localhost:3000",
        "sec-fetch-site": "same-origin",
      }),
      deps(),
    );
    expect(sameOrigin.status).toBe(201);
  });

  it("omeji število zahtev z istega naslova IP", async () => {
    const limited = deps({
      rateLimiter: createRateLimiter({ limit: 2, windowMs: 60_000 }),
    });
    const headers = { "x-forwarded-for": "203.0.113.5" };
    expect(
      (await handleInterestRequest(request(valid, headers), limited)).status,
    ).toBe(201);
    expect(
      (await handleInterestRequest(request(valid, headers), limited)).status,
    ).toBe(200);
    const third = await handleInterestRequest(request(valid, headers), limited);
    expect(third.status).toBe(429);
    expect((await third.json()).error).toBe("rate_limited");
    const other = await handleInterestRequest(
      request(valid, { "x-forwarded-for": "203.0.113.6" }),
      limited,
    );
    expect(other.status).toBe(200);
  });

  it("ob napaki shrambe vrne 500 in ne sporoči uspeha", async () => {
    const failing: InterestRepository = {
      save: () => {
        throw new Error("disk full");
      },
    };
    const response = await handleInterestRequest(
      request(valid),
      deps({ repository: failing }),
    );
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.error).toBe("server");
  });
});

describe("javna izpostavljenost", () => {
  it("končna točka izvaža samo metodo POST", async () => {
    const route = await import("@/app/api/zanimanje/route");
    expect(Object.keys(route).sort()).toEqual(["POST"]);
  });
});
