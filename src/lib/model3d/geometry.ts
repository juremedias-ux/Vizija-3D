import * as THREE from "three";

import { textRuns } from "./pixelFont";
import type {
  ModelSource,
  ParametricSpec,
  ReliefData,
  Rotation,
} from "./types";

/**
 * Gradnja zaprtih (tiskalnih) oblik iz parametrov. Vse mere so v milimetrih,
 * os Y kaže navzgor. Rezultat je vedno neindeksiran seznam trikotnikov.
 */

type Vec2 = [number, number];
type Vec3 = [number, number, number];

/** Zbiralnik trikotnikov z usmerjanjem normal proti želeni smeri. */
class TriangleSink {
  readonly data: number[] = [];

  /** Doda trikotnik; če njegova normala kaže proti »want«, ga obrne. */
  add(a: Vec3, b: Vec3, c: Vec3, want: Vec3): void {
    const ux = b[0] - a[0];
    const uy = b[1] - a[1];
    const uz = b[2] - a[2];
    const vx = c[0] - a[0];
    const vy = c[1] - a[1];
    const vz = c[2] - a[2];
    const nx = uy * vz - uz * vy;
    const ny = uz * vx - ux * vz;
    const nz = ux * vy - uy * vx;
    const dot = nx * want[0] + ny * want[1] + nz * want[2];
    if (dot >= 0) this.data.push(...a, ...b, ...c);
    else this.data.push(...a, ...c, ...b);
  }

  quad(a: Vec3, b: Vec3, c: Vec3, d: Vec3, want: Vec3): void {
    this.add(a, b, c, want);
    this.add(a, c, d, want);
  }

  /** Ploskev mnogokotnika (z luknjami) na višini y, normala gor ali dol. */
  polygon(outer: Vec2[], holes: Vec2[][], y: number, up: boolean): void {
    const contour = outer.map(([x, z]) => new THREE.Vector2(x, z));
    const holeVectors = holes.map((hole) =>
      hole.map(([x, z]) => new THREE.Vector2(x, z)),
    );
    const all = [...outer, ...holes.flat()];
    const faces = THREE.ShapeUtils.triangulateShape(contour, holeVectors);
    const want: Vec3 = [0, up ? 1 : -1, 0];
    for (const [i, j, k] of faces) {
      this.add(
        [all[i][0], y, all[i][1]],
        [all[j][0], y, all[j][1]],
        [all[k][0], y, all[k][1]],
        want,
      );
    }
  }

  toGeometry(): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(this.data, 3),
    );
    geometry.computeVertexNormals();
    return geometry;
  }
}

/** Obris zaobljenega pravokotnika s stalnim številom točk (za ujemanje obročev). */
export function roundedRectOutline(
  width: number,
  depth: number,
  radius: number,
  segments = 6,
): Vec2[] {
  const r = Math.max(
    0.01,
    Math.min(radius, width / 2 - 0.01, depth / 2 - 0.01),
  );
  const hw = width / 2 - r;
  const hd = depth / 2 - r;
  const corners: [number, number, number][] = [
    [hw, hd, 0],
    [-hw, hd, Math.PI / 2],
    [-hw, -hd, Math.PI],
    [hw, -hd, (3 * Math.PI) / 2],
  ];
  const points: Vec2[] = [];
  for (const [cx, cz, start] of corners) {
    for (let i = 0; i <= segments; i += 1) {
      const angle = start + (i / segments) * (Math.PI / 2);
      points.push([cx + r * Math.cos(angle), cz + r * Math.sin(angle)]);
    }
  }
  return points;
}

export function ellipseOutline(
  width: number,
  depth: number,
  segments = 48,
): Vec2[] {
  const points: Vec2[] = [];
  for (let i = 0; i < segments; i += 1) {
    const angle = (i / segments) * Math.PI * 2;
    points.push([(width / 2) * Math.cos(angle), (depth / 2) * Math.sin(angle)]);
  }
  return points;
}

