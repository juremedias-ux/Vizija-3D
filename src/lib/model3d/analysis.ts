import type * as THREE from "three";

import { BUILD_VOLUME_MM } from "./types";

/**
 * Osnovno preverjanje tiskalnosti. Preverjanja so namenoma preprosta in
 * hitra; za natančno analizo je še vedno potreben program za tisk (slicer).
 */

export type CheckStatus = "ok" | "info" | "opozorilo" | "napaka";

export interface PrintCheck {
  id:
    | "zaprtost"
    | "povezanost"
    | "usmerjenost"
    | "stene"
    | "velikost"
    | "napake"
    | "datoteka"
    | "podpore"
    | "deli";
  status: CheckStatus;
  title: string;
  message: string;
}

export interface PrintAnalysis {
  size: { x: number; y: number; z: number };
  triangles: number;
  shells: number;
  openEdges: number;
  nonManifoldEdges: number;
  flippedEdges: number;
  degenerateTriangles: number;
  /** Ocenjena najmanjša debelina stene (mm) ali null, če ni bila izračunana. */
  thinWallMm: number | null;
  overhangRatio: number;
  supportsRecommended: boolean;
  stlBytes: number;
  checks: PrintCheck[];
  /** true, če nobeno preverjanje ni »napaka« ali »opozorilo«. */
  ready: boolean;
}

const MIN_WALL_MM = 0.8;
const MIN_SIZE_MM = 10;
const LARGE_FILE_BYTES = 50 * 1024 * 1024;

/** Združi enake točke in vrne indekse trikotnikov. */
export function indexVertices(positions: ArrayLike<number>): {
  index: Uint32Array;
  vertexCount: number;
} {
  const map = new Map<string, number>();
  const triCount = Math.floor(positions.length / 9);
  const index = new Uint32Array(triCount * 3);
  let next = 0;
  for (let v = 0; v < triCount * 3; v += 1) {
    const x = Math.round(positions[v * 3] * 1000);
    const y = Math.round(positions[v * 3 + 1] * 1000);
    const z = Math.round(positions[v * 3 + 2] * 1000);
    const key = `${x},${y},${z}`;
    let id = map.get(key);
    if (id === undefined) {
      id = next;
      next += 1;
      map.set(key, id);
    }
    index[v] = id;
  }
  return { index, vertexCount: next };
}

interface EdgeStats {
  openEdges: number;
  nonManifoldEdges: number;
  flippedEdges: number;
  shells: number;
  degenerate: number;
}

export function edgeStats(positions: ArrayLike<number>): EdgeStats {
  const { index, vertexCount } = indexVertices(positions);
  const triCount = index.length / 3;
  const undirected = new Map<number, number>();
  const directed = new Map<number, number>();
  const parent = new Int32Array(vertexCount);
  for (let i = 0; i < vertexCount; i += 1) parent[i] = i;
  const find = (a: number): number => {
    while (parent[a] !== a) {
      parent[a] = parent[parent[a]];
      a = parent[a];
    }
    return a;
  };
  const union = (a: number, b: number) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent[ra] = rb;
  };

  let degenerate = 0;
  const used = new Uint8Array(vertexCount);
  for (let t = 0; t < triCount; t += 1) {
    const a = index[t * 3];
    const b = index[t * 3 + 1];
    const c = index[t * 3 + 2];
    if (a === b || b === c || a === c) {
      degenerate += 1;
      continue;
    }
    used[a] = 1;
    used[b] = 1;
    used[c] = 1;
    union(a, b);
    union(b, c);
    for (const [u, v] of [
      [a, b],
      [b, c],
      [c, a],
    ]) {
      const key = Math.min(u, v) * vertexCount + Math.max(u, v);
      undirected.set(key, (undirected.get(key) ?? 0) + 1);
      const dkey = u * vertexCount + v;
      directed.set(dkey, (directed.get(dkey) ?? 0) + 1);
    }
  }
  let openEdges = 0;
  let nonManifoldEdges = 0;
  for (const count of undirected.values()) {
    if (count === 1) openEdges += 1;
    else if (count > 2) nonManifoldEdges += 1;
  }
  let flippedEdges = 0;
  for (const count of directed.values()) if (count > 1) flippedEdges += 1;

  const roots = new Set<number>();
  for (let i = 0; i < vertexCount; i += 1) if (used[i]) roots.add(find(i));

  return {
    openEdges,
    nonManifoldEdges,
    flippedEdges,
    shells: roots.size,
    degenerate,
  };
}

