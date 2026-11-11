/**
 * Osnovni podatki spletnega mesta.
 *
 * Kontaktni podatki in povezave na družbena omrežja se prikažejo samo,
 * če so tukaj vpisane resnične vrednosti. Prazne vrednosti (null ali [])
 * pomenijo, da se element ne prikaže.
 */

export interface SocialLink {
  /** Ime omrežja, npr. "Instagram". */
  label: string;
  href: string;
}

export const siteConfig = {
  name: "Vizija 3D",
  description:
    "Uporabne ideje za dom in delovni prostor, izdelane s 3D tiskanjem.",
  /** Javni naslov spletnega mesta, npr. https://www.primer.si (spremenljivka NEXT_PUBLIC_SITE_URL). */
  url: process.env.NEXT_PUBLIC_SITE_URL?.trim() || null,
  contact: {
    /** Javni kontaktni e-poštni naslov, npr. "info@primer.si". */
    email: null as string | null,
  },
  social: [] as SocialLink[],
};

export const navigation = [
  { label: "Izdelki", href: "/#izdelki" },
  { label: "Kako deluje", href: "/#kako-deluje" },
  { label: "Vizualizacija", href: "/#vizualizacija" },
  { label: "Pogosta vprašanja", href: "/#vprasanja" },
] as const;
