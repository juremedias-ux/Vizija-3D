/** Skupni tipi 3D ustvarjalnika (Studio). Vse mere so v milimetrih. */

export type CreationMode = "besedilo" | "slika" | "model";

export type SizeUnit = "mm" | "cm";

export type Purpose =
  | "dekoracija"
  | "funkcionalen"
  | "figura"
  | "organizator"
  | "darilo"
  | "popravilo";

export type Surface = "mat" | "sijajna" | "groba" | "gladka";

export type Strength = "lahka" | "obicajna" | "mocna";

export type WallChoice = "tanko" | "obicajno" | "debelo";

export interface ModelSettings {
  unit: SizeUnit;
  purpose: Purpose;
  surface: Surface;
  /** Barva samo za predogled (hex). */
  color: string;
  strength: Strength;
  wall: WallChoice;
}

export const DEFAULT_SETTINGS: ModelSettings = {
  unit: "cm",
  purpose: "dekoracija",
  surface: "mat",
  color: "#38c8ff",
  strength: "obicajna",
  wall: "obicajno",
};

/** Debelina stene v mm za izbiro »tanko / običajno / debelo«. */
export const WALL_MM: Record<WallChoice, number> = {
  tanko: 1.2,
  obicajno: 2,
  debelo: 3.2,
};

/** Priporočena polnitev pri tisku za izbrano trdnost. */
export const INFILL_PERCENT: Record<Strength, number> = {
  lahka: 10,
  obicajna: 20,
  mocna: 40,
};

/** Oblike, ki jih demo način zna sestaviti iz opisa. */
export type TemplateKind =
  | "posoda"
  | "skatla"
  | "vaza"
  | "obesek"
  | "stojalo"
  | "figura"
  | "relief";

export interface ReliefData {
  cols: number;
  rows: number;
  /** Višine 0–255 (vrstica za vrstico). */
  values: number[];
}

/** Parametrična oblika: vsak poseg jo zgradi znova, zato so spremembe takoj vidne. */
export interface ParametricSpec {
  kind: TemplateKind;
  widthMm: number;
  depthMm: number;
  heightMm: number;
  wallMm: number;
  hole: boolean;
  text: string;
  relief?: ReliefData;
}

export interface Rotation {
  x: number;
  y: number;
  z: number;
}

/** Model iz naložene datoteke ali od ponudnika AI (poljubna mreža trikotnikov). */
export interface MeshSpec {
  /** Osnovna geometrija v mm (Y je navzgor), shranjena kot ploski seznam koordinat. */
  positions: Float32Array;
  /** Mere osnovne geometrije v mm. */
  baseSize: { x: number; y: number; z: number };
  /** Želene mere v mm. */
  widthMm: number;
  depthMm: number;
  heightMm: number;
  origin: "nalozen" | "ai";
  fileName: string;
}

export type ModelSource =
  | { type: "parametric"; spec: ParametricSpec; rotation: Rotation }
  | { type: "mesh"; spec: MeshSpec; rotation: Rotation };

export const NO_ROTATION: Rotation = { x: 0, y: 0, z: 0 };

/** Velikost tiskalne plošče za preverjanje (tipičen hobi tiskalnik). */
export const BUILD_VOLUME_MM = { x: 220, y: 250, z: 220 };