/**
 * Oceni najmanjšo debelino stene: iz vzorca ploskev pošlje žarek v notranjost
 * in izmeri razdaljo do nasprotne ploskve. Vrne 10. percentil izmerjenih razdalj.
 */
export function estimateMinWall(
  positions: Float32Array,
  maxTests = 6_000_000,
): number | null {
  const triCount = Math.floor(positions.length / 9);
  if (triCount < 4) return null;
  const samples = Math.max(30, Math.min(300, Math.floor(maxTests / triCount)));
  const step = Math.max(1, Math.floor(triCount / samples));
  const distances: number[] = [];
  const eps = 1e-6;

  for (let s = 0; s < triCount; s += step) {
    const o = s * 9;
    const ax = positions[o],
      ay = positions[o + 1],
      az = positions[o + 2];
    const bx = positions[o + 3],
      by = positions[o + 4],
      bz = positions[o + 5];
    const cx = positions[o + 6],
      cy = positions[o + 7],
      cz = positions[o + 8];
    const e1x = bx - ax,
      e1y = by - ay,
      e1z = bz - az;
    const e2x = cx - ax,
      e2y = cy - ay,
      e2z = cz - az;
    let nx = e1y * e2z - e1z * e2y;
    let ny = e1z * e2x - e1x * e2z;
    let nz = e1x * e2y - e1y * e2x;
    const len = Math.hypot(nx, ny, nz);
    if (len < 1e-9) continue;
    nx /= len;
    ny /= len;
    nz /= len;
    // žarek iz središča trikotnika proti notranjosti
    const dx = -nx,
      dy = -ny,
      dz = -nz;
    const px = (ax + bx + cx) / 3 + dx * 1e-3;
    const py = (ay + by + cy) / 3 + dy * 1e-3;
    const pz = (az + bz + cz) / 3 + dz * 1e-3;

    let best = Infinity;
    for (let t = 0; t < triCount; t += 1) {
      if (t === s) continue;
      const q = t * 9;
      const v0x = positions[q],
        v0y = positions[q + 1],
        v0z = positions[q + 2];
      const f1x = positions[q + 3] - v0x,
        f1y = positions[q + 4] - v0y,
        f1z = positions[q + 5] - v0z;
      const f2x = positions[q + 6] - v0x,
        f2y = positions[q + 7] - v0y,
        f2z = positions[q + 8] - v0z;
      const hx = dy * f2z - dz * f2y;
      const hy = dz * f2x - dx * f2z;
      const hz = dx * f2y - dy * f2x;
      const a = f1x * hx + f1y * hy + f1z * hz;
      if (a > -eps && a < eps) continue;
      const f = 1 / a;
      const sx = px - v0x,
        sy = py - v0y,
        sz = pz - v0z;
      const u = f * (sx * hx + sy * hy + sz * hz);
      if (u < 0 || u > 1) continue;
      const qx = sy * f1z - sz * f1y;
      const qy = sz * f1x - sx * f1z;
      const qz = sx * f1y - sy * f1x;
      const v = f * (dx * qx + dy * qy + dz * qz);
      if (v < 0 || u + v > 1) continue;
      const dist = f * (f2x * qx + f2y * qy + f2z * qz);
      if (dist > 1e-4 && dist < best) best = dist;
    }
    if (Number.isFinite(best)) distances.push(best);
  }
  if (!distances.length) return null;
  distances.sort((a, b) => a - b);
  return distances[Math.floor(distances.length * 0.1)];
}