function radialWant(
  a: Vec2,
  b: Vec2,
  sign: 1 | -1,
  center: Vec2 = [0, 0],
): Vec3 {
  const mx = (a[0] + b[0]) / 2 - center[0];
  const mz = (a[1] + b[1]) / 2 - center[1];
  return [mx * sign, 0, mz * sign];
}

interface CupOptions {
  /** Obris pri dani širini in globini (vedno enako število točk). */
  outline: (width: number, depth: number) => Vec2[];
  width: number;
  depth: number;
  height: number;
  wall: number;
  floor: number;
  /** Merilo obrisa glede na relativno višino 0–1 (oblika vaze). */
  profile?: (t: number) => number;
  rings?: number;
  /** Polmer luknje v dnu (npr. za odtok) ali 0. */
  holeRadius?: number;
}

/** Odprta posoda z dnom in stenami: ena zaprta (vodotesna) lupina. */
export function buildCup(options: CupOptions): THREE.BufferGeometry {
  const { outline, width, depth, height, floor } = options;
  const wall = Math.min(options.wall, width / 2 - 1, depth / 2 - 1);
  const profile = options.profile ?? (() => 1);
  const rings = Math.max(1, options.rings ?? 1);
  const sink = new TriangleSink();

  const outerAt = (t: number) => {
    const s = profile(t);
    return outline(width * s, depth * s);
  };
  const innerAt = (t: number) => {
    const s = profile(t);
    return outline(
      Math.max(1, width * s - 2 * wall),
      Math.max(1, depth * s - 2 * wall),
    );
  };

  const outerHeights = Array.from(
    { length: rings + 1 },
    (_, i) => (i / rings) * height,
  );
  const floorT = floor / height;
  const innerHeights = [floor, ...outerHeights.filter((y) => y > floor + 0.01)];

  const outerRings = outerHeights.map((y) => ({
    y,
    points: outerAt(y / height),
  }));
  const innerRings = innerHeights.map((y) => ({
    y,
    points: innerAt(Math.max(y / height, floorT)),
  }));

  const holeRadius = options.holeRadius ?? 0;
  const hole: Vec2[] =
    holeRadius > 0 ? ellipseOutline(holeRadius * 2, holeRadius * 2, 24) : [];

  // dno (zunaj)
  sink.polygon(outerRings[0].points, hole.length ? [hole] : [], 0, false);
  // zunanja stena
  for (let k = 0; k < outerRings.length - 1; k += 1) {
    const lower = outerRings[k];
    const upper = outerRings[k + 1];
    const n = lower.points.length;
    for (let i = 0; i < n; i += 1) {
      const j = (i + 1) % n;
      sink.quad(
        [lower.points[i][0], lower.y, lower.points[i][1]],
        [lower.points[j][0], lower.y, lower.points[j][1]],
        [upper.points[j][0], upper.y, upper.points[j][1]],
        [upper.points[i][0], upper.y, upper.points[i][1]],
        radialWant(lower.points[i], lower.points[j], 1),
      );
    }
  }
  // zgornji rob
  const topOuter = outerRings[outerRings.length - 1];
  const topInner = innerRings[innerRings.length - 1];
  for (let i = 0; i < topOuter.points.length; i += 1) {
    const j = (i + 1) % topOuter.points.length;
    sink.quad(
      [topOuter.points[i][0], height, topOuter.points[i][1]],
      [topOuter.points[j][0], height, topOuter.points[j][1]],
      [topInner.points[j][0], height, topInner.points[j][1]],
      [topInner.points[i][0], height, topInner.points[i][1]],
      [0, 1, 0],
    );
  }
  // notranja stena (normala proti sredini)
  for (let k = innerRings.length - 1; k > 0; k -= 1) {
    const upper = innerRings[k];
    const lower = innerRings[k - 1];
    const n = upper.points.length;
    for (let i = 0; i < n; i += 1) {
      const j = (i + 1) % n;
      sink.quad(
        [upper.points[i][0], upper.y, upper.points[i][1]],
        [upper.points[j][0], upper.y, upper.points[j][1]],
        [lower.points[j][0], lower.y, lower.points[j][1]],
        [lower.points[i][0], lower.y, lower.points[i][1]],
        radialWant(upper.points[i], upper.points[j], -1),
      );
    }
  }
  // notranje dno
  sink.polygon(innerRings[0].points, hole.length ? [hole] : [], floor, true);
  // stena luknje
  if (hole.length) {
    for (let i = 0; i < hole.length; i += 1) {
      const j = (i + 1) % hole.length;
      sink.quad(
        [hole[i][0], 0, hole[i][1]],
        [hole[j][0], 0, hole[j][1]],
        [hole[j][0], floor, hole[j][1]],
        [hole[i][0], floor, hole[i][1]],
        radialWant(hole[i], hole[j], -1),
      );
    }
  }
  return sink.toGeometry();
}

