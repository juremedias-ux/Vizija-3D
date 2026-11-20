import * as THREE from "three";

import { isBlockedContent } from "./prompt";
import type { MeshSpec, ReliefData } from "./types";

/** Uporabniku razumljiva napaka (prikaže se v vmesniku). */
export class FriendlyError extends Error {}

export const MAX_MODEL_BYTES = 60 * 1024 * 1024;
export const MAX_TRIANGLES = 1_000_000;
export const MAX_IMAGE_BYTES = 15 * 1024 * 1024;

export type ModelFormat = "stl" | "obj" | "glb";

export function modelFormat(fileName: string): ModelFormat | null {
  const ext = fileName.toLowerCase().split(".").pop();
  if (ext === "stl") return "stl";
  if (ext === "obj") return "obj";
  if (ext === "glb" || ext === "gltf") return "glb";
  return null;
}

function collectPositions(object: THREE.Object3D): Float32Array {
  object.updateMatrixWorld(true);
  const chunks: Float32Array[] = [];
  object.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh || !mesh.geometry) return;
    let geometry = mesh.geometry.clone();
    if (geometry.index) geometry = geometry.toNonIndexed();
    geometry.applyMatrix4(mesh.matrixWorld);
    chunks.push(geometry.getAttribute("position").array as Float32Array);
  });
  const total = chunks.reduce((sum, c) => sum + c.length, 0);
  const out = new Float32Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

/**
 * Prebere naloženo datoteko 3D modela in vrne osnovno geometrijo v mm (Y navzgor).
 * STL: mm, Z navzgor. OBJ: mm, Y navzgor. GLB: metri, Y navzgor.
 */
