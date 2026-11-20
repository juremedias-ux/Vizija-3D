import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { analyzeGeometry, edgeStats } from "@/lib/model3d/analysis";
import {
  buildSpecText,
  crc32,
  createZip,
  slugify,
  toBinaryStl,
} from "@/lib/model3d/export";
import { buildModelGeometry, buildParametric } from "@/lib/model3d/geometry";
import { repairPositions } from "@/lib/model3d/repair";
import { DEFAULT_SETTINGS } from "@/lib/model3d/types";

const box = () =>
  buildModelGeometry({
    type: "parametric",
    spec: {
      kind: "skatla",
      widthMm: 60,
      depthMm: 40,
      heightMm: 30,
      wallMm: 2,
      hole: false,
      text: "",
    },
    rotation: { x: 0, y: 0, z: 0 },
  });

describe("izvoz STL", () => {
  it("binarni STL ima pravilno glavo in velikost, os Z kaže navzgor", () => {
    const g = box();
    const p = g.getAttribute("position").array as Float32Array;
    const stl = toBinaryStl(p, "Škatla");
    const view = new DataView(stl);
    const tris = p.length / 9;
    expect(stl.byteLength).toBe(84 + tris * 50);
    expect(view.getUint32(80, true)).toBe(tris);
    // največja koordinata Z v STL = višina modela (30 mm)
    let maxZ = -Infinity;
    for (let t = 0; t < tris; t += 1) {
      for (let k = 0; k < 3; k += 1) {
        maxZ = Math.max(
          maxZ,
          view.getFloat32(84 + t * 50 + 12 + k * 12 + 8, true),
        );
      }
    }
    expect(maxZ).toBeCloseTo(30, 3);
  });
});

describe("paket ZIP", () => {
  it("CRC32 ustreza znani vrednosti", () => {
    expect(crc32(new TextEncoder().encode("123456789"))).toBe(0xcbf43926);
  });

  it("ustvari veljaven ZIP, ki ga prebere zunanji program", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "vizija-zip-"));
    try {
      const zip = createZip([
        {
          name: "model.stl",
          data: new Uint8Array(
            toBinaryStl(box().getAttribute("position").array as Float32Array),
          ),
        },
        {
          name: "specifikacija.txt",
          data: new TextEncoder().encode("Šumniki: čšž"),
        },
      ]);
      const file = path.join(dir, "paket.zip");
      writeFileSync(file, zip);
      const out = execFileSync(
        "python3",
        [
          "-I",
          "-c",
          "import sys,zipfile;z=zipfile.ZipFile(sys.argv[1]);print(z.testzip());print(','.join(z.namelist()));print(z.read('specifikacija.txt').decode('utf-8'))",
          file,
        ],
        { encoding: "utf-8" },
      );
      const [bad, names, text] = out.trim().split("\n");
      expect(bad).toBe("None");
      expect(names).toBe("model.stl,specifikacija.txt");
      expect(text).toBe("Šumniki: čšž");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("specifikacija", () => {
  it("vsebuje mere, material in opozorila", () => {
    const analysis = analyzeGeometry(box());
    const text = buildSpecText({
      name: "Škatla",
      analysis,
      settings: { ...DEFAULT_SETTINGS, purpose: "funkcionalen" },
      formats: ["STL", "GLB"],
      date: new Date("2026-11-20T10:00:00Z"),
    });
    expect(text).toContain("Ime modela: Škatla");
    expect(text).toContain("60 × 40 × 30 mm");
    expect(text).toContain(
      "Pred tiskom preveri dimenzije, debelino sten in geometrijo modela.",
    );
    expect(text).toContain("za natančne dele uporabi CAD");
    expect(slugify("Posoda za ključe, 12×8")).toBe("posoda-za-kljuce-12-8");
  });
});

describe("samodejni popravek", () => {
  it("zapre luknje in odstrani ploskve brez površine", () => {
    const p = buildParametric({
      kind: "skatla",
      widthMm: 60,
      depthMm: 40,
      heightMm: 30,
      wallMm: 2,
      hole: false,
      text: "",
    }).getAttribute("position").array as Float32Array;
    // odstrani nekaj ploskev (luknja) in dodaj ploskev brez površine
    const broken = new Float32Array(p.length - 9 * 2 + 9);
    broken.set(p.slice(0, p.length - 9 * 2));
    broken.set([1, 1, 1, 1, 1, 1, 2, 2, 2], p.length - 9 * 2);
    expect(edgeStats(broken).openEdges).toBeGreaterThan(0);
    const repaired = repairPositions(broken);
    expect(repaired.removedDegenerate).toBe(1);
    expect(repaired.filledHoles).toBeGreaterThan(0);
    const stats = edgeStats(repaired.positions);
    expect(stats.openEdges).toBe(0);
    expect(stats.nonManifoldEdges).toBe(0);
    expect(stats.flippedEdges).toBe(0);
  });
});
