import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Pomoč",
  description:
    "Preprosta razlaga 3D modelov in 3D tiska: kaj je STL, zakaj model včasih ni primeren za tisk, kako izbrati velikost in debelino sten.",
};

const sections: { id: string; title: string; body: ReactNode }[] = [
  {
    id: "kaj-je-3d-model",
    title: "Kaj je 3D model?",
    body: (
      <p>
        3D model je digitalna oblika predmeta, ki ima širino, globino in višino.
        Program za tisk (t. i. slicer) iz modela pripravi navodila za tiskalnik,
        ki predmet natisne sloj za slojem.
      </p>
    ),
  },
  {
    id: "stl",
    title: "Kaj so STL, GLB in OBJ?",
    body: (
      <ul className="list-disc space-y-2 pl-5">
        <li>
          <strong className="text-fg">STL</strong> je najpogostejša datoteka za
          3D tisk. Vsebuje samo obliko predmeta, brez barve. To datoteko odpreš
          v programu za tisk.
        </li>
        <li>
          <strong className="text-fg">GLB</strong> je datoteka za ogled in
          deljenje 3D modelov. Vsebuje tudi barvo in jo odpreš v večini
          pregledovalnikov 3D modelov.
        </li>
        <li>
          <strong className="text-fg">OBJ</strong> je starejša, zelo razširjena
          oblika za izmenjavo modelov med programi.
        </li>
      </ul>
    ),
  },
  {
    id: "tiskalnost",
    title: "Zakaj model včasih ni primeren za tisk?",
    body: (
      <>
        <p>Najpogostejši razlogi so:</p>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>
            <strong className="text-fg">Luknje v površini</strong> — model ima
            odprto ali nepovezano geometrijo, zato tiskalnik ne ve, kaj je
            znotraj in kaj zunaj.
          </li>
          <li>
            <strong className="text-fg">Pretanke stene</strong> — deli, tanjši
            od približno 0,8 mm, se pogosto ne natisnejo.
          </li>
          <li>
            <strong className="text-fg">Previsi</strong> — deli, ki visijo v
            zraku, potrebujejo podpore, ki jih program za tisk doda samodejno.
          </li>
          <li>
            <strong className="text-fg">Napačna velikost</strong> — model je
            prevelik za tiskalnik ali tako majhen, da se podrobnosti izgubijo.
          </li>
        </ul>
        <p className="mt-3">
          Studio pred prenosom preveri osnovne težave in jih poskuša popraviti z
          gumbom »Poskusi popraviti model«. Preverjanje je osnovno, zato model
          vedno preveri tudi v programu za tisk.
        </p>
      </>
    ),
  },
  {
    id: "velikost",
    title: "Kako izbrati velikost?",
    body: (
      <ul className="list-disc space-y-2 pl-5">
        <li>
          Izmeri prostor, kamor boš predmet postavil, in v opis zapiši mere,
          npr. »12 x 8 x 3 cm«.
        </li>
        <li>
          Tipična tiskalna plošča hobi tiskalnika meri okoli 22 × 22 cm, zato
          naj bo predmet manjši od tega.
        </li>
        <li>Podrobnosti, manjše od 1 mm, se pri tisku pogosto izgubijo.</li>
        <li>
          Mere lahko kadar koli spremeniš v koraku »Predogled in urejanje«.
        </li>
      </ul>
    ),
  },
  {
    id: "debelina",
    title: "Kako izbrati debelino sten?",
    body: (
      <ul className="list-disc space-y-2 pl-5">
        <li>
          <strong className="text-fg">Tanko (1,2 mm)</strong> — za lahke
          okraske, ki se jih ne bo veliko dotikalo.
        </li>
        <li>
          <strong className="text-fg">Običajno (2 mm)</strong> — dobra izbira za
          večino predmetov.
        </li>
        <li>
          <strong className="text-fg">Debelo (3,2 mm)</strong> — za predmete, ki
          morajo zdržati obremenitev.
        </li>
      </ul>
    ),
  },
  {
    id: "pravila",
    title: "Pravila uporabe",
    body: (
      <ul className="list-disc space-y-2 pl-5">
        <li>
          Nalagaj samo slike in modele, ki si jih ustvaril sam ali imaš pravico
          za njihovo uporabo. Za naložene vsebine si odgovoren sam.
        </li>
        <li>
          Ne ustvarjaj in ne nalagaj orožja, delov orožja, eksplozivov ali
          drugih nevarnih ali nezakonitih predmetov. Takih opisov Studio ne
          sprejme.
        </li>
        <li>
          Ne uporabljaj zaščitenih logotipov, znamk ali likov brez dovoljenja
          imetnika pravic.
        </li>
        <li>
          Modeli iz umetne inteligence niso vedno natančni. Za funkcionalne ali
          mehanske dele uporabi CAD program.
        </li>
      </ul>
    ),
  },
];