/** Kvader (zaprta lupina). */
function boxTriangles(sink: TriangleSink, min: Vec3, max: Vec3): void {
  const [x0, y0, z0] = min;
  const [x1, y1, z1] = max;
  sink.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1]);
  sink.quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [0, 0, -1]);
  sink.quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [1, 0, 0]);
  sink.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [-1, 0, 0]);
  sink.quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], [0, 1, 0]);
  sink.quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [0, -1, 0]);
}

/**
 * Izbočen napis iz kvadratkov. Napis leži v ravnini XZ (bere se od zgoraj),
 * spodnji rob kvadratkov je na višini 0, višina izbokline je »relief«.
 */
export function buildPixelText(
  text: string,
  letterHeight: number,
  relief: number,
): { geometry: THREE.BufferGeometry; width: number; depth: number } | null {
  const { runs, columns, usedRows } = textRuns(text);
  if (!runs.length) return null;
  const rowsUsed = usedRows[1] - usedRows[0] + 1;
  const pixel = letterHeight / 7;
  const width = columns * pixel;
  const depth = rowsUsed * pixel;
  const sink = new TriangleSink();
  const overlap = pixel * 0.04;
  for (const run of runs) {
    const x0 = run.col * pixel - width / 2;
    const x1 = x0 + run.length * pixel;
    // vrstica 0 je zgoraj (daleč stran od bralca, -Z)
    const z0 = (run.row - usedRows[0]) * pixel - depth / 2 - overlap;
    const z1 = z0 + pixel + 2 * overlap;
    boxTriangles(sink, [x0, 0, z0], [x1, relief, z1]);
  }
  return { geometry: sink.toGeometry(), width, depth };
}

function mergeGeometries(parts: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const arrays = parts.map((part) => {
    const g = part.index ? part.toNonIndexed() : part;
    return g.getAttribute("position").array as Float32Array;
  });
  const total = arrays.reduce((sum, a) => sum + a.length, 0);
  const merged = new Float32Array(total);
  let offset = 0;
  for (const a of arrays) {
    merged.set(a, offset);
    offset += a.length;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(merged, 3));
  geometry.computeVertexNormals();
  return geometry;
}

