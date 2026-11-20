import { describe, expect, it } from "vitest";

import { analyzeGeometry, edgeStats, partsLabel } from "@/lib/model3d/analysis";
import {
  buildModelGeometry,
  buildParametric,
  buildRelief,
} from "@/lib/model3d/geometry";
import type { ParametricSpec, TemplateKind } from "@/lib/model3d/types";

const baseSpec = (
  kind: TemplateKind,
  patch: Partial<ParametricSpec> = {},
): ParametricSpec => ({
  kind,
  widthMm: 80,
  depthMm: 60,
  heightMm: kind === "obesek" ? 4 : 50,
  wallMm: 2,
  hole: false,
  text: "",
  ...patch,
});

function positions(spec: ParametricSpec): Float32Array {
  return buildParametric(spec).getAttribute("position").array as Float32Array;
}

function signedVolume(p: Float32Array): number {
  let v = 0;
  for (let i = 0; i < p.length; i += 9) {
    v +=
      (p[i] * (p[i + 4] * p[i + 8] - p[i + 5] * p[i + 7]) -
        p[i + 1] * (p[i + 3] * p[i + 8] - p[i + 5] * p[i + 6]) +
        p[i + 2] * (p[i + 3] * p[i + 7] - p[i + 4] * p[i + 6])) /
      6;
  }
  return v;
}

describe("parametrične oblike so zaprte in pravilno usmerjene", () => {
  const cases: [string, ParametricSpec][] = [
    ["posoda", baseSpec("posoda")],
    ["posoda z luknjo", baseSpec("posoda", { hole: true })],
    ["škatla", baseSpec("skatla")],
    ["škatla z napisom", baseSpec("skatla", { text: "ŠKATLA" })],
    ["vaza z luknjo", baseSpec("vaza", { hole: true, heightMm: 120 })],
    [
      "obesek z luknjo in napisom",
      baseSpec("obesek", { hole: true, text: "ŽAN" }),
    ],
    ["obesek brez luknje", baseSpec("obesek")],
    ["stojalo", baseSpec("stojalo", { heightMm: 100 })],
    ["figura", baseSpec("figura", { heightMm: 90 })],
  ];
  for (const [label, spec] of cases) {
    it(label, () => {
      const p = positions(spec);
      const stats = edgeStats(p);
      expect(stats.openEdges).toBe(0);
      expect(stats.nonManifoldEdges).toBe(0);
      expect(stats.flippedEdges).toBe(0);
      expect(stats.degenerate).toBe(0);
      expect(signedVolume(p)).toBeGreaterThan(0);
    });
  }

  it("relief iz višinske mreže", () => {
    const values = Array.from({ length: 20 * 10 }, (_, i) => (i * 37) % 256);
    const g = buildRelief({ cols: 20, rows: 10, values }, 100, 50, 5);
    const p = g.getAttribute("position").array as Float32Array;
    const stats = edgeStats(p);
    expect(stats.openEdges).toBe(0);
    expect(stats.nonManifoldEdges).toBe(0);
    expect(stats.flippedEdges).toBe(0);
    expect(signedVolume(p)).toBeGreaterThan(0);
  });
});

describe("postavitev in mere", () => {
  it("model stoji na plošči in ima zahtevane mere", () => {
    const g = buildModelGeometry({
      type: "parametric",
      spec: baseSpec("skatla", { widthMm: 100, depthMm: 70, heightMm: 50 }),
      rotation: { x: 0, y: 0, z: 0 },
    });
    g.computeBoundingBox();
    const box = g.boundingBox!;
    expect(box.min.y).toBeCloseTo(0, 5);
    expect(box.max.x - box.min.x).toBeCloseTo(100, 1);
    expect(box.max.z - box.min.z).toBeCloseTo(70, 1);
    expect(box.max.y - box.min.y).toBeCloseTo(50, 1);
    expect((box.min.x + box.max.x) / 2).toBeCloseTo(0, 5);
  });

  it("vrtenje za 90° zamenja višino in širino", () => {
    const g = buildModelGeometry({
      type: "parametric",
      spec: baseSpec("skatla", { widthMm: 100, depthMm: 70, heightMm: 50 }),
      rotation: { x: 0, y: 0, z: 90 },
    });
    g.computeBoundingBox();
    const box = g.boundingBox!;
    expect(box.max.y - box.min.y).toBeCloseTo(100, 1);
    expect(box.min.y).toBeCloseTo(0, 5);
  });
});

describe("preverjanje tiskalnosti", () => {
  it("brezhibna škatla je pripravljena za tisk", () => {
    const g = buildModelGeometry({
      type: "parametric",
      spec: baseSpec("skatla"),
      rotation: { x: 0, y: 0, z: 0 },
    });
    const analysis = analyzeGeometry(g);
    expect(analysis.openEdges).toBe(0);
    expect(analysis.ready).toBe(true);
    expect(analysis.thinWallMm).not.toBeNull();
    expect(analysis.thinWallMm!).toBeGreaterThan(1.5);
    expect(analysis.thinWallMm!).toBeLessThan(2.6);
    expect(analysis.stlBytes).toBe(84 + analysis.triangles * 50);
  });

  it("zazna pretanke stene in prevelik model", () => {
    const thin = analyzeGeometry(
      buildModelGeometry({
        type: "parametric",
        spec: baseSpec("skatla", { wallMm: 0.8, widthMm: 400 }),
        rotation: { x: 0, y: 0, z: 0 },
      }),
    );
    expect(thin.checks.find((c) => c.id === "velikost")?.status).toBe("napaka");
    expect(thin.ready).toBe(false);
  });

  it("zazna odprto površino", () => {
    const g = buildParametric(baseSpec("skatla"));
    const p = g.getAttribute("position").array as Float32Array;
    const open = p.slice(0, p.length - 9 * 4);
    const stats = edgeStats(open);
    expect(stats.openEdges).toBeGreaterThan(0);
  });

  it("pravilna slovnica za število delov", () => {
    expect(partsLabel(1)).toBe("1 del");
    expect(partsLabel(2)).toBe("2 dela");
    expect(partsLabel(3)).toBe("3 dele");
    expect(partsLabel(5)).toBe("5 delov");
  });
});
