import type { Metadata } from "next";
import Link from "next/link";

import { buttonClasses } from "@/components/ui/styles";

export const metadata: Metadata = {
  title: "O platformi",
  description:
    "Vizija 3D pomaga hobi uporabnikom od ideje do datoteke za 3D tisk — brez znanja 3D oblikovanja.",
};

const works = [
  "ustvarjanje modela iz opisa (v demo načinu iz preprostih predlog),",
  "ustvarjanje reliefa iz fotografije ali skice (v demo načinu),",
  "nalaganje in urejanje modelov STL, OBJ in GLB (velikost, vrtenje),",
  "interaktivni 3D predogled,",
  "osnovno preverjanje in samodejni popravek za tisk,",
  "prenos STL, GLB in paketa ZIP s specifikacijo,",
  "shranjevanje projektov v brskalniku (Moji modeli).",
];

const notYet = [
  "plačila, naročnine in uporabniški računi,",
  "naročanje tiska ali pošiljanje datotek tiskarnam,",
  "napredno urejanje naloženih modelov (luknje, napisi, rezanje),",
  "ustvarjanje z umetno inteligenco, dokler skrbnik ne poveže ponudnika.",
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
      <p className="text-sm font-semibold text-accent">O platformi</p>
      <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-fg sm:text-5xl">
        Od ideje do datoteke za 3D tisk
      </h1>
      <div className="mt-8 grid gap-10 text-lg leading-relaxed text-fg-muted">
        <p>
          Vizija 3D je platforma za vse, ki bi radi 3D tiskali, pa ne znajo
          uporabljati programov za 3D oblikovanje. Opišeš predmet, naložiš sliko
          ali svoj model, ga predogledaš, prilagodiš in preneseš datoteko,
          pripravljeno za tisk.
        </p>
        <section aria-labelledby="zakaj-naslov">
          <h2
            id="zakaj-naslov"
            className="font-display text-2xl font-semibold text-fg"
          >
            Prva različica
          </h2>
          <p className="mt-3">
            To je prva različica (MVP), s katero preverjamo, ali je tak način
            ustvarjanja uporaben za hobi uporabnike. Zato je preprosta,
            brezplačna in brez registracije.
          </p>
        </section>
        <section aria-labelledby="deluje-naslov">
          <h2
            id="deluje-naslov"
            className="font-display text-2xl font-semibold text-fg"
          >
            Kaj že deluje
          </h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-base">
            {works.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
        <section aria-labelledby="se-ne-naslov">
          <h2
            id="se-ne-naslov"
            className="font-display text-2xl font-semibold text-fg"
          >
            Česa še ni
          </h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-base">
            {notYet.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
        <p className="text-base">
          Pred tiskom vedno preveri dimenzije, debelino sten in geometrijo
          modela. Več o tem v{" "}
          <Link
            href="/pomoc"
            className="text-accent underline underline-offset-4"
          >
            pomoči
          </Link>
          .
        </p>
        <div>
          <Link href="/studio" className={buttonClasses("primary", "lg")}>
            Začni brezplačno
          </Link>
        </div>
      </div>
    </div>
  );
}
