# Vizija 3D — spletno mesto

Spletno mesto blagovne znamke Vizija 3D, ki razvija uporabne 3D-tiskane izdelke za dom in delovni prostor. Mesto predstavi znamko, prikaže katalog z desetimi mesti za izdelke, zbira **nezavezujoče prijave zanimanja** (e-pošta in količina za posamezen izdelek) in predstavi prihodnjo funkcijo vizualizacije izdelkov v fotografiranem prostoru.

Spletno mesto ne omogoča plačil, nakupov, izračuna dostave ali klasičnega zaključka nakupa. Vizualizacija prostora še ne deluje; prikazan je le statičen konceptni prikaz.

## Tehnologije

- Next.js 16 (App Router, Turbopack), React 19, TypeScript
- Tailwind CSS 4
- SQLite prek vgrajenega modula Node.js `node:sqlite` (brez dodatnih paketov)
- Vitest (enotski testi), Playwright (testi v brskalniku)

Brez analitike, oglasnih sledilnikov in piškotkov. Pisave (Space Grotesk, IBM Plex Sans, IBM Plex Mono) se ob gradnji prenesejo z Google Fonts in nato strežejo z lastnega strežnika; obiskovalčev brskalnik ne pošilja zahtev Googlu.

## Zahteve

- **Node.js 22.13 ali novejši** (zaradi `node:sqlite`). Node 22 ob zagonu izpiše opozorilo `ExperimentalWarning: SQLite is an experimental feature`; opozorilo ne vpliva na delovanje.
- Za gradnjo (`npm run build`) je potreben dostop do `fonts.googleapis.com` (prenos pisav).

## Zagon

```bash
npm install
```

```bash
npm run dev
```

Razvojni strežnik teče na http://localhost:3000.

Produkcijska gradnja in zagon:

```bash
npm run build
```

```bash
npm run start
```

Nastavitve okolja kopiraj iz `.env.example` v `.env.local` in jih po potrebi prilagodi.

## Struktura

```
src/
  app/                      strani, postavitev, API
    page.tsx                začetna stran
    zasebnost/page.tsx      stran Zasebnost
    api/zanimanje/route.ts  POST /api/zanimanje (shranjevanje prijav)
  components/
    layout/                 glava, noga, logotip
    sections/               razdelki začetne strani
    product/                kartice izdelkov, obrazec, povečan prikaz slike
    graphics/               konceptne grafike (SVG)
    ui/                     skupni gradniki
  config/
    site.ts                 ime, kontakt, družbena omrežja, navigacija
    privacy.ts              podatki za stran Zasebnost (IZPOLNI PRED OBJAVO)
  content/
    products.ts             KATALOG IZDELKOV (edini vir podatkov o izdelkih)
    faq.ts                  pogosta vprašanja
    copy.ts                 obvezna besedila (naslov, opis)
  features/room-visualization/  konceptni prikaz in tipi za prihodnjo vizualizacijo
  lib/
    interest/               preverjanje vnosov, besedilo privolitve, tipi
    server/                 baza, shramba prijav, omejevanje zahtev, obdelava zahtev
public/izdelki/             slike izdelkov
scripts/prijave.mjs         povzetek, izvoz in izbris prijav iz ukazne vrstice
tests/unit, tests/e2e       testi
```

## Urejanje izdelkov in slik

Vsi izdelki so v datoteki `src/content/products.ts`. Katalog ima natanko deset mest; vsak zapis ima polja:

| Polje | Pomen |
| --- | --- |
| `id` | stalni identifikator (shrani se ob prijavi; ne spreminjaj ga, ko so prijave že oddane) |
| `order` | vrstni red prikaza (1–10) |
| `name`, `description`, `category` | besedila na kartici (`category: null` pomeni, da kategorija ni prikazana) |
| `imageSrc`, `imageAlt` | pot do slike v `public/` in opis slike za bralnike zaslona |
| `imageIsConcept` | `true`, če slika ni fotografija izdelka (prikaže se oznaka »Konceptna grafika«) |
| `status` | `"in-development"` (predstavljen izdelek) ali `"coming-soon"` (prazno mesto »Nov izdelek prihaja«) |
| `interestEnabled` | ali ima kartica obrazec za oddajo zanimanja |

**Zamenjava slike:** shrani fotografijo v `public/izdelki/` (npr. `public/izdelki/drzalo-za-metlo.jpg`), v zapisu nastavi `imageSrc: "/izdelki/drzalo-za-metlo.jpg"`, posodobi `imageAlt` in pusti `imageIsConcept: false`. Slike so prikazane v razmerju 4 : 3; Next.js jih samodejno pomanjša in optimizira.

