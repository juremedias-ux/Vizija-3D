/** Skupni vmesnik shrambe prijav (SQLite lokalno, Postgres/Supabase v produkciji). */

export interface SaveInterestInput {
  productId: string;
  /** Že normaliziran e-poštni naslov. */
  email: string;
  quantity: number;
  consentTextVersion: string;
  now: Date;
}

export interface SaveInterestResult {
  id: string;
  /** true, če je bil zapis za isti izdelek in naslov že shranjen in je bil posodobljen. */
  updated: boolean;
}

/**
 * Za isti izdelek in e-poštni naslov obstaja največ en zapis. Ponovna oddaja
 * nadomesti količino z zadnjo izbrano (količin ne sešteva) in osveži privolitev.
 */
export interface InterestRepository {
  save(input: SaveInterestInput): Promise<SaveInterestResult>;
}
