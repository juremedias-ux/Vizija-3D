/**
 * Vmesnik za zunanje ponudnike ustvarjanja 3D modelov z umetno inteligenco.
 *
 * Ime »3DGenerationProvider« ni veljavno ime v TypeScriptu (ne sme se začeti s
 * števko), zato se vmesnik imenuje ThreeDGenerationProvider.
 */

export type GenerationKind = "besedilo" | "slika";

export interface GenerationInput {
  kind: GenerationKind;
  /** Opis predmeta (pri slikah neobvezen). */
  prompt: string;
  /** Slike kot data URL (JPEG/PNG), največ MAX_IMAGES. */
  images: string[];
}

export type TaskStatus = "v-cakalni-vrsti" | "v-teku" | "koncano" | "napaka";

export interface GenerationTask {
  id: string;
  status: TaskStatus;
  /** Napredek 0–100. */
  progress: number;
  /** Povezava do GLB, ko je naloga končana. */
  modelUrl?: string;
  /** Uporabniku razumljivo sporočilo ob napaki. */
  message?: string;
}

export interface ThreeDGenerationProvider {
  /** Kratko ime za prikaz, npr. »Meshy«. */
  readonly name: string;
  readonly supportsImages: boolean;
  readonly maxImages: number;
  createTask(input: GenerationInput): Promise<{ taskId: string }>;
  getTask(taskId: string): Promise<GenerationTask>;
}

export interface ProviderInfo {
  mode: "demo" | "ai";
  name: string;
  supportsImages: boolean;
  maxImages: number;
}

export class ProviderError extends Error {
  constructor(
    message: string,
    readonly status = 502,
  ) {
    super(message);
  }
}

export const MAX_IMAGES = 3;
/** Največja skupna velikost slik v zahtevi (Vercel omejuje telo zahteve na ~4,5 MB). */
export const MAX_IMAGES_TOTAL_CHARS = 3_500_000;
