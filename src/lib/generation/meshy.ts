import {
  type GenerationInput,
  type GenerationTask,
  ProviderError,
  type TaskStatus,
  type ThreeDGenerationProvider,
} from "./types";

/**
 * Prilagoditev za Meshy (https://www.meshy.ai).
 *
 * POZOR: ta prilagoditev NI preizkušena z živim API-jem, ker iz razvojnega okolja
 * ni bilo dostopa do storitve. Končne točke in polja sledijo javni dokumentaciji
 * Meshy (openapi v1/v2), kot je bila znana ob izdelavi. Pred uporabo v produkciji
 * preveri dokumentacijo in prilagodi spodnje poti ter polja.
 */

const API = "https://api.meshy.ai/openapi";

type Endpoint = "t2" | "i2" | "mi";

const PATHS: Record<Endpoint, string> = {
  t2: "/v2/text-to-3d",
  i2: "/v1/image-to-3d",
  mi: "/v1/multi-image-to-3d",
};

const STATUS: Record<string, TaskStatus> = {
  PENDING: "v-cakalni-vrsti",
  IN_PROGRESS: "v-teku",
  SUCCEEDED: "koncano",
  FAILED: "napaka",
  CANCELED: "napaka",
  EXPIRED: "napaka",
};

export class MeshyProvider implements ThreeDGenerationProvider {
  readonly name = "Meshy";
  readonly supportsImages = true;
  readonly maxImages = 3;

  constructor(private readonly apiKey: string) {}

  private async call(path: string, init?: RequestInit): Promise<unknown> {
    let response: Response;
    try {
      response = await fetch(`${API}${path}`, {
        ...init,
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          ...init?.headers,
        },
        cache: "no-store",
        signal: AbortSignal.timeout(20_000),
      });
    } catch {
      throw new ProviderError(
        "Storitev za ustvarjanje modelov se ne odziva. Poskusi znova čez nekaj minut.",
      );
    }
    if (response.status === 401 || response.status === 403) {
      throw new ProviderError(
        "Ključ za storitev ustvarjanja modelov ni veljaven. Obvesti skrbnika strani.",
        500,
      );
    }
    if (response.status === 402 || response.status === 429) {
      throw new ProviderError(
        "Storitev je trenutno preobremenjena ali je dosežena omejitev. Poskusi znova kasneje.",
        503,
      );
    }
    if (!response.ok) {
      throw new ProviderError(
        "Storitev za ustvarjanje modelov je vrnila napako. Poskusi znova.",
      );
    }
    return response.json();
  }

  async createTask(input: GenerationInput): Promise<{ taskId: string }> {
    let endpoint: Endpoint;
    let body: Record<string, unknown>;
    if (input.kind === "besedilo") {
      endpoint = "t2";
      body = { mode: "preview", prompt: input.prompt, should_remesh: true };
    } else if (input.images.length > 1) {
      endpoint = "mi";
      body = { image_urls: input.images, should_remesh: true };
    } else {
      endpoint = "i2";
      body = { image_url: input.images[0], should_remesh: true };
    }
    const data = (await this.call(PATHS[endpoint], {
      method: "POST",
      body: JSON.stringify(body),
    })) as { result?: unknown };
    if (typeof data.result !== "string" || !data.result) {
      throw new ProviderError("Storitev ni vrnila oznake naloge.");
    }
    return { taskId: `${endpoint}:${data.result}` };
  }

  async getTask(taskId: string): Promise<GenerationTask> {
    const [endpoint, id] = taskId.split(":") as [Endpoint, string];
    if (!PATHS[endpoint] || !/^[\w-]{1,100}$/.test(id ?? "")) {
      throw new ProviderError("Neveljavna oznaka naloge.", 400);
    }
    const data = (await this.call(`${PATHS[endpoint]}/${id}`)) as {
      status?: string;
      progress?: number;
      model_urls?: { glb?: string };
      task_error?: { message?: string };
    };
    const status = STATUS[data.status ?? ""] ?? "v-teku";
    return {
      id: taskId,
      status,
      progress: Math.max(0, Math.min(100, Number(data.progress) || 0)),
      modelUrl: status === "koncano" ? data.model_urls?.glb : undefined,
      message:
        status === "napaka"
          ? "Modela ni bilo mogoče ustvariti. Poskusi z drugačnim opisom ali sliko."
          : undefined,
    };
  }
}
