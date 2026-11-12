import { handleInterestRequest } from "@/lib/server/interest-handler";
import {
  createRateLimiter,
  rateLimitOptionsFromEnv,
} from "@/lib/server/rate-limit";
import { getInterestRepository } from "@/lib/server/repository";

/**
 * POST /api/zanimanje — shrani nezavezujočo prijavo zanimanja.
 *
 * Namenoma ni metode GET: prijave niso dostopne prek javnih končnih točk.
 */

const rateLimiter = createRateLimiter(rateLimitOptionsFromEnv());

export async function POST(request: Request): Promise<Response> {
  return handleInterestRequest(request, {
    repository: getInterestRepository(),
    rateLimiter,
  });
}
