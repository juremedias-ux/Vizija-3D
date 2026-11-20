import {
  BLOCKED_MESSAGE,
  cleanPrompt,
  isBlockedContent,
} from "@/lib/model3d/prompt";
import { clientKey, isCrossSite } from "@/lib/server/interest-handler";
import type { RateLimiter } from "@/lib/server/rate-limit";

import {
  MAX_IMAGES,
  MAX_IMAGES_TOTAL_CHARS,
  ProviderError,
  type ThreeDGenerationProvider,
} from "./types";

/** Obdelava zahtev za ustvarjanje modela (ločeno od poti zaradi testiranja). */

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

const fail = (status: number, message: string) =>
  json({ ok: false, message }, status);

const IMAGE_DATA_URL = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/;

export async function handleCreateTask(
  request: Request,
  deps: { provider: ThreeDGenerationProvider | null; rateLimiter: RateLimiter },
): Promise<Response> {
  if (!deps.provider) {
    return fail(
      409,
      "Ustvarjanje z umetno inteligenco ni vklopljeno; uporabi demo način.",
    );
  }
  if (
    !(request.headers.get("content-type") ?? "").includes("application/json")
  ) {
    return fail(415, "Zahteva ni v pričakovani obliki.");
  }
  if (isCrossSite(request))
    return fail(403, "Zahteve ni bilo mogoče sprejeti.");
  if (!deps.rateLimiter.consume(clientKey(request))) {
    return fail(
      429,
      "Dosegel si omejitev ustvarjanja modelov. Poskusi znova čez nekaj časa.",
    );
  }

  let body: { kind?: unknown; prompt?: unknown; images?: unknown };
  try {
    const raw = await request.text();
    if (raw.length > MAX_IMAGES_TOTAL_CHARS + 10_000) {
      return fail(413, "Slike so prevelike. Uporabi manj ali manjše slike.");
    }
    body = JSON.parse(raw);
  } catch {
    return fail(400, "Zahteva ni v pričakovani obliki.");
  }

  const kind =
    body.kind === "slika"
      ? "slika"
      : body.kind === "besedilo"
        ? "besedilo"
        : null;
  if (!kind) return fail(400, "Neznan način ustvarjanja.");
  const prompt =
    typeof body.prompt === "string" ? cleanPrompt(body.prompt) : "";
  const images = Array.isArray(body.images)
    ? body.images.filter((i): i is string => typeof i === "string")
    : [];

  if (prompt && isBlockedContent(prompt)) return fail(422, BLOCKED_MESSAGE);
  if (kind === "besedilo" && prompt.length < 3) {
    return fail(400, "Opiši predmet z vsaj nekaj besedami.");
  }
  if (kind === "slika") {
    if (!images.length) return fail(400, "Dodaj vsaj eno sliko.");
    if (images.length > Math.min(MAX_IMAGES, deps.provider.maxImages)) {
      return fail(400, `Dodaš lahko največ ${MAX_IMAGES} slike.`);
    }
    if (!images.every((i) => IMAGE_DATA_URL.test(i))) {
      return fail(400, "Slike morajo biti v obliki PNG, JPG ali WEBP.");
    }
  }

  try {
    const { taskId } = await deps.provider.createTask({ kind, prompt, images });
    return json({ ok: true, taskId });
  } catch (error) {
    if (error instanceof ProviderError)
      return fail(error.status, error.message);
    return fail(502, "Ustvarjanja ni bilo mogoče začeti. Poskusi znova.");
  }
}

export async function handleGetTask(
  taskId: string,
  provider: ThreeDGenerationProvider | null,
): Promise<Response> {
  if (!provider)
    return fail(409, "Ustvarjanje z umetno inteligenco ni vklopljeno.");
  try {
    const task = await provider.getTask(taskId);
    return json({ ok: true, task });
  } catch (error) {
    if (error instanceof ProviderError)
      return fail(error.status, error.message);
    return fail(502, "Stanja naloge ni bilo mogoče preveriti.");
  }
}

const MAX_MODEL_PROXY_BYTES = 4 * 1024 * 1024;

/** Prenese GLB končane naloge (povezavo pridobi pri ponudniku, ne od odjemalca). */
export async function handleGetModel(
  taskId: string,
  provider: ThreeDGenerationProvider | null,
): Promise<Response> {
  if (!provider)
    return fail(409, "Ustvarjanje z umetno inteligenco ni vklopljeno.");
  try {
    const task = await provider.getTask(taskId);
    if (task.status !== "koncano" || !task.modelUrl) {
      return fail(409, "Model še ni pripravljen.");
    }
    const url = new URL(task.modelUrl);
    if (url.protocol !== "https:")
      return fail(502, "Povezava do modela ni varna.");
    const response = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) return fail(502, "Modela ni bilo mogoče prenesti.");
    const size = Number(response.headers.get("content-length") ?? "0");
    if (size > MAX_MODEL_PROXY_BYTES) {
      return fail(413, "Model je prevelik za prenos prek strežnika.");
    }
    const buffer = await response.arrayBuffer();
    if (buffer.byteLength > MAX_MODEL_PROXY_BYTES) {
      return fail(413, "Model je prevelik za prenos prek strežnika.");
    }
    return new Response(buffer, {
      headers: {
        "Content-Type": "model/gltf-binary",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (error instanceof ProviderError)
      return fail(error.status, error.message);
    return fail(502, "Modela ni bilo mogoče prenesti.");
  }
}
