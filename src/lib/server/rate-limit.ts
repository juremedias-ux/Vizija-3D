/**
 * Preprosto omejevanje števila zahtev v pomnilniku (drseče okno na ključ).
 *
 * Primerno za namestitev z enim strežniškim procesom. Pri več instancah ali
 * strežniških funkcijah je treba uporabiti skupno shrambo (npr. Redis).
 */

export interface RateLimiter {
  /** Vrne true, če je zahteva dovoljena, in jo zabeleži. */
  consume(key: string, now?: number): boolean;
}

export function createRateLimiter(options: {
  limit: number;
  windowMs: number;
  maxKeys?: number;
}): RateLimiter {
  const { limit, windowMs, maxKeys = 10_000 } = options;
  const hits = new Map<string, number[]>();

  function prune(now: number) {
    for (const [key, timestamps] of hits) {
      const recent = timestamps.filter((t) => now - t < windowMs);
      if (recent.length === 0) hits.delete(key);
      else hits.set(key, recent);
    }
  }

  return {
    consume(key, now = Date.now()) {
      if (hits.size > maxKeys) prune(now);
      const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
      if (recent.length >= limit) {
        hits.set(key, recent);
        return false;
      }
      recent.push(now);
      hits.set(key, recent);
      return true;
    },
  };
}

function readPositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function rateLimitOptionsFromEnv() {
  return {
    limit: readPositiveInt(process.env.RATE_LIMIT_MAX, 20),
    windowMs: readPositiveInt(process.env.RATE_LIMIT_WINDOW_MS, 10 * 60 * 1000),
  };
}
