import type { ModelSettings, Purpose, TemplateKind } from "./types";

/** Odstrani šumnike in velike črke za lažje primerjanje besed. */
export function normalizeText(value: string): string {
  return value.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/* ---------------------------------------------------------------------------
 * Prepovedane vsebine
 * ------------------------------------------------------------------------- */

const BLOCKED_PATTERNS: RegExp[] = [
  // orožje in deli orožja
  /\bpistol\w*/,
  /\bpusk(a|e|o|i|ami|ah)\b/,
  /\brevolver\w*/,
  /\borozj\w*/,
  /\bstrelno\b/,
  /\bostrostrel\w*/,
  /\bmitraljez\w*/,
  /\bsprozil\w*/,
  /\bglusnik\w*/,
  /\bdusil\w* poka\b/,
  /\bnabojnik\w*/,
  /\bizdelav\w* nabojev\b/,
  // eksplozivi
  /\beksploziv\w*/,
  /\brazstrel\w*/,
  /\bbomb(a|e|o|i|ami)\b/,
  /\bgranat(a|e|o|i)\b/,
  /\bdetonator\w*/,
  /\bmolotov\w*/,
  // angleški izrazi
  /\bguns?\b/,
  /\bhandguns?\b/,
  /\bshotguns?\b/,
  /\brifles?\b/,
  /\bfirearms?\b/,
  /\bglock\b/,
  /\bar-?15\b/,
  /\bak-?47\b/,
  /\blower receiver\b/,
  /\bsuppressors?\b/,
  /\bsilencers?\b/,
  /\bexplosives?\b/,
  /\bbombs?\b/,
  /\bgrenades?\b/,
  /\bdetonators?\b/,
];

export const BLOCKED_MESSAGE =
  "Tega ne moremo ustvariti. Platforma ne dovoli orožja, delov orožja, eksplozivov ali drugih nevarnih in nezakonitih predmetov.";

/** Vrne true, če besedilo opisuje prepovedan predmet. */
export function isBlockedContent(text: string): boolean {
  const normalized = normalizeText(text);
  return BLOCKED_PATTERNS.some((pattern) => pattern.test(normalized));
}

/* ---------------------------------------------------------------------------
 * Razčlenitev opisa
 * ------------------------------------------------------------------------- */

const KIND_KEYWORDS: { kind: TemplateKind; patterns: RegExp[] }[] = [
  {
    kind: "obesek",
    patterns: [
      /\bobes\w*/,
      /\bprives\w*/,
      /\bploscic\w*/,
      /\btablic(a|o|e)\b/,
      /\bznack\w*/,
      /\bkeychain\b/,
      /\btag\b/,
    ],
  },
  {
    kind: "stojalo",
    patterns: [
      /\bstojal\w*/,
      /\bnosil\w*/,
      /\btelefon\w*/,
      /\btablicn\w*/,
      /\bstand\b/,
    ],
  },
  {
    kind: "vaza",
    patterns: [
      /\bvaz\w*/,
      /\blonc\w*/,
      /\bcvet\w*/,
      /\brastlin\w*/,
      /\bkozar\w*/,
      /\bvase\b/,
      /\bpot\b/,
    ],
  },
  {
    kind: "posoda",
    patterns: [
      /\bposod\w*/,
      /\bsklede?\w*/,
      /\bpladenj\w*/,
      /\bkljuc\w*/,
      /\bbowl\b/,
      /\btray\b/,
    ],
  },
  {
    kind: "skatla",
    patterns: [
      /\bskatl\w*/,
      /\borganizator\w*/,
      /\bpredal\w*/,
      /\bpusic\w*/,
      /\bdoz(a|o|e)\b/,
      /\bbox\b/,
      /\borganizer\b/,
    ],
  },
  {
    kind: "figura",
    patterns: [
      /\bfigur\w*/,
      /\brobot\w*/,
      /\bzival\w*/,
      /\bzmaj\w*/,
      /\bmack\w*/,
      /\bpes\b|\bpsa\b|\bpsick\w*/,
      /\bmedved\w*/,
      /\blik\b/,
      /\bfigure\b/,
    ],
  },
];

/** Privzete mere (širina × globina × višina v mm) za vsako obliko. */
export const DEFAULT_DIMENSIONS: Record<
  TemplateKind,
  { w: number; d: number; h: number }
> = {
  posoda: { w: 120, d: 80, h: 30 },
  skatla: { w: 100, d: 70, h: 50 },
  vaza: { w: 80, d: 80, h: 140 },
  obesek: { w: 50, d: 30, h: 4 },
  stojalo: { w: 80, d: 70, h: 100 },
  figura: { w: 60, d: 50, h: 90 },
  relief: { w: 100, d: 100, h: 5 },
};

export const KIND_LABELS: Record<TemplateKind, string> = {
  posoda: "posoda",
  skatla: "škatla / organizator",
  vaza: "vaza / lonček",
  obesek: "obesek / ploščica",
  stojalo: "stojalo",
  figura: "figura",
  relief: "relief iz slike",
};

export function detectKind(prompt: string, purpose: Purpose): TemplateKind {
  const normalized = normalizeText(prompt);
  for (const entry of KIND_KEYWORDS) {
    if (entry.patterns.some((pattern) => pattern.test(normalized))) {
      return entry.kind;
    }
  }
  if (purpose === "figura" || purpose === "dekoracija" || purpose === "darilo")
    return "figura";
  return "skatla";
}

export interface ParsedDimensions {
  w: number | null;
  d: number | null;
  h: number | null;
}

const NUM = String.raw`(\d+(?:[.,]\d+)?)`;

/**
 * Prebere mere v obliki »12 x 8 x 3 cm«, »120×80 mm« ali »visok 9 cm«.
 * Vrne null, če v opisu ni nobene mere.
 */
export function parseDimensions(
  prompt: string,
  defaultUnit: "mm" | "cm",
): ParsedDimensions | null {
  const toMm = (value: string, unit: string | undefined) =>
    Number(value.replace(",", ".")) *
    ((unit?.toLowerCase() ?? defaultUnit) === "cm" ? 10 : 1);

  const box = prompt.match(
    new RegExp(
      `${NUM}\\s*[x×]\\s*${NUM}(?:\\s*[x×]\\s*${NUM})?\\s*(mm|cm)?`,
      "i",
    ),
  );
  if (box) {
    const w = toMm(box[1], box[4]);
    const d = toMm(box[2], box[4]);
    const h = box[3] ? toMm(box[3], box[4]) : null;
    if ([w, d, h ?? 1].every((v) => Number.isFinite(v) && v > 0)) {
      return { w, d, h };
    }
  }

  const height = normalizeText(prompt).match(
    new RegExp(`\\b(?:visok\\w*|visin\\w*)\\s*${NUM}\\s*(mm|cm)?`),
  );
  if (height) {
    const h = toMm(height[1], height[2]);
    if (Number.isFinite(h) && h > 0) return { w: null, d: null, h };
  }
  return null;
}

/** Ali opis omenja luknjo (npr. za odtok ali obešanje). */
export function mentionsHole(prompt: string): boolean {
  return /lukn\w*|\bodtok\w*|\bza obesanje\b/.test(normalizeText(prompt));
}

/** Besedilo za gravuro, npr. »z imenom ANA« ali »z napisom "DOM"«. */
export function parseEngravingText(prompt: string): string {
  const quoted = prompt.match(/["»„“]([^"«“”]{1,24})["«“”]/);
  if (quoted) return quoted[1].trim();
  const named = prompt.match(
    /\b(?:imenom|napisom|besedilom|inicialkami)\s+([\p{L}\d][\p{L}\d .!?-]{0,23})/iu,
  );
  if (!named) return "";
  return named[1].split(/[,.;]/)[0].trim();
}

/** Odstrani nevidne in odvečne znake ter omeji dolžino. */
export function cleanPrompt(prompt: string): string {
  return prompt.replace(/\s+/g, " ").trim().slice(0, 600);
}

/* ---------------------------------------------------------------------------
 * »Izboljšaj opis«: predlogi brez umetne inteligence (pravila)
 * ------------------------------------------------------------------------- */

const PURPOSE_PHRASES: Record<Purpose, string> = {
  dekoracija: "za dekoracijo",
  funkcionalen: "za vsakodnevno uporabo",
  figura: "kot figura",
  organizator: "za pospravljanje",
  darilo: "kot darilo",
  popravilo: "kot nadomestni del",
};

export interface PromptSuggestion {
  /** Kaj manjka v opisu. */
  reason: string;
  /** Besedilo, ki ga dodamo. */
  addition: string;
}

export function suggestPromptImprovements(
  prompt: string,
  settings: ModelSettings,
): { suggestions: PromptSuggestion[]; improved: string } {
  const text = cleanPrompt(prompt);
  const normalized = normalizeText(text);
  const kind = detectKind(text, settings.purpose);
  const suggestions: PromptSuggestion[] = [];

  if (!parseDimensions(text, settings.unit)) {
    const dims = DEFAULT_DIMENSIONS[kind];
    const unit = settings.unit;
    const f = unit === "cm" ? 10 : 1;
    const fmt = (mm: number) =>
      String(Math.round((mm / f) * 10) / 10).replace(".", ",");
    suggestions.push({
      reason: "Opis nima mer, zato bo velikost samo ocenjena.",
      addition: `velikost približno ${fmt(dims.w)} x ${fmt(dims.d)} x ${fmt(dims.h)} ${unit}`,
    });
  }

  const hasPurpose = /\bza\b/.test(normalized) || /\bkot\b/.test(normalized);
  if (!hasPurpose) {
    suggestions.push({
      reason: "Namen pomaga izbrati obliko in trdnost.",
      addition: PURPOSE_PHRASES[settings.purpose],
    });
  }

  if (!/\bravn\w*/.test(normalized)) {
    suggestions.push({
      reason: "Ravna spodnja ploskev se lažje natisne brez podpor.",
      addition: "z ravno spodnjo ploskvijo",
    });
  }

  if (kind === "figura" && !/\bstrlec\w*|\btank\w*/.test(normalized)) {
    suggestions.push({
      reason: "Tanki štrleči deli se pri tisku radi zlomijo.",
      addition: "brez tankih štrlečih delov",
    });
  }

  if (
    (settings.purpose === "funkcionalen" ||
      settings.purpose === "popravilo" ||
      settings.purpose === "organizator") &&
    !/\bsten\w*/.test(normalized)
  ) {
    suggestions.push({
      reason: "Za uporabne predmete so primernejše debelejše stene.",
      addition: "s stenami debeline vsaj 2 mm",
    });
  }

  const improved = suggestions.length
    ? `${text.replace(/[.\s]+$/, "")}, ${suggestions.map((s) => s.addition).join(", ")}`
    : text;
  return { suggestions, improved };
}

/** Primeri dobrih opisov za navdih. */
export const PROMPT_EXAMPLES = [
  "Minimalistična posoda za ključe, 12 x 8 x 3 cm, za 3D tisk",
  "Okrogel lonček za sukulente z luknjo za odtok, 8 x 8 x 9 cm",
  "Obesek za ključe z imenom ANA, 5 x 3 x 0,4 cm",
  "Organizator za pisarniško mizo, 10 x 7 x 5 cm, z ravno spodnjo ploskvijo",
  "Stojalo za telefon za nočno omarico",
  "Preprosta figura medvedka kot darilo, visoka 9 cm",
];
