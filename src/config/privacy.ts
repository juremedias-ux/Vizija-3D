/**
 * PODATKI ZA STRAN »ZASEBNOST« — IZPOLNI PRED JAVNO OBJAVO.
 *
 * Vsako polje z vrednostjo null se na strani /zasebnost prikaže kot jasno
 * označeno manjkajoče polje, gradnja (npm run build) pa izpiše opozorilo.
 * Ne vpisuj izmišljenih podatkov. Besedilo naj pred objavo pregleda
 * strokovnjak za varstvo osebnih podatkov.
 *
 * Ta datoteka ne sme uvažati drugih modulov projekta (uporablja jo tudi next.config.ts).
 */

export interface PrivacyConfig {
  /** Upravljavec: polno ime podjetja ali osebe, naslov, matična/davčna številka. */
  controller: string | null;
  /** Kontakt za vprašanja o zasebnosti, npr. e-poštni naslov. */
  contact: string | null;
  /** Kako dolgo hranite prijave, npr. »do začetka prodaje izdelka in največ 24 mesecev«. */
  retentionPeriod: string | null;
  /** Kako obiskovalec umakne privolitev ali zahteva izbris (npr. e-pošta s predmetom »Izbris«). */
  withdrawalAndDeletion: string | null;
  /** Ponudniki storitev, ki obdelujejo podatke (gostovanje, baza, e-poštni ponudnik). */
  serviceProviders: string | null;
  /** Datum zadnje posodobitve besedila, npr. »11. 11. 2026«. */
  lastUpdated: string | null;
}

export const privacyConfig: PrivacyConfig = {
  controller: "Vizija 3D",
  // Vpiši točen kontaktni e-poštni naslov (npr. "info@domena.si").
  contact: null,
  retentionPeriod:
    "Prijavo hranimo, dokler te ne obvestimo o razpoložljivosti izbranega izdelka; po poslanem obvestilu jo izbrišemo. Če izdelek ne bo na voljo, prijavo izbrišemo najpozneje 24 mesecev po zadnji oddaji ali posodobitvi. Če prej umakneš privolitev, prijavo izbrišemo ob umiku.",
  withdrawalAndDeletion:
    "Za umik privolitve ali izbris piši na kontaktni e-poštni naslov, naveden zgoraj, in navedi e-poštni naslov, s katerim si oddal zanimanje. Vse prijave za ta naslov izbrišemo brez nepotrebnega odlašanja, najpozneje v enem mesecu.",
  serviceProviders:
    "Vercel Inc. – gostovanje spletnega mesta in obdelava oddanih obrazcev.\nSupabase Inc. – podatkovna baza, v kateri so shranjene prijave.",
  lastUpdated: "12. 11. 2026",
};

export const privacyFieldLabels: Record<keyof PrivacyConfig, string> = {
  controller: "Upravljavec osebnih podatkov",
  contact: "Kontakt za vprašanja o zasebnosti",
  retentionPeriod: "Rok hrambe",
  withdrawalAndDeletion: "Umik privolitve in zahteve za izbris",
  serviceProviders: "Ponudniki storitev",
  lastUpdated: "Datum zadnje posodobitve",
};

export function getMissingPrivacyFields(
  config: PrivacyConfig = privacyConfig,
): (keyof PrivacyConfig)[] {
  return (Object.keys(privacyFieldLabels) as (keyof PrivacyConfig)[]).filter(
    (key) => !config[key] || config[key]?.trim() === "",
  );
}
