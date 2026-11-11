import { describe, expect, it } from "vitest";

import { createRateLimiter } from "@/lib/server/rate-limit";

describe("omejevanje zahtev", () => {
  it("omeji število zahtev v oknu in jih spet dovoli po izteku", () => {
    const limiter = createRateLimiter({ limit: 2, windowMs: 1000 });
    expect(limiter.consume("a", 0)).toBe(true);
    expect(limiter.consume("a", 10)).toBe(true);
    expect(limiter.consume("a", 20)).toBe(false);
    expect(limiter.consume("b", 20)).toBe(true);
    expect(limiter.consume("a", 1011)).toBe(true);
  });
});