function overhang(
  positions: Float32Array,
  minY: number,
): {
  ratio: number;
} {
  const triCount = Math.floor(positions.length / 9);
  let total = 0;
  let down = 0;
  const limit = -Math.cos((45 * Math.PI) / 180);
  for (let t = 0; t < triCount; t += 1) {
    const o = t * 9;
    const e1x = positions[o + 3] - positions[o];
    const e1y = positions[o + 4] - positions[o + 1];
    const e1z = positions[o + 5] - positions[o + 2];
    const e2x = positions[o + 6] - positions[o];
    const e2y = positions[o + 7] - positions[o + 1];
    const e2z = positions[o + 8] - positions[o + 2];
    const nx = e1y * e2z - e1z * e2y;
    const ny = e1z * e2x - e1x * e2z;
    const nz = e1x * e2y - e1y * e2x;
    const area2 = Math.hypot(nx, ny, nz);
    if (area2 < 1e-12) continue;
    total += area2;
    const centroidY =
      (positions[o + 1] + positions[o + 4] + positions[o + 7]) / 3;
    if (ny / area2 < limit && centroidY > minY + 0.5) down += area2;
  }
  return { ratio: total > 0 ? down / total : 0 };
}

/** Slovenska dvojina in množina: 1 del, 2 dela, 3 deli, 5 delov. */
export function partsLabel(count: number): string {
  const mod = count % 100;
  if (mod === 1) return `${count} del`;
  if (mod === 2) return `${count} dela`;
  if (mod === 3 || mod === 4) return `${count} dele`;
  return `${count} delov`;
}

const fmt = (value: number) =>
  new Intl.NumberFormat("sl-SI", { maximumFractionDigits: 1 }).format(value);