**Aktivacija praznega mesta:** nastavi `status: "in-development"`, izpolni `name`, `description`, `imageSrc`, `imageAlt` in po želji `interestEnabled: true`. Komponent ni treba spreminjati.

Predstavljeni izdelki so prikazani v mreži (1 stolpec na telefonu, 2 na tablici, 3 na namiznem zaslonu), prazna mesta pa pod njimi v kompaktni mreži. Znotraj obeh skupin velja vrstni red iz polja `order`.

### Trenutni izdelki

| Mesto | id | Ime | Kategorija |
| --- | --- | --- | --- |
| 1 | `drzalo-za-metlo` | Držalo za metlo | Pohištvo |
| 2 | `skatlica-za-metke` | Škatlica za metke | Orožje in hobi |
| 3 | `podloga-za-zapestje` | Podloga za zapestje | Pisarniški pripomočki |
| 4–10 | `mesto-04` … `mesto-10` | Nov izdelek prihaja | — |

Slike v `public/izdelki/` so obrezani posnetki zaslona sličic 3D modelov (izvirniki so široki približno 320–360 slikovnih pik). Obrezani so tako, da ni angleških napisov, imen datotek, datumov in tujega logotipa; zaradi povečave so nekoliko zamegljeni. Pred javno objavo jih zamenjaj z lastnimi fotografijami natisnjenih izdelkov (priporočeno vsaj 1600 × 1200 slikovnih pik, razmerje 4 : 3).

Prva slika je vsebovala logotip drugega avtorja, kar kaže, da slika in morda tudi 3D model nista avtorska. Pred prodajo preveri licenco vsakega modela (ali dovoljuje komercialno prodajo natisnjenih izdelkov) in pravico do uporabe slik.

Ne dodajaj podatkov, ki niso potrjeni: cen, materialov, mer, nosilnosti, certifikatov, rokov izdelave ali ocen kupcev. Cena je povsod navedena kot »Cena bo objavljena ob začetku prodaje.«

## Prijave zanimanja

### Kje se shranjujejo

Prijave se shranjujejo v datoteko SQLite, ki jo določa spremenljivka `DATABASE_PATH` (privzeto `data/vizija3d.sqlite`; mapa `data/` ni v sistemu git). Datoteka in tabela se ustvarita samodejno ob prvi prijavi.

Tabela `interest_submissions`:

| Stolpec | Vsebina |
| --- | --- |
| `id` | enolični identifikator (UUID) |
| `product_id` | identifikator izdelka iz `products.ts` |
| `email` | e-poštni naslov (pretvorjen v male črke) |
| `quantity` | celo število 1–99 |
| `status` | `active`, `notified` ali `withdrawn` |
| `consent_at`, `consent_text_version` | čas privolitve in različica besedila privolitve |
| `created_at`, `updated_at` | čas prve oddaje in zadnje posodobitve (UTC, ISO 8601) |

Za isti izdelek in e-poštni naslov obstaja največ en zapis (`UNIQUE (product_id, email)`). Ponovna oddaja **nadomesti** količino z zadnjo izbrano (količin ne sešteva) in osveži čas privolitve.

Ob spremembi besedila privolitve v `src/lib/interest/consent.ts` povečaj `CONSENT_TEXT_VERSION`.

### Zaščita

- preverjanje vseh vnosov na odjemalcu in strežniku (količina 1–99, veljaven e-poštni naslov, obvezna privolitev, obstoječ izdelek z omogočeno oddajo),
- skrito polje (honeypot) za samodejne programe,
- omejevanje števila zahtev na IP naslov (privzeto 20 v 10 minutah; `RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW_MS`),
- zavrnitev zahtev z drugih spletnih mest (`Origin`, `Sec-Fetch-Site`) in zahtev, ki niso JSON ali so prevelike,
- zaščita pred dvojnim klikom na odjemalcu in brez podvojenih zapisov v bazi,
- parametrizirane poizvedbe SQL,
- obrazca ni mogoče oddati, preden se naloži JavaScript.

Končna točka `/api/zanimanje` sprejema samo `POST`. Prijave niso dostopne prek nobene javne končne točke in spletno mesto nima skrbniške plošče.

### Pregled, izvoz in izbris

Na strežniku (z isto vrednostjo `DATABASE_PATH`):

```bash
npm run prijave -- povzetek
```

```bash
npm run prijave -- izvoz > prijave.csv
```

```bash
npm run prijave -- izbrisi ime@domena.si
```

Ukaz `izbrisi` uporabi pri zahtevah za izbris ali umiku privolitve.

