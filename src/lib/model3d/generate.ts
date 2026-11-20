import type { ProviderInfo } from "@/lib/generation/types";

import {
  FriendlyError,
  imageToDataUrl,
  imageToRelief,
  loadGlbBuffer,
} from "./loaders";
import { sanitizeEngraving } from "./pixelFont";
import {
  BLOCKED_MESSAGE,
  DEFAULT_DIMENSIONS,
  KIND_LABELS,
  cleanPrompt,
  detectKind,
  isBlockedContent,
  mentionsHole,
  parseDimensions,
  parseEngravingText,
} from "./prompt";
import {
  type MeshSpec,
  type ModelSettings,
  NO_ROTATION,
  type ParametricSpec,
  type ModelSource,
  WALL_MM,
} from "./types";

/** Faze napredka, ki jih prikaže vmesnik. */
export const PROGRESS_STAGES = [
  "Ustvarjam osnovno obliko …",
  "Dodajam podrobnosti …",
  "Pripravljam predogled …",
] as const;

export interface GenerationResult {
  source: ModelSource;
  notes: string[];
  name: string;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/** Ime projekta iz opisa (prve besede). */
export function nameFromPrompt(prompt: string, fallback = "Moj model"): string {
  const words = cleanPrompt(prompt)
    .replace(/[,.;:]+.*$/, "")
    .split(" ")
    .slice(0, 5)
    .join(" ");
  if (!words) return fallback;
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** Demo način: iz opisa sestavi parametrično obliko. */
export function specFromPrompt(
  prompt: string,
  settings: ModelSettings,
  targetMaxMm: number | null,
): { spec: ParametricSpec; notes: string[] } {
  const text = cleanPrompt(prompt);
  const kind = detectKind(text, settings.purpose);
  const base = DEFAULT_DIMENSIONS[kind];
  const parsed = parseDimensions(text, settings.unit);
  const notes: string[] = [];

  let w = base.w;
  let d = base.d;
  let h = base.h;
  if (parsed?.w && parsed.d) {
    w = parsed.w;
    d = parsed.d;
    h = parsed.h ?? base.h;
    notes.push("Mere smo prebrali iz opisa.");
  } else if (parsed?.h) {
    const f = parsed.h / base.h;
    w = base.w * f;
    d = base.d * f;
    h = parsed.h;
    notes.push("Višino smo prebrali iz opisa, širino in globino smo ocenili.");
  } else if (targetMaxMm) {
    const f = targetMaxMm / Math.max(base.w, base.d, base.h);
    w = base.w * f;
    d = base.d * f;
    h = base.h * f;
  }

  const supportsText = kind === "obesek" || kind === "skatla";
  const text0 = supportsText ? sanitizeEngraving(parseEngravingText(text)) : "";
  const hole =
    kind === "obesek"
      ? !/\bbrez lukn/.test(text.toLowerCase())
      : (kind === "vaza" || kind === "posoda") && mentionsHole(text);

  notes.unshift(
    `Demo način: model je sestavljen iz preproste predloge (${KIND_LABELS[kind]}), ne z umetno inteligenco.`,
  );

  return {
    spec: {
      kind,
      widthMm: clamp(w, 5, 300),
      depthMm: clamp(d, 5, 300),
      heightMm: clamp(h, kind === "obesek" ? 1.5 : 5, 300),
      wallMm: WALL_MM[settings.wall],
      hole,
      text: text0,
    },
    notes,
  };
}

/** Demo način: slika ali skica → relief (ploščica s privzdignjenimi deli). */
export async function reliefFromImage(
  file: File,
  targetMaxMm: number | null,
  invert: boolean,
): Promise<{ spec: ParametricSpec; notes: string[] }> {
  const { relief, aspect } = await imageToRelief(file, { invert });
  const size = targetMaxMm ?? 100;
  const width = aspect <= 1 ? size : size / aspect;
  const depth = aspect <= 1 ? size * aspect : size;
  return {
    spec: {
      kind: "relief",
      widthMm: width,
      depthMm: depth,
      heightMm: 5,
      wallMm: 2,
      hole: false,
      text: "",
      relief,
    },
    notes: [
      "Demo način: iz slike smo naredili relief — temnejši deli so višji. Za pravo 3D obliko iz slike je potreben ponudnik umetne inteligence.",
    ],
  };
}

/* ---------------------------------------------------------------------------
 * Ponudnik AI (prek strežnika)
 * ------------------------------------------------------------------------- */

export async function fetchProviderInfo(): Promise<ProviderInfo> {
  try {
    const response = await fetch("/api/3d/ponudnik", { cache: "no-store" });
    if (!response.ok) throw new Error();
    return (await response.json()) as ProviderInfo;
  } catch {
    return { mode: "demo", name: "Demo", supportsImages: true, maxImages: 3 };
  }
}

async function readMessage(
  response: Response,
  fallback: string,
): Promise<string> {
  try {
    const data = (await response.json()) as { message?: string };
    return data.message ?? fallback;
  } catch {
    return fallback;
  }
}

const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(new FriendlyError("Ustvarjanje je bilo prekinjeno."));
    });
  });