/** Obesek / ploščica z izbirno luknjo in napisom. */
function buildTag(spec: ParametricSpec): THREE.BufferGeometry {
  const { widthMm: w, depthMm: d } = spec;
  const thickness = Math.max(1.5, spec.heightMm);
  const shape = new THREE.Shape();
  const r = Math.min(4, d / 3);
  shape.moveTo(-w / 2 + r, -d / 2);
  shape.lineTo(w / 2 - r, -d / 2);
  shape.quadraticCurveTo(w / 2, -d / 2, w / 2, -d / 2 + r);
  shape.lineTo(w / 2, d / 2 - r);
  shape.quadraticCurveTo(w / 2, d / 2, w / 2 - r, d / 2);
  shape.lineTo(-w / 2 + r, d / 2);
  shape.quadraticCurveTo(-w / 2, d / 2, -w / 2, d / 2 - r);
  shape.lineTo(-w / 2, -d / 2 + r);
  shape.quadraticCurveTo(-w / 2, -d / 2, -w / 2 + r, -d / 2);
  const holeRadius = Math.min(3, d / 5);
  const holeX = -w / 2 + holeRadius + Math.max(3, holeRadius);
  if (spec.hole) {
    const hole = new THREE.Path();
    hole.absarc(holeX, 0, holeRadius, 0, Math.PI * 2, true);
    shape.holes.push(hole);
  }
  const tag = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: false,
    curveSegments: 10,
  });
  tag.rotateX(-Math.PI / 2);
  const parts: THREE.BufferGeometry[] = [tag];

  const text = spec.text.trim();
  if (text) {
    const left = spec.hole ? holeX + holeRadius + 2 : -w / 2 + 3;
    const available = w / 2 - 3 - left;
    let letter = Math.min(d * 0.5, 12);
    let built = buildPixelText(text, letter, 1);
    if (built && built.width > available) {
      letter *= available / built.width;
      built = buildPixelText(text, letter, 1);
    }
    if (built) {
      built.geometry.translate(left + available / 2, thickness - 0.2, 0);
      parts.push(built.geometry);
    }
  }
  return mergeGeometries(parts);
}

/** Stojalo za telefon: stranski profil, iztisnjen po širini. */
function buildStand(spec: ParametricSpec): THREE.BufferGeometry {
  const w = spec.widthMm;
  const h = spec.heightMm;
  const base = Math.max(4, spec.wallMm * 2.5);
  const back = Math.max(5, spec.wallMm * 2.5);
  const lean = (h - base) / Math.tan((65 * Math.PI) / 180);
  const d = Math.max(spec.depthMm, 0.3 * spec.depthMm + back + lean + 5);
  const zb = 0.3 * d;
  const lipT = Math.max(4, spec.wallMm * 2);
  const lipH = 10;
  const shape = new THREE.Shape([
    new THREE.Vector2(0, 0),
    new THREE.Vector2(d, 0),
    new THREE.Vector2(d, base),
    new THREE.Vector2(zb + back, base),
    new THREE.Vector2(zb + back + lean, h),
    new THREE.Vector2(zb + lean, h),
    new THREE.Vector2(zb, base),
    new THREE.Vector2(lipT, base),
    new THREE.Vector2(lipT, base + lipH),
    new THREE.Vector2(0, base + lipH),
  ]);
  const stand = new THREE.ExtrudeGeometry(shape, {
    depth: w,
    bevelEnabled: false,
  });
  stand.rotateY(Math.PI / 2);
  return stand;
}

/** Preprosta figura iz osnovnih oblik (podstavek, telo, glava, ušesa). */
function buildFigure(spec: ParametricSpec): THREE.BufferGeometry {
  const { widthMm: w, depthMm: d, heightMm: h } = spec;
  const parts: THREE.BufferGeometry[] = [];
  const baseH = Math.max(3, h * 0.07);
  const base = new THREE.CylinderGeometry(w * 0.45, w * 0.48, baseH, 48, 1);
  base.translate(0, baseH / 2, 0);
  parts.push(base);

  const headR = Math.min(w, d) * 0.26;
  const bodyH = h - baseH - headR * 1.7;
  const body = new THREE.IcosahedronGeometry(1, 4);
  body.scale(w * 0.36, bodyH * 0.55, d * 0.36);
  body.translate(0, baseH + bodyH * 0.5, 0);
  parts.push(body);

  const head = new THREE.IcosahedronGeometry(headR, 4);
  const headY = h - headR;
  head.translate(0, headY, 0);
  parts.push(head);

  for (const side of [-1, 1]) {
    const ear = new THREE.IcosahedronGeometry(headR * 0.38, 3);
    ear.translate(side * headR * 0.72, headY + headR * 0.72, 0);
    parts.push(ear);
  }
  return mergeGeometries(parts);
}