export async function loadModelFile(
  file: File,
  targetSizeMm = 80,
): Promise<{ spec: MeshSpec; notes: string[] }> {
  if (isBlockedContent(file.name)) {
    throw new FriendlyError(
      "Ime datoteke kaže na prepovedano vsebino. Platforma ne dovoli orožja ali drugih nevarnih predmetov.",
    );
  }
  const format = modelFormat(file.name);
  if (!format) {
    throw new FriendlyError(
      "Podprte so datoteke STL, OBJ in GLB. Izberi datoteko s tako končnico.",
    );
  }
  if (file.size > MAX_MODEL_BYTES) {
    throw new FriendlyError(
      "Datoteka je večja od 60 MB. Zmanjšaj število ploskev v programu, v katerem je model nastal, ali izberi manjšo datoteko.",
    );
  }
  if (file.size === 0) throw new FriendlyError("Datoteka je prazna.");

  let positions: Float32Array;
  const notes: string[] = [];
  try {
    if (format === "stl") {
      const { STLLoader } =
        await import("three/examples/jsm/loaders/STLLoader.js");
      const geometry = new STLLoader().parse(await file.arrayBuffer());
      geometry.rotateX(-Math.PI / 2); // Z navzgor → Y navzgor
      positions = (
        geometry.index ? geometry.toNonIndexed() : geometry
      ).getAttribute("position").array as Float32Array;
    } else if (format === "obj") {
      const { OBJLoader } =
        await import("three/examples/jsm/loaders/OBJLoader.js");
      positions = collectPositions(new OBJLoader().parse(await file.text()));
    } else {
      const { GLTFLoader } =
        await import("three/examples/jsm/loaders/GLTFLoader.js");
      const gltf = await new GLTFLoader().parseAsync(
        await file.arrayBuffer(),
        "",
      );
      positions = collectPositions(gltf.scene);
      for (let i = 0; i < positions.length; i += 1) positions[i] *= 1000; // m → mm
    }
  } catch {
    throw new FriendlyError(
      "Datoteke ni bilo mogoče prebrati. Morda je poškodovana ali v nepodprti obliki. Poskusi jo znova shraniti kot STL ali GLB.",
    );
  }

  const triangles = Math.floor(positions.length / 9);
  if (triangles === 0) {
    throw new FriendlyError(
      "V datoteki ni bilo mogoče najti nobene ploskve modela.",
    );
  }
  if (triangles > MAX_TRIANGLES) {
    throw new FriendlyError(
      "Model ima več kot milijon ploskev, zato ga brskalnik ne more urejati. Poenostavi ga in poskusi znova.",
    );
  }
  for (let i = 0; i < positions.length; i += 1) {
    if (!Number.isFinite(positions[i])) {
      throw new FriendlyError(
        "Datoteka vsebuje neveljavne koordinate. Shrani jo znova v programu za 3D modeliranje.",
      );
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.computeBoundingBox();
  const box = geometry.boundingBox!;
  const size = new THREE.Vector3();
  box.getSize(size);
  const maxDim = Math.max(size.x, size.y, size.z);
  let scale = 1;
  if (maxDim < 2 || maxDim > 2000) {
    scale = targetSizeMm / maxDim;
    notes.push(
      `Velikost modela je bila nenavadna (${new Intl.NumberFormat("sl-SI", { maximumFractionDigits: 2 }).format(maxDim)} mm), zato smo ga prilagodili na ${targetSizeMm} mm. Preveri mere.`,
    );
  }
  geometry.translate(
    -(box.min.x + box.max.x) / 2,
    -box.min.y,
    -(box.min.z + box.max.z) / 2,
  );
  if (scale !== 1) geometry.scale(scale, scale, scale);
  const finalPositions = new Float32Array(
    geometry.getAttribute("position").array,
  );
  const base = { x: size.x * scale, y: size.y * scale, z: size.z * scale };

  return {
    spec: {
      positions: finalPositions,
      baseSize: base,
      widthMm: base.x,
      heightMm: base.y,
      depthMm: base.z,
      origin: "nalozen",
      fileName: file.name,
    },
    notes,
  };
}

/* ---------------------------------------------------------------------------
 * Slika → relief (višinska mreža)
 * ------------------------------------------------------------------------- */

export const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];

export function validateImageFile(file: File): void {
  if (!IMAGE_TYPES.includes(file.type)) {
    throw new FriendlyError("Podprte so slike PNG, JPG in WEBP.");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new FriendlyError("Slika je večja od 15 MB. Izberi manjšo sliko.");
  }
  if (isBlockedContent(file.name)) {
    throw new FriendlyError(
      "Ime datoteke kaže na prepovedano vsebino. Platforma ne dovoli orožja ali drugih nevarnih predmetov.",
    );
  }
}

async function loadImage(
  file: File | Blob,
): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file);
    } catch {
      // nadaljuj z rezervno potjo
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Pretvori sliko v višinsko mrežo: temnejši deli so višji (primerno za skice in risbe),
 * ob »invert« so višji svetlejši deli.
 */
export async function imageToRelief(
  file: File | Blob,
  options: { resolution?: number; invert?: boolean } = {},
): Promise<{ relief: ReliefData; aspect: number }> {
  let image: ImageBitmap | HTMLImageElement;
  try {
    image = await loadImage(file);
  } catch {
    throw new FriendlyError(
      "Slike ni bilo mogoče odpreti. Poskusi z drugo datoteko PNG ali JPG.",
    );
  }
  const width = "naturalWidth" in image ? image.naturalWidth : image.width;
  const height = "naturalHeight" in image ? image.naturalHeight : image.height;
  if (!width || !height) throw new FriendlyError("Slika je prazna.");
  const resolution = options.resolution ?? 120;
  const scale = resolution / Math.max(width, height);
  const cols = Math.max(8, Math.round(width * scale));
  const rows = Math.max(8, Math.round(height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = cols;
  canvas.height = rows;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new FriendlyError("Brskalnik ne podpira obdelave slik.");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, cols, rows);
  ctx.drawImage(image as CanvasImageSource, 0, 0, cols, rows);
  const { data } = ctx.getImageData(0, 0, cols, rows);
  const values: number[] = new Array(cols * rows);
  let min = 255;
  let max = 0;
  for (let i = 0; i < cols * rows; i += 1) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const v = options.invert ? lum : 255 - lum;
    values[i] = v;
    if (v < min) min = v;
    if (v > max) max = v;
  }
  const range = Math.max(1, max - min);
  for (let i = 0; i < values.length; i += 1) {
    values[i] = Math.round(((values[i] - min) / range) * 255);
  }
  return { relief: { cols, rows, values }, aspect: rows / cols };
}

/** Pomanjša sliko za pošiljanje ponudniku AI (JPEG, največ 1024 px). */
export async function imageToDataUrl(
  file: File,
  maxSide = 1024,
  quality = 0.82,
): Promise<string> {
  const image = await loadImage(file);
  const width = "naturalWidth" in image ? image.naturalWidth : image.width;
  const height = "naturalHeight" in image ? image.naturalHeight : image.height;
  const scale = Math.min(1, maxSide / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new FriendlyError("Brskalnik ne podpira obdelave slik.");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(image as CanvasImageSource, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", quality);
}

/**
 * Prebere GLB, ki ga je vrnil ponudnik AI, in ga prilagodi na želeno največjo mero
 * (modeli AI nimajo zanesljivih enot).
 */
export async function loadGlbBuffer(
  buffer: ArrayBuffer,
  name: string,
  targetMaxMm: number,
): Promise<MeshSpec> {
  const file = new File([buffer], "model.glb", { type: "model/gltf-binary" });
  const { spec } = await loadModelFile(file, targetMaxMm);
  const maxDim =
    Math.max(spec.baseSize.x, spec.baseSize.y, spec.baseSize.z) || 1;
  const f = targetMaxMm / maxDim;
  return {
    ...spec,
    widthMm: spec.baseSize.x * f,
    heightMm: spec.baseSize.y * f,
    depthMm: spec.baseSize.z * f,
    origin: "ai",
    fileName: name,
  };
}