### E-poštna obvestila

Pošiljanje e-pošte ni vključeno. Potrditev oddaje se prikaže samo na strani, zato spletno mesto ne trdi, da je bilo poslano potrditveno sporočilo. Obvestila o razpoložljivosti pošlje upravljavec sam (npr. iz izvoza CSV) ali pa se pozneje doda e-poštni ponudnik.

## Gostovanje

SQLite potrebuje **trajen datotečni sistem**. Primerno je gostovanje na strežniku ali v vsebniku s trajnim diskom (npr. VPS ali Docker s priklopljenim nosilcem), kjer `DATABASE_PATH` kaže na ta disk. Na strežniških funkcijah (npr. Vercel, Netlify) je datotečni sistem začasen in podatki bi se izgubili — tam je treba shrambo zamenjati z gostovano bazo. Shramba je ločena za vmesnikom `InterestRepository` (`src/lib/server/interest-repository.ts`), zato zamenjava ne zahteva sprememb obrazca ali komponent.

Omejevanje zahtev deluje v pomnilniku posameznega procesa. Pri več instancah ga je treba prenesti v skupno shrambo (npr. Redis). IP naslov se bere iz glave `X-Forwarded-For`; strežnik naj teče za povratnim posredniškim strežnikom (reverse proxy), ki to glavo nastavi in prepiše vrednosti odjemalca.

Redno varnostno kopiraj datoteko baze (skupaj z datotekama `-wal` in `-shm`, če obstajata).

## Pred javno objavo

1. **Zasebnost** — v `src/config/privacy.ts` vpiši: upravljavca osebnih podatkov (ime/podjetje, naslov, matična ali davčna številka), kontakt za vprašanja o zasebnosti, rok hrambe prijav, postopek za umik privolitve in izbris, ponudnike storitev (gostovanje, baza, morebitni e-poštni ponudnik) in datum posodobitve. Dokler polja niso izpolnjena, stran `/zasebnost` prikazuje opozorilo »Besedilo še ni dokončano«, `npm run build` pa izpiše opozorilo. Besedilo naj pregleda strokovnjak za varstvo osebnih podatkov; spletno mesto ne zagotavlja samodejne skladnosti s predpisi.
2. **Izdelki** — zamenjaj obrezane posnetke zaslona z lastnimi fotografijami ter preveri licence 3D modelov za komercialno prodajo in pravice za uporabo slik. Trditev »pomaga zmanjšati utrujenost zapestja« uporabljaj le, če jo lahko utemeljiš. Ne uporabljaj tujih logotipov ali blagovnih znamk.
3. **Kontakt in družbena omrežja** — po želji vpiši resnične vrednosti v `src/config/site.ts` (prikažejo se samo izpolnjene).
4. **Naslov spletnega mesta** — nastavi `NEXT_PUBLIC_SITE_URL`.
5. **Trajna shramba in varnostne kopije** — nastavi `DATABASE_PATH` na trajni disk ali zamenjaj shrambo z gostovano bazo.
6. **HTTPS in povratni posredniški strežnik** — za pravilno omejevanje zahtev po IP naslovu.
7. **Logotip** — besedilni logotip v `src/components/layout/Logo.tsx` je začasen in ga lahko zamenjaš.

## Testi in preverjanje

```bash
npm test
```

```bash
npm run lint
```

```bash
npm run typecheck
```

```bash
npm run test:e2e
```

`npm run test:e2e` zgradi projekt, zažene strežnik z ločeno testno bazo v začasni mapi sistema in izvede teste v Chromiumu. Pred prvim zagonom namesti brskalnik:

```bash
npx playwright install chromium
```

Testi preverijo navigacijo in mobilni meni, postavitev pri širinah 320–1440 px, povečan prikaz slike s tipkovnico, meje količine, preverjanje e-pošte in privolitve, trajno shranjevanje, ponovno oddajo za isti izdelek, obravnavo napak strežnika in omrežja, preprečevanje dvojnih oddaj, prazna mesta brez obrazcev in ločitev obstoječih in prihodnjih funkcij.

## Prihodnja vizualizacija prostora

Trenutno je v `src/features/room-visualization/` le statičen konceptni prikaz (`RoomConceptPreview.tsx`) in tipi za prihodnje podatke o postavitvi (`types.ts`). Funkcija ne sprejema, ne analizira in ne shranjuje fotografij ter ne kliče zunanjih storitev. Ob razvoju se konceptni prikaz v razdelku `src/components/sections/RoomVision.tsx` zamenja z dejanskim urejevalnikom; preostanek strani ostane nespremenjen.