/** Relief iz višinske mreže (npr. iz slike ali skice): zaprta ploščica. */
export function buildRelief(
  relief: ReliefData,
  width: number,
  depth: number,
  totalHeight: number,
): THREE.BufferGeometry {
  const { cols, rows, values } = relief;
  const baseH = Math.min(2, totalHeight * 0.4);
  const amp = Math.max(0.4, totalHeight - baseH);
  const sink = new TriangleSink();
  const xAt = (i: number) => (i / (cols - 1) - 0.5) * width;
  const zAt = (j: number) => (j / (rows - 1) - 0.5) * depth;
  const yAt = (i: number, j: number) =>
    baseH + (values[j * cols + i] / 255) * amp;

  for (let j = 0; j < rows - 1; j += 1) {
    for (let i = 0; i < cols - 1; i += 1) {
      const a: Vec3 = [xAt(i), yAt(i, j), zAt(j)];
      const b: Vec3 = [xAt(i + 1), yAt(i + 1, j), zAt(j)];
      const c: Vec3 = [xAt(i + 1), yAt(i + 1, j + 1), zAt(j + 1)];
      const e: Vec3 = [xAt(i), yAt(i, j + 1), zAt(j + 1)];
      sink.add(a, b, c, [0, 1, 0]);
      sink.add(a, c, e, [0, 1, 0]);
      // dno
      sink.add([a[0], 0, a[2]], [b[0], 0, b[2]], [c[0], 0, c[2]], [0, -1, 0]);
      sink.add([a[0], 0, a[2]], [c[0], 0, c[2]], [e[0], 0, e[2]], [0, -1, 0]);
    }
  }
  // stranice
  const edge = (points: [number, number][], want: Vec3) => {
    for (let k = 0; k < points.length - 1; k += 1) {
      const [i0, j0] = points[k];
      const [i1, j1] = points[k + 1];
      sink.quad(
        [xAt(i0), 0, zAt(j0)],
        [xAt(i1), 0, zAt(j1)],
        [xAt(i1), yAt(i1, j1), zAt(j1)],
        [xAt(i0), yAt(i0, j0), zAt(j0)],
        want,
      );
    }
  };
  edge(
    Array.from({ length: cols }, (_, i) => [i, 0]),
    [0, 0, -1],
  );
  edge(
    Array.from({ length: cols }, (_, i) => [i, rows - 1]),
    [0, 0, 1],
  );
  edge(
    Array.from({ length: rows }, (_, j) => [0, j]),
    [-1, 0, 0],
  );
  edge(
    Array.from({ length: rows }, (_, j) => [cols - 1, j]),
    [1, 0, 0],
  );
  return sink.toGeometry();
}

