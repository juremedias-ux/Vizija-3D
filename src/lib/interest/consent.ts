/**
 * Privolitev in obvestila ob oddaji zanimanja.
 *
 * Obiskovalec privolitev da z oddajo obrazca: pred oddajo je ob polju za
 * e-pošto prikazano besedilo EMAIL_USAGE_TEXT (namen uporabe naslova).
 * Ločenega potrditvenega polja ni (odločitev lastnika, 12. 11. 2026).
 *
 * Ob vsaki vsebinski spremembi besedila ali načina privolitve povečaj
 * CONSENT_TEXT_VERSION. Različica se shrani ob vsaki prijavi.
 */
export const CONSENT_TEXT_VERSION = "2026-11-v2";

export const EMAIL_USAGE_TEXT =
  "Tvoj e-poštni naslov bomo uporabili za obvestilo o razpoložljivosti izbranega izdelka.";

/** Prikaže se v potrditvi po oddaji. */
export const NON_BINDING_NOTICE =
  "Izdelek je v razvoju. Oddaja pomeni nezavezujočo prijavo zanimanja, brez plačila.";
