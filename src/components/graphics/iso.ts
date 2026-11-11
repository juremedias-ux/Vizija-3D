/** Pomožne funkcije za izometrično risanje preprostih teles v SVG. */

const COS30 = Math.cos(Math.PI / 6);
const SIN30 = 0.5;

export type Point3 = [number, number, number];

export function createIso(originX: number, originY: number) {
  const project = ([x, y, z]: Point3): [number, number] => [
    originX + (x - y) * COS30,
    originY + (x + y) * SIN30 - z,
  ];

  const pt = (p: Point3) => {
    const [sx, sy] = project(p);
    return `${sx.toFixed(1)},${sy.toFixed(1)}`;
  };

  const polygon = (points: Point3[]) => points.map(pt).join(" ");

  const line = (a: Point3, b: Point3) => {
    const [x1, y1] = project(a);
    const [x2, y2] = project(b);
    return { x1, y1, x2, y2 };
  };

  return { project, pt, polygon, line };
}

export interface BoxSpec {
  x: [number, number];
  y: [number, number];
  z: [number, number];
}

/** Vidne ploskve kvadra (zgornja, desna x=max, leva y=max). */
export function boxFaces(iso: ReturnType<typeof createIso>, box: BoxSpec) {
  const [x0, x1] = box.x;
  const [y0, y1] = box.y;
  const [z0, z1] = box.z;
  return {
    top: iso.polygon([
      [x0, y0, z1],
      [x1, y0, z1],
      [x1, y1, z1],
      [x0, y1, z1],
    ]),
    right: iso.polygon([
      [x1, y0, z0],
      [x1, y1, z0],
      [x1, y1, z1],
      [x1, y0, z1],
    ]),
    left: iso.polygon([
      [x0, y1, z0],
      [x1, y1, z0],
      [x1, y1, z1],
      [x0, y1, z1],
    ]),
  };
}

/** Vodoravne črte slojev na obeh vidnih stranskih ploskvah kvadra. */
export function boxLayerLines(
  iso: ReturnType<typeof createIso>,
  box: BoxSpec,
  step: number,
) {
  const [x0, x1] = box.x;
  const [y0, y1] = box.y;
  const [z0, z1] = box.z;
  const lines: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (let z = z0 + step; z < z1 - 0.01; z += step) {
    lines.push(iso.line([x1, y0, z], [x1, y1, z]));
    lines.push(iso.line([x0, y1, z], [x1, y1, z]));
  }
  return lines;
}

/** Elipsa, ki predstavlja vodoravni krog v izometrični projekciji. */
export function isoEllipse(
  iso: ReturnType<typeof createIso>,
  center: Point3,
  radius: number,
) {
  const [cx, cy] = iso.project(center);
  return {
    cx,
    cy,
    rx: radius * Math.SQRT2 * COS30,
    ry: radius * Math.SQRT2 * SIN30,
  };
}

/** Sprednja polovica izometrične elipse kot pot SVG. */
export function frontArc(e: {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}) {
  const left = `${(e.cx - e.rx).toFixed(1)} ${e.cy.toFixed(1)}`;
  const right = `${(e.cx + e.rx).toFixed(1)} ${e.cy.toFixed(1)}`;
  return `M ${left} A ${e.rx.toFixed(1)} ${e.ry.toFixed(1)} 0 0 0 ${right}`;
}
