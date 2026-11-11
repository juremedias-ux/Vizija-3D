import { getDatabase } from "@/lib/server/db";
import { handleInterestRequest } from "@/lib/server/interest-handler";
import { createSqliteInterestRepository } from "@/lib/server/interest-repository";
import {
  createRateLimiter,
  rateLimitOptionsFromEnv,
} from "@/lib/server/rate-limit";

/**
 * POST /api/zanimanje — shrani nezavezujočo prijavo zanimanja.
 *
 * Namenoma ni metode GET: prijave niso dostopne prek javnih končnih točk.
 */

const repository = createSqliteInterestRepository(getDatabase);
const rateLimiter = createRateLimiter(rateLimitOptionsFromEnv());

export async function POST(request: Request): Promise<Response> {
  return handleInterestRequest(request, { repository, rateLimiter });
}
