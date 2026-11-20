import { connection } from "next/server";

import { handleGetTask } from "@/lib/generation/handler";
import { getGenerationProvider } from "@/lib/generation/provider";

/** GET /api/3d/naloge/[id] — stanje naloge ustvarjanja. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  await connection();
  const { id } = await params;
  return handleGetTask(decodeURIComponent(id), getGenerationProvider());
}
