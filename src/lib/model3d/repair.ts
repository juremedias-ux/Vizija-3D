import { indexVertices } from "./analysis";

/**
 * Osnovni samodejni popravek mreže trikotnikov:
 *  - odstrani ploskve brez površine,
 *  - odstrani podvojene ploskve,
 *  - zapre luknje v površini (vsako odprto zanko zapolni s pahljačo trikotnikov).
 * Popravek ne zagotavlja popolnega rezultata; namenjen je preprostim napakam.
 */
export interface RepairResult {
  positions: Float32Array;
  removedDegenerate: number;
  removedDuplicates: number;
  filledHoles: number;
}

export function repairPositions(input: Float32Array): RepairResult {
  const { index, vertexCount } = indexVertices(input);
  const triCount = index.length / 3;
  const verts = new Float64Array(vertexCount * 3);
  for (let v = 0; v < index.length; v += 1) {
    const id = index[v];
    verts[id * 3] = input[v * 3];
    verts[id * 3 + 1] = input[v * 3 + 1];
    verts[id * 3 + 2] = input[v * 3 + 2];
  }

  const triangles: [number, number, number][] = [];
  const seen = new Set<string>();
  let removedDegenerate = 0;
  let removedDuplicates = 0;
  for (let t = 0; t < triCount; t += 1) {
    const a = index[t * 3];
    const b = index[t * 3 + 1];
    const c = index[t * 3 + 2];
    if (a === b || b === c || a === c) {
      removedDegenerate += 1;
      continue;
    }
    const key = [a, b, c].sort((x, y) => x - y).join(",");
    if (seen.has(key)) {
      removedDuplicates += 1;
      continue;
    }
    seen.add(key);
    triangles.push([a, b, c]);
  }

  // odprti (usmerjeni) robovi: rob a→b brez nasprotnega b→a
  const directed = new Map<string, number>();
  for (const [a, b, c] of triangles) {
    for (const [u, v] of [
      [a, b],
      [b, c],
      [c, a],
    ]) {
      const key = `${u},${v}`;
      directed.set(key, (directed.get(key) ?? 0) + 1);
    }
  }
  // za vsak odprti rob u→v luknja poteka v smeri v→u
  const next = new Map<number, number>();
  for (const key of directed.keys()) {
    const [u, v] = key.split(",").map(Number);
    if (!directed.has(`${v},${u}`)) {
      // en sam naslednik na točko; zapleteni primeri se preskočijo
      if (!next.has(v)) next.set(v, u);
    }
  }

  const extra: number[] = [];
  let filledHoles = 0;
  const visited = new Set<number>();
  for (const start of next.keys()) {
    if (visited.has(start)) continue;
    const loop: number[] = [];
    let current: number | undefined = start;
    let guard = 0;
    while (current !== undefined && !visited.has(current) && guard < 20_000) {
      visited.add(current);
      loop.push(current);
      current = next.get(current);
      guard += 1;
    }
    if (current !== start || loop.length < 3) continue;
    // središče zanke
    let cx = 0;
    let cy = 0;
    let cz = 0;
    for (const id of loop) {
      cx += verts[id * 3];
      cy += verts[id * 3 + 1];
      cz += verts[id * 3 + 2];
    }
    cx /= loop.length;
    cy /= loop.length;
    cz /= loop.length;
    for (let i = 0; i < loop.length; i += 1) {
      const p = loop[i];
      const q = loop[(i + 1) % loop.length];
      extra.push(
        verts[p * 3],
        verts[p * 3 + 1],
        verts[p * 3 + 2],
        verts[q * 3],
        verts[q * 3 + 1],
        verts[q * 3 + 2],
        cx,
        cy,
        cz,
      );
    }
    filledHoles += 1;
  }

  const out = new Float32Array(triangles.length * 9 + extra.length);
  let o = 0;
  for (const [a, b, c] of triangles) {
    for (const id of [a, b, c]) {
      out[o] = verts[id * 3];
      out[o + 1] = verts[id * 3 + 1];
      out[o + 2] = verts[id * 3 + 2];
      o += 3;
    }
  }
  out.set(extra, o);
  return { positions: out, removedDegenerate, removedDuplicates, filledHoles };
}