const faq = [
  {
    q: "Ali je uporaba brezplačna?",
    a: "Da. Prva različica platforme je brezplačna in ne zahteva registracije.",
  },
  {
    q: "Kje se shranijo moji modeli?",
    a: "V tvojem brskalniku (Moji modeli). Na naš strežnik jih ne pošiljamo. Če je vklopljeno ustvarjanje z umetno inteligenco, se opis in slike pošljejo ponudniku, ki model ustvari.",
  },
  {
    q: "Kaj je demo način?",
    a: "Če ponudnik umetne inteligence ni povezan, Studio iz opisa sestavi model iz preprostih predlog (npr. posoda, škatla, vaza, obesek), iz slike pa naredi relief. Celoten postopek do prenosa datoteke deluje.",
  },
  {
    q: "Ali bo model takoj primeren za tisk?",
    a: "Ne vedno. Studio preveri osnovne težave in jih poskuša popraviti, vendar pred tiskom vedno preveri dimenzije, debelino sten in geometrijo modela.",
  },
  {
    q: "Ali lahko pri vas naročim tisk?",
    a: "Še ne. Prenesi datoteko STL ali paket ZIP in ga pošlji tiskarni ali natisni na svojem tiskalniku.",
  },
  {
    q: "Zakaj naloženemu modelu ne morem dodati luknje ali napisa?",
    a: "V prvi različici lahko naložene modele in modele umetne inteligence povečaš, pomanjšaš in zavrtiš. Luknje, napise in debelino sten lahko spreminjaš pri modelih, ustvarjenih iz opisa.",
  },
  {
    q: "Katere datoteke lahko naložim?",
    a: "3D modele STL, OBJ in GLB do 60 MB ter slike PNG, JPG in WEBP do 15 MB.",
  },
];

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
      <p className="text-sm font-semibold text-accent">Pomoč</p>
      <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-fg sm:text-5xl">
        3D tisk, razložen preprosto
      </h1>
      <nav aria-label="Vsebina pomoči" className="mt-8">
        <ul className="flex flex-wrap gap-2">
          {sections.map((section) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                className="inline-flex min-h-10 items-center rounded-full bg-surface-1 px-4 text-sm text-fg-muted ring-1 ring-white/10 hover:text-fg"
              >
                {section.title}
              </a>
            </li>
          ))}
          <li>
            <a
              href="#vprasanja"
              className="inline-flex min-h-10 items-center rounded-full bg-surface-1 px-4 text-sm text-fg-muted ring-1 ring-white/10 hover:text-fg"
            >
              Pogosta vprašanja
            </a>
          </li>
        </ul>
      </nav>

      <div className="mt-12 grid gap-12 text-base leading-relaxed text-fg-muted">
        {sections.map((section) => (
          <section
            key={section.id}
            id={section.id}
            aria-labelledby={`${section.id}-naslov`}
          >
            <h2
              id={`${section.id}-naslov`}
              className="font-display text-2xl font-semibold tracking-tight text-fg"
            >
              {section.title}
            </h2>
            <div className="mt-3">{section.body}</div>
          </section>
        ))}

        <section id="vprasanja" aria-labelledby="vprasanja-pomoc-naslov">
          <h2
            id="vprasanja-pomoc-naslov"
            className="font-display text-2xl font-semibold tracking-tight text-fg"
          >
            Pogosta vprašanja
          </h2>
          <ul className="mt-4 border-t border-white/10">
            {faq.map((item) => (
              <li key={item.q} className="border-b border-white/10">
                <details className="group">
                  <summary className="flex min-h-16 cursor-pointer items-center justify-between gap-4 py-4 font-display text-lg font-semibold text-fg hover:text-accent">
                    <h3>{item.q}</h3>
                    <span
                      aria-hidden="true"
                      className="grid size-8 shrink-0 place-items-center rounded-full bg-white/[0.08] transition-transform group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <p className="pb-6">{item.a}</p>
                </details>
              </li>
            ))}
          </ul>
        </section>

        <p>
          Kako obdelujemo podatke, si preberi na strani{" "}
          <Link
            href="/zasebnost"
            className="text-accent underline underline-offset-4"
          >
            Zasebnost
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
