import { handleCreateTask } from "@/lib/generation/handler";
import { getGenerationProvider } from "@/lib/generation/provider";
import { createRateLimiter } from "@/lib/server/rate-limit";

/** POST /api/3d/naloge — začne ustvarjanje modela pri ponudniku AI. */

function readPositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

const rateLimiter = createRateLimiter({
  limit: readPositiveInt(process.env.AI_3D_RATE_LIMIT_MAX, 10),
  windowMs: readPositiveInt(
    process.env.AI_3D_RATE_LIMIT_WINDOW_MS,
    60 * 60 * 1000,
  ),
});

export async function POST(request: Request): Promise<Response> {
  return handleCreateTask(request, {
    provider: getGenerationProvider(),
    rateLimiter,
  });
}
