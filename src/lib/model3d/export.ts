import * as THREE from "three";

import type { PrintAnalysis } from "./analysis";
import { INFILL_PERCENT, type ModelSettings, WALL_MM } from "./types";

/**
 * Izvoz za 3D tisk.
 *  - STL (binarni): mm, os Z navzgor (običajno za programe za tisk).
 *  - GLB: metri, os Y navzgor (standard glTF).
 *  - ZIP: model STL + GLB + specifikacija.txt (brez stiskanja).
 */

/** Binarni STL; pretvori iz Y-navzgor v Z-navzgor. */
export function toBinaryStl(
  positions: Float32Array,
  name = "Vizija 3D",
): ArrayBuffer {
  const triCount = Math.floor(positions.length / 9);
  const buffer = new ArrayBuffer(84 + triCount * 50);
  const view = new DataView(buffer);
  const header = `Vizija 3D: ${name}`.slice(0, 79);
  for (let i = 0; i < header.length; i += 1) {
    view.setUint8(i, header.charCodeAt(i) & 0x7f);
  }
  view.setUint32(80, triCount, true);
  let offset = 84;
  const v = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  for (let t = 0; t < triCount; t += 1) {
    for (let k = 0; k < 3; k += 1) {
      const o = t * 9 + k * 3;
      // (x, y, z) Y-navzgor → (x, -z, y) Z-navzgor
      v[k * 3] = positions[o];
      v[k * 3 + 1] = -positions[o + 2];
      v[k * 3 + 2] = positions[o + 1];
    }
    const e1 = [v[3] - v[0], v[4] - v[1], v[5] - v[2]];
    const e2 = [v[6] - v[0], v[7] - v[1], v[8] - v[2]];
    let nx = e1[1] * e2[2] - e1[2] * e2[1];
    let ny = e1[2] * e2[0] - e1[0] * e2[2];
    let nz = e1[0] * e2[1] - e1[1] * e2[0];
    const len = Math.hypot(nx, ny, nz) || 1;
    nx /= len;
    ny /= len;
    nz /= len;
    view.setFloat32(offset, nx, true);
    view.setFloat32(offset + 4, ny, true);
    view.setFloat32(offset + 8, nz, true);
    offset += 12;
    for (let k = 0; k < 9; k += 1) {
      view.setFloat32(offset, v[k], true);
      offset += 4;
    }
    view.setUint16(offset, 0, true);
    offset += 2;
  }
  return buffer;
}

/** GLB (binarni glTF) v metrih. Deluje samo v brskalniku. */
export async function toGlb(
  positions: Float32Array,
  color: string,
  name: string,
): Promise<ArrayBuffer> {
  const { GLTFExporter } =
    await import("three/examples/jsm/exporters/GLTFExporter.js");
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(positions), 3),
  );
  geometry.scale(0.001, 0.001, 0.001);
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0 }),
  );
  mesh.name = name;
  const exporter = new GLTFExporter();
  const result = await exporter.parseAsync(mesh, { binary: true });
  return result as ArrayBuffer;
}

/* ---------------------------------------------------------------------------
 * ZIP (način »store«, brez stiskanja) — brez dodatnih knjižnic
 * ------------------------------------------------------------------------- */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

