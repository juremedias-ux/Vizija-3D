import { connection } from "next/server";

import { handleGetModel } from "@/lib/generation/handler";
import { getGenerationProvider } from "@/lib/generation/provider";

/** GET /api/3d/naloge/[id]/model — prenos GLB končane naloge (rezervna pot). */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  await connection();
  const { id } = await params;
  return handleGetModel(decodeURIComponent(id), getGenerationProvider());
}
