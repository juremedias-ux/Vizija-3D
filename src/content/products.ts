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
 * Opomba: slike prvih treh izdelkov so obrezani posnetki zaslona sličic 3D modelov
 * (nizka ločljivost). Pred javno objavo jih zamenjaj z lastnimi fotografijami
 * natisnjenih izdelkov oziroma potrdi pravice za njihovo uporabo.
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
    id: "drzalo-za-metlo",
    order: 1,
    name: "Držalo za metlo",
    description:
      "Pritrdi metlo na njeno stalno mesto, da je pospravljena in vedno pri roki.",
    category: "Pohištvo",
    imageSrc: "/izdelki/drzalo-za-metlo.jpg",
    imageAlt:
      "Prikaz 3D modela: oranžno držalo, pritrjeno z vijakoma, v katerem je modra palica metle.",
    imageIsConcept: false,
    status: "in-development",
    interestEnabled: true,
  },
  {
    id: "skatlica-za-metke",
    order: 2,
    name: "Škatlica za metke",
    description:
      "Pospravi metke na njihovo mesto in jih urejene vzemi s seboj.",
    category: "Orožje in hobi",
    imageSrc: "/izdelki/skatlica-za-metke.jpg",
    imageAlt:
      "Sive okrogle škatlice s pokrovi z oznakami 22 MAG, 44 MAG in 9MM na lesenem pultu; ena škatlica je odprta in v njej so metki.",
    imageIsConcept: false,
    status: "in-development",
    interestEnabled: true,
  },
  {
    id: "podloga-za-zapestje",
    order: 3,
    name: "Podloga za zapestje",
    description:
      "Nasloni zapestje med delom za mizo. Podloga pomaga zmanjšati utrujenost zapestja.",
    category: "Pisarniški pripomočki",
    imageSrc: "/izdelki/podloga-za-zapestje.jpg",
    imageAlt:
      "Prikaz 3D modela: svetla ukrivljena podloga za zapestje s šestkotnim vzorcem na zgornji ploskvi.",
    imageIsConcept: false,
    status: "in-development",
    interestEnabled: true,
  },
  ...Array.from({ length: 7 }, (_, index): ProductSlot => {
    const order = index + 4;
    return {
      id: `mesto-${String(order).padStart(2, "0")}`,
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
