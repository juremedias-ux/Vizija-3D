import { describe, expect, it } from "vitest";

import { nameFromPrompt, specFromPrompt } from "@/lib/model3d/generate";
import { sanitizeEngraving, textRuns } from "@/lib/model3d/pixelFont";
import {
  detectKind,
  isBlockedContent,
  parseDimensions,
  parseEngravingText,
  suggestPromptImprovements,
} from "@/lib/model3d/prompt";
import { DEFAULT_SETTINGS } from "@/lib/model3d/types";

describe("razčlenitev opisa", () => {
  it("prepozna obliko", () => {
    expect(detectKind("Minimalistična posoda za ključe", "dekoracija")).toBe(
      "posoda",
    );
    expect(detectKind("Obesek za ključe z imenom ANA", "darilo")).toBe(
      "obesek",
    );
    expect(detectKind("Lonček za sukulente", "dekoracija")).toBe("vaza");
    expect(detectKind("Organizator za pisalno mizo", "organizator")).toBe(
      "skatla",
    );
    expect(detectKind("Stojalo za telefon", "funkcionalen")).toBe("stojalo");
    expect(detectKind("Figura medvedka", "darilo")).toBe("figura");
    expect(detectKind('Organizator z napisom "PISALA"', "organizator")).toBe(
      "skatla",
    );
  });

  it("prebere mere", () => {
    expect(parseDimensions("posoda, 12 x 8 x 3 cm", "mm")).toEqual({
      w: 120,
      d: 80,
      h: 30,
    });
    expect(parseDimensions("120×80 mm", "cm")).toEqual({
      w: 120,
      d: 80,
      h: null,
    });
    expect(parseDimensions("obesek 5 x 3 x 0,4 cm", "mm")).toEqual({
      w: 50,
      d: 30,
      h: 4,
    });
    expect(parseDimensions("figura, visoka 9 cm", "mm")).toEqual({
      w: null,
      d: null,
      h: 90,
    });
    expect(parseDimensions("brez mer", "cm")).toBeNull();
  });

  it("prebere napis za gravuro", () => {
    expect(parseEngravingText("Obesek z imenom ANA, 5 x 3 cm")).toBe("ANA");
    expect(parseEngravingText('Škatla z napisom "Žiga"')).toBe("Žiga");
    expect(sanitizeEngraving("Žiga & Čop!")).toBe("ŽIGA & ČOP!");
    expect(textRuns("Š").runs.length).toBeGreaterThan(0);
  });

  it("demo način sestavi obliko z merami iz opisa", () => {
    const { spec, notes } = specFromPrompt(
      "Minimalistična posoda za ključe, 12 x 8 x 3 cm, za 3D tisk",
      DEFAULT_SETTINGS,
      null,
    );
    expect(spec.kind).toBe("posoda");
    expect([spec.widthMm, spec.depthMm, spec.heightMm]).toEqual([120, 80, 30]);
    expect(notes[0]).toMatch(/^Demo način/);
    expect(nameFromPrompt("minimalistična posoda za ključe, 12 x 8")).toBe(
      "Minimalistična posoda za ključe",
    );
  });

  it("izboljša opis s predlogi", () => {
    const { suggestions, improved } = suggestPromptImprovements(
      "Posoda",
      DEFAULT_SETTINGS,
    );
    expect(suggestions.length).toBeGreaterThanOrEqual(2);
    expect(improved).toMatch(/^Posoda, velikost približno 12 x 8 x 3 cm/);
  });
});

describe("prepovedane vsebine", () => {
  it.each([
    "pištola za 3D tisk",
    "nabojnik za puško",
    "glušnik",
    "eksploziv v škatli",
    "ročna granata",
    "3D printed gun",
    "AR-15 lower receiver",
  ])("zavrne: %s", (text) => {
    expect(isBlockedContent(text)).toBe(true);
  });

  it.each([
    "bombonjera za darilo",
    "granatno jabolko kot dekoracija",
    "škatla za ključe",
    "lonček za rože",
  ])("dovoli: %s", (text) => {
    expect(isBlockedContent(text)).toBe(false);
  });
});
