# Vizija 3D — spletno mesto

Spletno mesto blagovne znamke Vizija 3D, ki razvija uporabne 3D-tiskane izdelke za dom in delovni prostor. Mesto predstavi znamko, prikaže katalog z desetimi mesti za izdelke, zbira **nezavezujoče prijave zanimanja** (e-pošta in količina za posamezen izdelek) in predstavi prihodnjo funkcijo vizualizacije izdelkov v fotografiranem prostoru.

Spletno mesto ne omogoča plačil, nakupov, izračuna dostave ali klasičnega zaključka nakupa. Vizualizacija prostora še ne deluje; prikazan je le statičen konceptni prikaz.

## Tehnologije

- Next.js 16 (App Router, Turbopack), React 19, TypeScript
- Tailwind CSS 4
- PostgreSQL pri Supabase (paket `postgres`) v produkciji, SQLite (`node:sqlite`) za lokalni razvoj
- Vitest (enotski testi), Playwright (testi v brskalniku)

Brez analitike, oglasnih sledilnikov in piškotkov. Pisave (Space Grotesk, IBM Plex Sans, IBM Plex Mono) se ob gradnji prenesejo z Google Fonts in nato strežejo z lastnega strežnika; obiskovalčev brskalnik ne pošilja zahtev Googlu.

## Zahteve

- **Node.js 22.13 ali novejši.** Lokalno se prijave shranjujejo v SQLite (`node:sqlite`); Node 22 ob tem izpiše opozorilo `ExperimentalWarning: SQLite is an experimental feature`, ki ne vpliva na delovanje.
- V produkciji (Vercel) se prijave shranjujejo v bazo PostgreSQL pri Supabase (spremenljivka `DATABASE_URL`).
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

| Okolje | Shramba | Nastavitev |
| --- | --- | --- |
| Produkcija (Vercel) | PostgreSQL pri Supabase | `DATABASE_URL` (obvezno) |
| Lokalni razvoj | datoteka SQLite | `DATABASE_PATH` (privzeto `data/vizija3d.sqlite`; mapa `data/` ni v sistemu git) |

Če je `DATABASE_URL` nastavljen, se vedno uporabi Supabase. Če na Vercelu ni nastavljen, oddaja vrne napako in obiskovalec ne vidi potrditve (datotečni sistem Vercela ni trajen). Tabela se ob prvi prijavi ustvari samodejno; enak SQL je v `supabase/schema.sql`. V Supabase je za tabelo vklopljen Row Level Security brez pravil, zato do prijav ni dostopa prek javnega API-ja Supabase; spletno mesto do baze dostopa samo s strežnika.

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

Ukazi delujejo z bazo, ki jo določata `DATABASE_URL` (Supabase) ali `DATABASE_PATH` (SQLite):

```bash
npm run prijave -- povzetek
```

```bash
npm run prijave -- izvoz > prijave.csv
```

```bash
npm run prijave -- izbrisi ime@domena.si
```

```bash
npm run prijave -- izbrisi-izdelek drzalo-za-metlo
```

```bash
npm run prijave -- pocisti
```

- `izbrisi` uporabi pri zahtevi za izbris ali umiku privolitve (rok za odgovor je en mesec).
- `izbrisi-izdelek` uporabi, ko pošlješ obvestila o razpoložljivosti izdelka (tako določa rok hrambe na strani Zasebnost).
- `pocisti` izbriše prijave, ki so starejše od 24 mesecev; zaženi ga vsaj enkrat mesečno.

Za bazo Supabase ukaz zaženi na svojem računalniku v mapi projekta, z istim `DATABASE_URL` kot na Vercelu, npr.:

```bash
DATABASE_URL="postgresql://…" npm run prijave -- povzetek
```

### E-poštna obvestila

Pošiljanje e-pošte ni vključeno. Potrditev oddaje se prikaže samo na strani, zato spletno mesto ne trdi, da je bilo poslano potrditveno sporočilo. Obvestila o razpoložljivosti pošlje upravljavec sam (npr. iz izvoza CSV) ali pa se pozneje doda e-poštni ponudnik.

## Gostovanje: Vercel + Supabase

### 1. Supabase (baza za prijave)

1. Na https://supabase.com ustvari projekt. Za regijo izberi podatkovni center v EU (projekt Vizija 3D je v regiji West EU – Ireland, `eu-west-1`).
2. V projektu odpri **Connect** in kopiraj povezavo **Transaction pooler** (vrata `6543`). V njej zamenjaj `[YOUR-PASSWORD]` z geslom baze.
3. Po želji v **SQL Editor** zaženi `supabase/schema.sql` (sicer se tabela ustvari ob prvi prijavi).

### 2. Vercel (spletno mesto in domena)

1. Na https://vercel.com izberi **Add New → Project** in uvozi GitHub repozitorij `Vizija-3D` (veja `main`). Klikni **Deploy**.
2. V **Settings → Environment Variables** dodaj (obe samo za okolje **Production**):
   - `NEXT_PUBLIC_SITE_URL` = javni naslov strani, npr. `https://vizija-3d.vercel.app` — navadna spremenljivka, stikalo **Sensitive** izklopljeno,
   - `DATABASE_URL` = povezava iz Supabase (korak 1.2) — skrivnost, stikalo **Sensitive** vklopljeno.
3. V **Settings → Functions** za regijo funkcij izberi regijo v EU, ki je najbližje bazi: za Supabase `eu-west-1` (Irska) je to Dublin (`dub1`).
4. V **Deployments** pri zadnji namestitvi izberi **⋯ → Redeploy**. Spremenljivke in regija začnejo veljati šele z novo namestitvijo.
5. Lastno domeno dodaš v **Settings → Domains**.

Vercel ob vsaki spremembi na veji `main` spletno mesto samodejno ponovno namesti.

### Omejitve

- Omejevanje števila oddaj deluje v pomnilniku posamezne strežniške funkcije, zato je na Vercelu le osnovna zaščita. Za strožjo zaščito ga je treba prenesti v skupno shrambo.
- Varnostne kopije baze ureja Supabase glede na izbrani paket; preveri jih v nastavitvah projekta.

## Pred javno objavo

1. **Zasebnost** — v `src/config/privacy.ts` manjka še kontaktni e-poštni naslov (`contact`). Dokler ni vpisan, stran `/zasebnost` prikazuje opozorilo »Besedilo še ni dokončano«, `npm run build` pa izpiše opozorilo. Če je Vizija 3D registrirana dejavnost (s.p. ali d.o.o.), pri upravljavcu navedi polno registrirano ime in naslov. Besedilo naj pregleda strokovnjak za varstvo osebnih podatkov; spletno mesto ne zagotavlja samodejne skladnosti s predpisi.
2. **Izdelki** — zamenjaj obrezane posnetke zaslona z lastnimi fotografijami ter preveri licence 3D modelov za komercialno prodajo in pravice za uporabo slik. Trditev »pomaga zmanjšati utrujenost zapestja« uporabljaj le, če jo lahko utemeljiš. Ne uporabljaj tujih logotipov ali blagovnih znamk.
3. **Kontakt in družbena omrežja** — po želji vpiši resnične vrednosti v `src/config/site.ts` (prikažejo se samo izpolnjene).
4. **Naslov spletnega mesta** — nastavi `NEXT_PUBLIC_SITE_URL`.
5. **Supabase in Vercel** — nastavi `DATABASE_URL` in regijo funkcij (glej poglavje Gostovanje).
6. **Logotip** — besedilni logotip v `src/components/layout/Logo.tsx` je začasen in ga lahko zamenjaš.

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
