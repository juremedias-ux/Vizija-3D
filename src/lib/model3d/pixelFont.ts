/**
 * Preprosta pisava iz kvadratkov (5 × 7 + 2 vrstici za strešice) za izbočene napise.
 * Podpira velike črke A–Z, Č, Š, Ž, števke in nekaj ločil. Male črke se izpišejo z velikimi.
 * Vsak znak je 9 vrstic po 5 stolpcev; '#' pomeni poln kvadratek.
 */

const BLANK2 = [".....", "....."];
const CARON = [".#.#.", "..#.."];

const BASE: Record<string, string[]> = {
  A: [".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  B: ["####.", "#...#", "#...#", "####.", "#...#", "#...#", "####."],
  C: [".###.", "#...#", "#....", "#....", "#....", "#...#", ".###."],
  D: ["####.", "#...#", "#...#", "#...#", "#...#", "#...#", "####."],
  E: ["#####", "#....", "#....", "####.", "#....", "#....", "#####"],
  F: ["#####", "#....", "#....", "####.", "#....", "#....", "#...."],
  G: [".###.", "#...#", "#....", "#.###", "#...#", "#...#", ".###."],
  H: ["#...#", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  I: [".###.", "..#..", "..#..", "..#..", "..#..", "..#..", ".###."],
  J: ["..###", "...#.", "...#.", "...#.", "...#.", "#..#.", ".##.."],
  K: ["#...#", "#..#.", "#.#..", "##...", "#.#..", "#..#.", "#...#"],
  L: ["#....", "#....", "#....", "#....", "#....", "#....", "#####"],
  M: ["#...#", "##.##", "#.#.#", "#.#.#", "#...#", "#...#", "#...#"],
  N: ["#...#", "##..#", "#.#.#", "#..##", "#...#", "#...#", "#...#"],
  O: [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  P: ["####.", "#...#", "#...#", "####.", "#....", "#....", "#...."],
  Q: [".###.", "#...#", "#...#", "#...#", "#.#.#", "#..#.", ".##.#"],
  R: ["####.", "#...#", "#...#", "####.", "#.#..", "#..#.", "#...#"],
  S: [".####", "#....", "#....", ".###.", "....#", "....#", "####."],
  T: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "..#.."],
  U: ["#...#", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  V: ["#...#", "#...#", "#...#", "#...#", "#...#", ".#.#.", "..#.."],
  W: ["#...#", "#...#", "#...#", "#.#.#", "#.#.#", "##.##", "#...#"],
  X: ["#...#", "#...#", ".#.#.", "..#..", ".#.#.", "#...#", "#...#"],
  Y: ["#...#", "#...#", ".#.#.", "..#..", "..#..", "..#..", "..#.."],
  Z: ["#####", "....#", "...#.", "..#..", ".#...", "#....", "#####"],
  "0": [".###.", "#...#", "#..##", "#.#.#", "##..#", "#...#", ".###."],
  "1": ["..#..", ".##..", "..#..", "..#..", "..#..", "..#..", ".###."],
  "2": [".###.", "#...#", "....#", "...#.", "..#..", ".#...", "#####"],
  "3": ["####.", "....#", "....#", ".###.", "....#", "....#", "####."],
  "4": ["...#.", "..##.", ".#.#.", "#..#.", "#####", "...#.", "...#."],
  "5": ["#####", "#....", "####.", "....#", "....#", "#...#", ".###."],
  "6": [".###.", "#....", "#....", "####.", "#...#", "#...#", ".###."],
  "7": ["#####", "....#", "...#.", "..#..", ".#...", ".#...", ".#..."],
  "8": [".###.", "#...#", "#...#", ".###.", "#...#", "#...#", ".###."],
  "9": [".###.", "#...#", "#...#", ".####", "....#", "....#", ".###."],
  " ": [".....", ".....", ".....", ".....", ".....", ".....", "....."],
  "-": [".....", ".....", ".....", ".###.", ".....", ".....", "....."],
  ".": [".....", ".....", ".....", ".....", ".....", ".##..", ".##.."],
  "!": ["..#..", "..#..", "..#..", "..#..", "..#..", ".....", "..#.."],
  "?": [".###.", "#...#", "....#", "...#.", "..#..", ".....", "..#.."],
  "&": [".##..", "#..#.", "#.#..", ".#...", "#.#.#", "#..#.", ".##.#"],
};

const DIACRITICS: Record<string, string> = { Č: "C", Š: "S", Ž: "Z" };

export const GLYPH_COLUMNS = 5;
export const GLYPH_ROWS = 9;

/** Vrne 9 vrstic znaka ali null, če znaka ni v pisavi. */
export function glyphFor(char: string): string[] | null {
  const upper = char.toUpperCase();
  if (DIACRITICS[upper]) return [...CARON, ...BASE[DIACRITICS[upper]]];
  const base = BASE[upper];
  return base ? [...BLANK2, ...base] : null;
}

/** Ohrani samo znake, ki jih pisava podpira, in omeji dolžino. */
export function sanitizeEngraving(text: string, maxLength = 16): string {
  return Array.from(text.toUpperCase())
    .filter((char) => glyphFor(char))
    .join("")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

export interface PixelRun {
  /** Stolpec in vrstica (vrstica 0 je zgoraj) v mreži celotnega napisa. */
  col: number;
  row: number;
  length: number;
}

/** Vodoravni nizi polnih kvadratkov za celoten napis (1 stolpec presledka med znaki). */
export function textRuns(text: string): {
  runs: PixelRun[];
  columns: number;
  rows: number;
  usedRows: [number, number];
} {
  const chars = Array.from(sanitizeEngraving(text));
  const runs: PixelRun[] = [];
  let minRow = GLYPH_ROWS;
  let maxRow = -1;
  chars.forEach((char, index) => {
    const glyph = glyphFor(char);
    if (!glyph) return;
    const offset = index * (GLYPH_COLUMNS + 1);
    glyph.forEach((line, row) => {
      let start = -1;
      for (let col = 0; col <= line.length; col += 1) {
        const filled = line[col] === "#";
        if (filled && start < 0) start = col;
        if (!filled && start >= 0) {
          runs.push({ col: offset + start, row, length: col - start });
          minRow = Math.min(minRow, row);
          maxRow = Math.max(maxRow, row);
          start = -1;
        }
      }
    });
  });
  const columns = Math.max(0, chars.length * (GLYPH_COLUMNS + 1) - 1);
  return {
    runs,
    columns,
    rows: GLYPH_ROWS,
    usedRows: maxRow >= 0 ? [minRow, maxRow] : [0, 0],
  };
}
