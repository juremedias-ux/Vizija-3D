import { describe, expect, it } from "vitest";

import {
  handleCreateTask,
  handleGetModel,
  handleGetTask,
} from "@/lib/generation/handler";
import {
  type GenerationInput,
  ProviderError,
  type ThreeDGenerationProvider,
} from "@/lib/generation/types";
import { createRateLimiter } from "@/lib/server/rate-limit";

function fakeProvider(overrides: Partial<ThreeDGenerationProvider> = {}) {
  const calls: GenerationInput[] = [];
  const provider: ThreeDGenerationProvider = {
    name: "Testni",
    supportsImages: true,
    maxImages: 3,
    async createTask(input) {
      calls.push(input);
      return { taskId: "t2:abc-123" };
    },
    async getTask(taskId) {
      return { id: taskId, status: "v-teku", progress: 40 };
    },
    ...overrides,
  };
  return { provider, calls };
}

const limiter = () => createRateLimiter({ limit: 100, windowMs: 60_000 });

function post(body: unknown, headers: Record<string, string> = {}) {
  return new Request("http://localhost/api/3d/naloge", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      host: "localhost",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

const PNG = "data:image/png;base64,iVBORw0KGgo=";

describe("POST /api/3d/naloge", () => {
  it("v demo načinu (brez ponudnika) vrne 409", async () => {
    const res = await handleCreateTask(
      post({ kind: "besedilo", prompt: "posoda" }),
      {
        provider: null,
        rateLimiter: limiter(),
      },
    );
    expect(res.status).toBe(409);
  });

  it("začne nalogo iz besedila", async () => {
    const { provider, calls } = fakeProvider();
    const res = await handleCreateTask(
      post({ kind: "besedilo", prompt: "  posoda   za ključe " }),
      {
        provider,
        rateLimiter: limiter(),
      },
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, taskId: "t2:abc-123" });
    expect(calls[0]).toEqual({
      kind: "besedilo",
      prompt: "posoda za ključe",
      images: [],
    });
  });

  it("zavrne prepovedano vsebino, preden kliče ponudnika", async () => {
    const { provider, calls } = fakeProvider();
    const res = await handleCreateTask(
      post({ kind: "besedilo", prompt: "pištola" }),
      {
        provider,
        rateLimiter: limiter(),
      },
    );
    expect(res.status).toBe(422);
    expect((await res.json()).message).toMatch(/Tega ne moremo ustvariti/);
    expect(calls).toHaveLength(0);
  });

  it("preveri slike", async () => {
    const { provider } = fakeProvider();
    const deps = { provider, rateLimiter: limiter() };
    expect(
      (await handleCreateTask(post({ kind: "slika", images: [] }), deps))
        .status,
    ).toBe(400);
    expect(
      (
        await handleCreateTask(
          post({ kind: "slika", images: ["http://zunanja.si/a.png"] }),
          deps,
        )
      ).status,
    ).toBe(400);
    expect(
      (
        await handleCreateTask(
          post({ kind: "slika", images: [PNG, PNG, PNG, PNG] }),
          deps,
        )
      ).status,
    ).toBe(400);
    expect(
      (await handleCreateTask(post({ kind: "slika", images: [PNG] }), deps))
        .status,
    ).toBe(200);
  });

  it("omeji število ustvarjanj in zavrne zahteve z drugih strani", async () => {
    const { provider } = fakeProvider();
    const rateLimiter = createRateLimiter({ limit: 1, windowMs: 60_000 });
    const body = { kind: "besedilo", prompt: "vaza" };
    expect(
      (await handleCreateTask(post(body), { provider, rateLimiter })).status,
    ).toBe(200);
    expect(
      (await handleCreateTask(post(body), { provider, rateLimiter })).status,
    ).toBe(429);
    expect(
      (
        await handleCreateTask(
          post(body, { origin: "https://drugo.example" }),
          {
            provider,
            rateLimiter: limiter(),
          },
        )
      ).status,
    ).toBe(403);
  });

  it("napako ponudnika pretvori v razumljivo sporočilo", async () => {
    const { provider } = fakeProvider({
      async createTask() {
        throw new ProviderError("Storitev je trenutno preobremenjena.", 503);
      },
    });
    const res = await handleCreateTask(
      post({ kind: "besedilo", prompt: "vaza" }),
      {
        provider,
        rateLimiter: limiter(),
      },
    );
    expect(res.status).toBe(503);
    expect((await res.json()).message).toBe(
      "Storitev je trenutno preobremenjena.",
    );
  });
});

describe("GET naloge in modela", () => {
  it("vrne stanje naloge", async () => {
    const { provider } = fakeProvider();
    const res = await handleGetTask("t2:abc", provider);
    expect(await res.json()).toEqual({
      ok: true,
      task: { id: "t2:abc", status: "v-teku", progress: 40 },
    });
  });

  it("modela ne prenese, dokler naloga ni končana", async () => {
    const { provider } = fakeProvider();
    expect((await handleGetModel("t2:abc", provider)).status).toBe(409);
  });
});
