import type { Metadata } from "next";
import Link from "next/link";

import {
  type PrivacyConfig,
  getMissingPrivacyFields,
  privacyConfig,
  privacyFieldLabels,
} from "@/config/privacy";

export const metadata: Metadata = {
  title: "Zasebnost",
  description:
    "Kako Vizija 3D obdeluje e-poštni naslov in druge podatke, oddane ob nezavezujoči prijavi zanimanja za izdelek.",
};

function ConfigValue({ field }: { field: keyof PrivacyConfig }) {
  const value = privacyConfig[field];
  if (value && value.trim() !== "") {
    return <p className="whitespace-pre-line text-fg">{value}</p>;
  }
  return (
    <p className="rounded-md border border-dashed border-signal/50 bg-signal/5 px-3 py-2 font-mono text-sm text-signal">
      Za dopolnitev: podatek še ni vpisan.
    </p>
  );
}

const configSections: { field: keyof PrivacyConfig; intro?: string }[] = [
  { field: "controller" },
  { field: "contact" },
  { field: "retentionPeriod" },
  {
    field: "withdrawalAndDeletion",
    intro:
      "Privolitev lahko kadar koli umakneš. Umik ne vpliva na zakonitost obdelave pred umikom.",
  },
  {
    field: "serviceProviders",
    intro:
      "Ponudniki, ki za upravljavca izvajajo storitve, kot sta gostovanje spletnega mesta in hramba podatkov.",
  },
];

export default function PrivacyPage() {
  const missing = getMissingPrivacyFields();

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:py-24">
      <p className="font-mono text-xs tracking-[0.18em] text-accent uppercase">
        Pravne informacije
      </p>
      <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-fg sm:text-5xl">
        Zasebnost
      </h1>

      {missing.length > 0 ? (
        <div
          role="note"
          className="mt-8 rounded-lg border border-signal/50 bg-signal/5 p-5 text-sm leading-relaxed text-fg"
        >
          <p className="font-semibold text-signal">Besedilo še ni dokončano.</p>
          <p className="mt-2 text-fg-muted">
            Upravljavec mora pred javno objavo spletnega mesta dopolniti
            naslednje podatke:
          </p>
          <ul className="mt-2 list-disc pl-5 text-fg-muted">
            {missing.map((field) => (
              <li key={field}>{privacyFieldLabels[field]}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-10 grid gap-10 text-base leading-relaxed text-fg-muted">
        <section aria-labelledby="zasebnost-kaj">
          <h2
            id="zasebnost-kaj"
            className="font-display text-2xl font-semibold text-fg"
          >
            Katere podatke zbiramo
          </h2>
          <p className="mt-3">
            Ko oddaš nezavezujoče zanimanje za izdelek, shranimo:
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5">
            <li>e-poštni naslov,</li>
            <li>izbrani izdelek in količino,</li>
            <li>čas oddaje in zadnje posodobitve,</li>
            <li>čas privolitve in različico besedila privolitve.</li>
          </ul>
          <p className="mt-3">
            Ne zbiramo imena, priimka, naslova za dostavo, telefonske številke
            ali plačilnih podatkov.
          </p>
        </section>

        <section aria-labelledby="zasebnost-namen">
          <h2
            id="zasebnost-namen"
            className="font-display text-2xl font-semibold text-fg"
          >
            Namen in podlaga
          </h2>
          <p className="mt-3">
            E-poštni naslov uporabimo samo za obvestilo o razpoložljivosti
            izdelka, za katerega si oddal zanimanje. Podlaga za obdelavo je
            tvoja privolitev, ki jo daš z oddajo obrazca pri izbranem izdelku;
            namen uporabe naslova je naveden ob polju za e-pošto. Naslova ne
            uporabljamo za e-novice ali oglaševanje.
          </p>
          <p className="mt-3">
            Oddaja ni naročilo ali nakup in ne pomeni nobene obveznosti.
          </p>
        </section>

        <section aria-labelledby="zasebnost-tehnicno">
          <h2
            id="zasebnost-tehnicno"
            className="font-display text-2xl font-semibold text-fg"
          >
            Piškotki in tehnični podatki
          </h2>
          <p className="mt-3">
            Spletno mesto ne uporablja analitike, oglasnih sledilnikov ali
            piškotkov za sledenje. Za zaščito pred zlorabo strežnik IP naslov
            začasno hrani v delovnem pomnilniku, da omeji število oddaj; v bazo
            prijav se IP naslov ne shranjuje.
          </p>
          <p className="mt-3">
            Med trenutnim obiskom si spletno mesto zapomni oddani e-poštni
            naslov, da ga ni treba vpisovati pri vsakem izdelku. Naslov se ne
            zapiše v brskalnik in se izbriše, ko zapreš ali osvežiš stran.
          </p>
        </section>

        {configSections.map(({ field, intro }) => (
          <section key={field} aria-labelledby={`zasebnost-${field}`}>
            <h2
              id={`zasebnost-${field}`}
              className="font-display text-2xl font-semibold text-fg"
            >
              {privacyFieldLabels[field]}
            </h2>
            {intro ? <p className="mt-3">{intro}</p> : null}
            <div className="mt-3">
              <ConfigValue field={field} />
            </div>
          </section>
        ))}

        <section aria-labelledby="zasebnost-pravice">
          <h2
            id="zasebnost-pravice"
            className="font-display text-2xl font-semibold text-fg"
          >
            Tvoje pravice
          </h2>
          <p className="mt-3">
            Glede svojih osebnih podatkov lahko zahtevaš dostop, popravek,
            izbris ali omejitev obdelave, umakneš privolitev in vložiš pritožbo
            pri nadzornem organu, Informacijskem pooblaščencu Republike
            Slovenije.
          </p>
        </section>

        <p className="border-t border-line pt-6 font-mono text-sm text-fg-subtle">
          {privacyFieldLabels.lastUpdated}:{" "}
          {privacyConfig.lastUpdated ?? "za dopolnitev"}
        </p>

        <p>
          <Link
            href="/"
            className="text-accent underline underline-offset-4 hover:text-accent-hover"
          >
            Nazaj na začetno stran
          </Link>
        </p>
      </div>
    </div>
  );
}