export function analyzeGeometry(
  geometry: THREE.BufferGeometry,
  options: { recommendedWallMm?: number; knownWallMm?: number } = {},
): PrintAnalysis {
  const positions = geometry.getAttribute("position").array as Float32Array;
  geometry.computeBoundingBox();
  const box = geometry.boundingBox!;
  const size = {
    x: box.max.x - box.min.x,
    y: box.max.y - box.min.y,
    z: box.max.z - box.min.z,
  };
  const triangles = Math.floor(positions.length / 9);
  const edges = edgeStats(positions);
  const thinWallMm = options.knownWallMm ?? estimateMinWall(positions);
  const { ratio } = overhang(positions, box.min.y);
  const supportsRecommended = ratio > 0.02;
  const stlBytes = 84 + triangles * 50;

  const checks: PrintCheck[] = [];
  checks.push(
    edges.openEdges === 0
      ? {
          id: "zaprtost",
          status: "ok",
          title: "Površina je zaprta",
          message: "Model nima lukenj v površini.",
        }
      : {
          id: "zaprtost",
          status: "napaka",
          title: "Površina ima luknje",
          message: `Model ima odprto geometrijo (${edges.openEdges} odprtih robov). Za 3D tisk ga je treba zapreti.`,
        },
  );
  checks.push(
    edges.nonManifoldEdges === 0
      ? {
          id: "povezanost",
          status: "ok",
          title: "Geometrija je pravilno povezana",
          message: "Vsak rob povezuje natanko dve ploskvi.",
        }
      : {
          id: "povezanost",
          status: "napaka",
          title: "Geometrija je nepovezana",
          message: `Model ima nepovezano ali prepleteno geometrijo (${edges.nonManifoldEdges} spornih robov). Za 3D tisk ga je treba popraviti.`,
        },
  );
  if (edges.flippedEdges > 0) {
    checks.push({
      id: "usmerjenost",
      status: "opozorilo",
      title: "Nekatere ploskve so obrnjene",
      message:
        "Del površine je obrnjen navznoter. Program za tisk to pogosto popravi sam, a rezultat preveri.",
    });
  }
  if (thinWallMm === null) {
    checks.push({
      id: "stene",
      status: "info",
      title: "Debelina sten ni izmerjena",
      message:
        "Debeline sten pri tem modelu ni bilo mogoče oceniti. Preveri jo v programu za tisk.",
    });
  } else if (thinWallMm < MIN_WALL_MM) {
    checks.push({
      id: "stene",
      status: "opozorilo",
      title: "Pretanke stene",
      message: `Najtanjši deli so debeli približno ${fmt(thinWallMm)} mm. Stene, tanjše od ${fmt(MIN_WALL_MM)} mm, se morda ne bodo natisnile.`,
    });
  } else {
    checks.push({
      id: "stene",
      status: "ok",
      title: "Debelina sten je primerna",
      message: `Najtanjši deli so debeli približno ${fmt(thinWallMm)} mm${
        options.recommendedWallMm
          ? ` (priporočeno vsaj ${fmt(options.recommendedWallMm)} mm)`
          : ""
      }.`,
    });
  }
  const tooBig =
    size.x > BUILD_VOLUME_MM.x ||
    size.z > BUILD_VOLUME_MM.z ||
    size.y > BUILD_VOLUME_MM.y;
  const maxDim = Math.max(size.x, size.y, size.z);
  if (tooBig) {
    checks.push({
      id: "velikost",
      status: "napaka",
      title: "Model je prevelik",
      message: `Model je večji od tipične tiskalne plošče (${BUILD_VOLUME_MM.x} × ${BUILD_VOLUME_MM.z} × ${BUILD_VOLUME_MM.y} mm). Pomanjšaj ga ali ga razdeli.`,
    });
  } else if (maxDim < MIN_SIZE_MM) {
    checks.push({
      id: "velikost",
      status: "opozorilo",
      title: "Model je zelo majhen",
      message: `Največja mera je ${fmt(maxDim)} mm. Tako majhni deli se težko natisnejo; preveri, ali je velikost prava.`,
    });
  } else {
    checks.push({
      id: "velikost",
      status: "ok",
      title: "Velikost je primerna",
      message: "Model se prilega tipični tiskalni plošči.",
    });
  }
  if (edges.degenerate > 0) {
    checks.push({
      id: "napake",
      status: "opozorilo",
      title: "Drobne napake v geometriji",
      message: `Model ima ${edges.degenerate} ploskev brez površine. Samodejni popravek jih odstrani.`,
    });
  }
  if (stlBytes > LARGE_FILE_BYTES) {
    checks.push({
      id: "datoteka",
      status: "opozorilo",
      title: "Velika datoteka",
      message:
        "Datoteka bo velika, zato jo bodo nekateri programi nalagali počasi.",
    });
  }
  checks.push(
    supportsRecommended
      ? {
          id: "podpore",
          status: "info",
          title: "Priporočamo podpore",
          message:
            "Nekateri deli visijo v zraku. V programu za tisk vklopi samodejne podpore.",
        }
      : {
          id: "podpore",
          status: "ok",
          title: "Podpore verjetno niso potrebne",
          message: "Model nima večjih previsov.",
        },
  );
  if (edges.shells > 1) {
    checks.push({
      id: "deli",
      status: "info",
      title: `Model ima ${partsLabel(edges.shells)}`,
      message:
        "Deli se prekrivajo ali stikajo; program za tisk jih združi v en predmet.",
    });
  }

  const ready = checks.every((c) => c.status === "ok" || c.status === "info");
  return {
    size,
    triangles,
    shells: edges.shells,
    openEdges: edges.openEdges,
    nonManifoldEdges: edges.nonManifoldEdges,
    flippedEdges: edges.flippedEdges,
    degenerateTriangles: edges.degenerate,
    thinWallMm,
    overhangRatio: ratio,
    supportsRecommended,
    stlBytes,
    checks,
    ready,
  };
}