/** Zgradi geometrijo parametrične oblike (brez vrtenja in centriranja). */
export function buildParametric(spec: ParametricSpec): THREE.BufferGeometry {
  const w = Math.max(5, spec.widthMm);
  const d = Math.max(5, spec.depthMm);
  const h = Math.max(1, spec.heightMm);
  const wall = Math.max(0.8, spec.wallMm);
  const holeRadius = spec.hole
    ? Math.min(8, Math.max(3, Math.min(w, d) * 0.08))
    : 0;

  switch (spec.kind) {
    case "posoda":
      return buildCup({
        outline: (ww, dd) =>
          roundedRectOutline(ww, dd, Math.min(ww, dd) * 0.22),
        width: w,
        depth: d,
        height: h,
        wall,
        floor: Math.min(3, h * 0.4),
        profile: (t) => 0.94 + 0.06 * t,
        rings: 3,
        holeRadius,
      });
    case "skatla": {
      const box = buildCup({
        outline: (ww, dd) => roundedRectOutline(ww, dd, 4),
        width: w,
        depth: d,
        height: h,
        wall,
        floor: Math.min(2.5, h * 0.3),
        holeRadius,
      });
      const text = spec.text.trim();
      if (!text) return box;
      const letter = Math.min(h * 0.4, 14);
      let built = buildPixelText(text, letter, 1);
      const available = w - 10;
      if (built && built.width > available) {
        built = buildPixelText(text, letter * (available / built.width), 1);
      }
      if (!built) return box;
      // napis na sprednji steni (+Z), bere se od spredaj
      built.geometry.rotateX(Math.PI / 2);
      built.geometry.translate(0, h / 2, d / 2 - 0.2);
      return mergeGeometries([box, built.geometry]);
    }
    case "vaza":
      return buildCup({
        outline: (ww, dd) => ellipseOutline(ww, dd, 56),
        width: w,
        depth: d,
        height: h,
        wall,
        floor: Math.min(3, h * 0.2),
        profile: (t) => 0.78 + 0.22 * Math.sin(Math.PI * (0.2 + 0.75 * t)),
        rings: 14,
        holeRadius,
      });
    case "obesek":
      return buildTag({ ...spec, widthMm: w, depthMm: d });
    case "stojalo":
      return buildStand({
        ...spec,
        widthMm: w,
        depthMm: d,
        heightMm: Math.max(h, 30),
      });
    case "figura":
      return buildFigure({
        ...spec,
        widthMm: w,
        depthMm: d,
        heightMm: Math.max(h, 20),
      });
    case "relief":
      return buildRelief(
        spec.relief ?? { cols: 2, rows: 2, values: [0, 0, 0, 0] },
        w,
        d,
        h,
      );
  }
}

/** Uporabi vrtenje (stopinje) in postavi model na ploščo (najnižja točka y = 0, središče x/z = 0). */
export function placeOnPlate(
  geometry: THREE.BufferGeometry,
  rotation: Rotation,
): THREE.BufferGeometry {
  const g = geometry.index ? geometry.toNonIndexed() : geometry.clone();
  if (rotation.x || rotation.y || rotation.z) {
    const euler = new THREE.Euler(
      THREE.MathUtils.degToRad(rotation.x),
      THREE.MathUtils.degToRad(rotation.y),
      THREE.MathUtils.degToRad(rotation.z),
      "XYZ",
    );
    g.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(euler));
  }
  g.computeBoundingBox();
  const box = g.boundingBox!;
  g.translate(
    -(box.min.x + box.max.x) / 2,
    -box.min.y,
    -(box.min.z + box.max.z) / 2,
  );
  g.computeBoundingBox();
  g.computeVertexNormals();
  return g;
}

/** Zgradi končno geometrijo modela (v mm, postavljeno na ploščo). */
export function buildModelGeometry(source: ModelSource): THREE.BufferGeometry {
  if (source.type === "parametric") {
    return placeOnPlate(buildParametric(source.spec), source.rotation);
  }
  const { spec } = source;
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(spec.positions), 3),
  );
  const sx = spec.baseSize.x > 0 ? spec.widthMm / spec.baseSize.x : 1;
  const sy = spec.baseSize.y > 0 ? spec.heightMm / spec.baseSize.y : 1;
  const sz = spec.baseSize.z > 0 ? spec.depthMm / spec.baseSize.z : 1;
  geometry.scale(sx, sy, sz);
  return placeOnPlate(geometry, source.rotation);
}

export function geometrySize(geometry: THREE.BufferGeometry): {
  x: number;
  y: number;
  z: number;
} {
  geometry.computeBoundingBox();
  const box = geometry.boundingBox!;
  return {
    x: box.max.x - box.min.x,
    y: box.max.y - box.min.y,
    z: box.max.z - box.min.z,
  };
}
