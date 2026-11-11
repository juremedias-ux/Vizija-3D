/**
 * Katalog izdelkov Vizija 3D — edini vir podatkov o izdelkih.
 *
 * Katalog ima natanko deset mest (MAX_PRODUCT_SLOTS). Vsako mesto je en zapis.
 *
 * Kako uredim izdelek:
 *  - name, description, category: besedila, ki jih vidi obiskovalec.
 *  - imageSrc: pot do slike v mapi /public (npr. "/izdelki/stojalo.webp").
 *  - imageAlt: opis slike za bralnike zaslona.
 *  - imageIsConcept: true, če slika ni fotografija izdelka, ampak konceptna grafika.
 *  - status: "in-development" (izdelek je predstavljen) ali "coming-soon" (prazno mesto).
 *  - interestEnabled: ali je na kartici obrazec za oddajo zanimanja.
 *  - order: vrstni red prikaza (1–10).
 *
 * Kako aktiviram prazno mesto:
 *  nastavi status na "in-development", izpolni name, description, imageSrc, imageAlt
 *  in po želji interestEnabled: true. Komponent ni treba spreminjati.
 *
 * Polja id ne spreminjaj, ko so za izdelek že oddane prijave — id je shranjen v bazi.
 *
 * Opomba: priložene fotografije izdelkov ob izdelavi spletnega mesta niso bile
 * na voljo, zato imajo prva tri mesta nevtralna delovna imena in konceptne grafike.
 * Pred javno objavo jih zamenjaj s potrjenimi podatki in fotografijami.
 */

export const MAX_PRODUCT_SLOTS = 10;

export type ProductStatus = "in-development" | "coming-soon";

export interface ProductSlot {
  /** Stalni identifikator; shranjen ob vsaki prijavi zanimanja. */
  id: string;
  /** Vrstni red prikaza, 1–10. */
  order: number;
  name: string | null;
  description: string | null;
  /** Kategorija, če je znana. */
  category: string | null;
  imageSrc: string | null;
  imageAlt: string | null;
  /** Slika je konceptna grafika in ne fotografija izdelka. */
  imageIsConcept: boolean;
  status: ProductStatus;
  /** Ali obiskovalci lahko oddajo nezavezujoče zanimanje. */
  interestEnabled: boolean;
}

export const products: ProductSlot[] = [
  {
    id: "izdelek-01",
    order: 1,
    name: "Izdelek 01",
    description:
      "Uporaben izdelek za dom ali delovni prostor, izdelan s 3D tiskanjem. Podrobnosti objavimo, ko bo razvoj zaključen.",
    category: null,
    imageSrc: "/izdelki/koncept-01.svg",
    imageAlt:
      "Konceptna grafika: abstraktna kvadrasta oblika z vidnimi tiskarskimi sloji na mreži. Fotografija izdelka bo dodana.",
    imageIsConcept: true,
    status: "in-development",
    interestEnabled: true,
  },
  {
    id: "izdelek-02",
    order: 2,
    name: "Izdelek 02",
    description:
      "Uporaben izdelek za dom ali delovni prostor, izdelan s 3D tiskanjem. Podrobnosti objavimo, ko bo razvoj zaključen.",
    category: null,
    imageSrc: "/izdelki/koncept-02.svg",
    imageAlt:
      "Konceptna grafika: abstraktna valjasta oblika z vidnimi tiskarskimi sloji na mreži. Fotografija izdelka bo dodana.",
    imageIsConcept: true,
    status: "in-development",
    interestEnabled: true,
  },
  {
    id: "izdelek-03",
    order: 3,
    name: "Izdelek 03",
    description:
      "Uporaben izdelek za dom ali delovni prostor, izdelan s 3D tiskanjem. Podrobnosti objavimo, ko bo razvoj zaključen.",
    category: null,
    imageSrc: "/izdelki/koncept-03.svg",
    imageAlt:
      "Konceptna grafika: abstraktna stopničasta oblika z vidnimi tiskarskimi sloji na mreži. Fotografija izdelka bo dodana.",
    imageIsConcept: true,
    status: "in-development",
    interestEnabled: true,
  },
  ...Array.from({ length: 7 }, (_, index): ProductSlot => {
    const order = index + 4;
    return {
      id: `izdelek-${String(order).padStart(2, "0")}`,
      order,
      name: null,
      description: null,
      category: null,
      imageSrc: null,
      imageAlt: null,
      imageIsConcept: false,
      status: "coming-soon",
      interestEnabled: false,
    };
  }),
];

/** Mesto je predstavljen izdelek (in ne prazno mesto). */
export function isPresentedProduct(
  slot: ProductSlot,
): slot is ProductSlot & { name: string; imageSrc: string; imageAlt: string } {
  return (
    slot.status !== "coming-soon" &&
    Boolean(slot.name) &&
    Boolean(slot.imageSrc) &&
    Boolean(slot.imageAlt)
  );
}

/** Izdelki, razvrščeni po polju order. */
export function getProductSlots(): ProductSlot[] {
  return [...products].sort((a, b) => a.order - b.order);
}

/** Izdelek, za katerega je oddaja zanimanja dovoljena, ali null. */
export function findInterestProduct(id: unknown): ProductSlot | null {
  if (typeof id !== "string") return null;
  const slot = products.find((product) => product.id === id);
  if (!slot || !slot.interestEnabled || !isPresentedProduct(slot)) return null;
  return slot;
}
