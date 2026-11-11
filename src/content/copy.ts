/** Ključna besedila, ki se pojavijo na več mestih ali morajo ostati dobesedno enaka. */

/** Obvezen naslov — ne spreminjaj besedila, črkovanja ali ločil. */
export const HERO_HEADLINE_LINES = [
  "fotografiraj prostor,",
  "si umesti izdelke,",
  "naroči izdelavo.",
] as const;

export const HERO_HEADLINE = HERO_HEADLINE_LINES.join(" ");

export const HERO_LEAD =
  "Razvijamo platformo, na kateri boš lahko fotografiral svoj prostor, vanj umestil naše izdelke in naročil izdelavo. Za zdaj razišči ponudbo in oddaj nezavezujoče zanimanje.";

export const PRICE_NOTE = "Cena bo objavljena ob začetku prodaje.";

export const DEVELOPMENT_NOTICE =
  "Izdelki in vizualizacija prostora so v razvoju.";