export async function generateWithAi(params: {
  kind: "besedilo" | "slika";
  prompt: string;
  images: File[];
  targetMaxMm: number;
  onProgress: (progress: number) => void;
  signal?: AbortSignal;
}): Promise<MeshSpec> {
  const { kind, prompt, images, onProgress, signal } = params;
  if (prompt && isBlockedContent(prompt))
    throw new FriendlyError(BLOCKED_MESSAGE);
  const dataUrls =
    kind === "slika"
      ? await Promise.all(images.slice(0, 3).map((f) => imageToDataUrl(f)))
      : [];

  const create = await fetch("/api/3d/naloge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind, prompt, images: dataUrls }),
    signal,
  }).catch(() => null);
  if (!create)
    throw new FriendlyError(
      "Povezava s strežnikom ni uspela. Preveri internetno povezavo.",
    );
  if (!create.ok) {
    throw new FriendlyError(
      await readMessage(create, "Ustvarjanja ni bilo mogoče začeti."),
    );
  }
  const { taskId } = (await create.json()) as { taskId: string };

  const started = Date.now();
  for (;;) {
    await sleep(3000, signal);
    if (Date.now() - started > 10 * 60 * 1000) {
      throw new FriendlyError(
        "Ustvarjanje traja predolgo. Poskusi znova z enostavnejšim opisom.",
      );
    }
    const status = await fetch(`/api/3d/naloge/${encodeURIComponent(taskId)}`, {
      cache: "no-store",
      signal,
    }).catch(() => null);
    if (!status) continue;
    if (!status.ok) {
      throw new FriendlyError(
        await readMessage(
          status,
          "Stanja ustvarjanja ni bilo mogoče preveriti.",
        ),
      );
    }
    const { task } = (await status.json()) as {
      task: {
        status: string;
        progress: number;
        modelUrl?: string;
        message?: string;
      };
    };
    onProgress(task.progress);
    if (task.status === "napaka") {
      throw new FriendlyError(
        task.message ?? "Modela ni bilo mogoče ustvariti.",
      );
    }
    if (task.status === "koncano") {
      let buffer: ArrayBuffer | null = null;
      if (task.modelUrl) {
        buffer = await fetch(task.modelUrl, { signal })
          .then((r) => (r.ok ? r.arrayBuffer() : null))
          .catch(() => null);
      }
      if (!buffer) {
        const proxied = await fetch(
          `/api/3d/naloge/${encodeURIComponent(taskId)}/model`,
          { signal },
        );
        if (!proxied.ok) {
          throw new FriendlyError(
            await readMessage(proxied, "Modela ni bilo mogoče prenesti."),
          );
        }
        buffer = await proxied.arrayBuffer();
      }
      return loadGlbBuffer(
        buffer,
        nameFromPrompt(prompt, "AI model"),
        params.targetMaxMm,
      );
    }
  }
}

export function parametricSource(spec: ParametricSpec): ModelSource {
  return { type: "parametric", spec, rotation: { ...NO_ROTATION } };
}
