/**
 * Tipi za prihodnjo vizualizacijo prostora.
 *
 * Trenutno funkcija NE deluje: spletno mesto ne sprejema fotografij, jih ne
 * analizira in ne shranjuje. Ti tipi le določajo obliko podatkov, ko bo
 * funkcija dodana (npr. nalaganje fotografije → umestitev izdelkov → naročilo).
 */

/** Položaj v sliki, izražen v deležih širine in višine (0–1). */
export interface RelativePoint {
  x: number;
  y: number;
}

export interface ProductPlacement {
  /** id iz kataloga izdelkov (src/content/products.ts). */
  productId: string;
  position: RelativePoint;
  /** Relativno merilo glede na privzeto velikost prikaza. */
  scale: number;
  rotationDeg: number;
}

/** Oznaka v konceptnem prikazu (statična, brez povezave z izdelkom). */
export interface ConceptMarker {
  label: string;
  position: RelativePoint;
}
