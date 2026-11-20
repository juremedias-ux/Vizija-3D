import { connection } from "next/server";

import { getProviderInfo } from "@/lib/generation/provider";

/** GET /api/3d/ponudnik — ali je vklopljen ponudnik AI ali demo način. */
export async function GET(): Promise<Response> {
  await connection();
  return Response.json(getProviderInfo(), {
    headers: { "Cache-Control": "no-store" },
  });
}