export function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i += 1) {
    crc = CRC_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export interface ZipEntry {
  name: string;
  data: Uint8Array;
}

function dosDateTime(date: Date): { time: number; day: number } {
  const time =
    (date.getHours() << 11) |
    (date.getMinutes() << 5) |
    Math.floor(date.getSeconds() / 2);
  const day =
    ((Math.max(1980, date.getFullYear()) - 1980) << 9) |
    ((date.getMonth() + 1) << 5) |
    date.getDate();
  return { time, day };
}

export function createZip(
  entries: ZipEntry[],
  date = new Date(),
): Uint8Array<ArrayBuffer> {
  const encoder = new TextEncoder();
  const { time, day } = dosDateTime(date);
  const locals: Uint8Array[] = [];
  const centrals: Uint8Array[] = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.name);
    const crc = crc32(entry.data);
    const size = entry.data.length;

    const local = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true);
    lv.setUint16(6, 0x0800, true); // imena v UTF-8
    lv.setUint16(8, 0, true); // brez stiskanja
    lv.setUint16(10, time, true);
    lv.setUint16(12, day, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, size, true);
    lv.setUint32(22, size, true);
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true);
    local.set(nameBytes, 30);

    const central = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(central.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, 0x0800, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, time, true);
    cv.setUint16(14, day, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, size, true);
    cv.setUint32(24, size, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint32(42, offset, true);
    central.set(nameBytes, 46);

    locals.push(local, entry.data);
    centrals.push(central);
    offset += local.length + size;
  }

  const centralSize = centrals.reduce((sum, c) => sum + c.length, 0);
  const end = new Uint8Array(22);
  const ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(8, entries.length, true);
  ev.setUint16(10, entries.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);

  const total = offset + centralSize + end.length;
  const out = new Uint8Array(new ArrayBuffer(total));
  let p = 0;
  for (const part of [...locals, ...centrals, end]) {
    out.set(part, p);
    p += part.length;
  }
  return out;
}

/* ---------------------------------------------------------------------------
 * Specifikacija za tisk
 * ------------------------------------------------------------------------- */

const MATERIAL_HINT = (settings: ModelSettings): string => {
  if (settings.strength === "mocna" || settings.purpose === "popravilo")
    return "PETG (trdnejši in bolj obstojen)";
  return "PLA (najpreprostejši za tisk)";
};

export function suggestedMaterial(settings: ModelSettings): string {
  return MATERIAL_HINT(settings);
}

const SURFACE_LABEL: Record<ModelSettings["surface"], string> = {
  mat: "mat",
  sijajna: "sijajna",
  groba: "groba",
  gladka: "gladka",
};

export function slugify(name: string): string {
  return (
    name
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "model"
  );
}

export function buildSpecText(params: {
  name: string;
  analysis: PrintAnalysis;
  settings: ModelSettings;
  formats: string[];
  date?: Date;
}): string {
  const { name, analysis, settings, formats } = params;
  const date = params.date ?? new Date();
  const mm = (value: number) =>
    new Intl.NumberFormat("sl-SI", { maximumFractionDigits: 1 }).format(value);
  const lines = [
    "SPECIFIKACIJA ZA 3D TISK — Vizija 3D",
    "====================================",
    "",
    `Ime modela: ${name}`,
    `Datum: ${date.toLocaleDateString("sl-SI")}`,
    `Formati v paketu: ${formats.join(", ")}`,
    "",
    `Mere (širina × globina × višina): ${mm(analysis.size.x)} × ${mm(analysis.size.z)} × ${mm(analysis.size.y)} mm`,
    `Število trikotnikov: ${analysis.triangles}`,
    `Predlagan material: ${MATERIAL_HINT(settings)}`,
    `Površina (predlog): ${SURFACE_LABEL[settings.surface]}`,
    `Priporočena debelina stene: ${mm(WALL_MM[settings.wall])} mm`,
    `Priporočena polnitev: ${INFILL_PERCENT[settings.strength]} %`,
    `Podpore: ${analysis.supportsRecommended ? "priporočene (samodejne podpore v programu za tisk)" : "verjetno niso potrebne"}`,
    "",
    "Preverjanja:",
    ...analysis.checks.map(
      (c) => `- [${c.status.toUpperCase()}] ${c.title}: ${c.message}`,
    ),
    "",
    "Opombe za tisk:",
    "- STL je v milimetrih, os Z kaže navzgor.",
    "- GLB je v metrih (standard glTF), os Y kaže navzgor.",
    "- Pred tiskom preveri dimenzije, debelino sten in geometrijo modela.",
  ];
  if (
    settings.purpose === "funkcionalen" ||
    settings.purpose === "popravilo" ||
    settings.purpose === "organizator"
  ) {
    lines.push(
      "- Model morda ni dovolj natančen za funkcionalne ali mehanske dele; za natančne dele uporabi CAD.",
    );
  }
  return lines.join("\r\n");
}

/** Sproži prenos datoteke v brskalniku. */
export function downloadBlob(
  data: BlobPart,
  fileName: string,
  type: string,
): void {
  const blob = new Blob([data], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
