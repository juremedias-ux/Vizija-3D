# Vizija 3D — platforma za 3D modele in spletno mesto izdelkov

Vizija 3D je prva različica (MVP) platforme, s katero hobi uporabniki brez znanja 3D oblikovanja ustvarijo, uredijo in pripravijo model za 3D tisk:

1. **ustvari iz besedila** (opis predmeta),
2. **ustvari iz slike** (fotografija, skica ali več referenčnih slik),
3. **uredi obstoječi model** (STL, OBJ, GLB),
4. **predogled** v interaktivnem 3D pogledu (vrtenje, povečava, premik),
5. **priprava za tisk** (osnovno preverjanje in samodejni popravek),
6. **prenos** STL, GLB ali paketa ZIP s specifikacijo.

Na strani `/izdelki` ostane katalog izdelkov Vizija 3D z obrazci za nezavezujoče zanimanje (glej spodaj). Plačil, naročnin, uporabniških računov, e-poštnih obvestil in naročanja tiska ni.

## Tehnologije

- Next.js 16 (App Router, Turbopack), React 19, TypeScript
- Tailwind CSS 4
- Three.js (3D predogled, nalaganje in izvoz modelov) — brez dodatnih knjižnic za ZIP, CSG ali React Three Fiber
- PostgreSQL pri Supabase (paket `postgres`) za prijave zanimanja v produkciji, SQLite (`node:sqlite`) lokalno
- Vitest (enotski testi), Playwright (testi v brskalniku)

Brez analitike, oglasnih sledilnikov in piškotkov. Pisave se ob gradnji prenesejo z Google Fonts in nato strežejo z lastnega strežnika.

## Zahteve

- **Node.js 22.13 ali novejši.** Lokalno se prijave shranjujejo v SQLite (`node:sqlite`); Node 22 ob tem izpiše opozorilo `ExperimentalWarning: SQLite is an experimental feature`, ki ne vpliva na delovanje.
- Za gradnjo (`npm run build`) je potreben dostop do `fonts.googleapis.com` (prenos pisav).

## Zagon lokalno

```bash
npm install
```

```bash
npm run dev
```

Razvojni strežnik teče na http://localhost:3000. Studio je na http://localhost:3000/studio.

Produkcijska gradnja in zagon:

```bash
npm run build
```

```bash
npm run start
```

Nastavitve okolja kopiraj iz `.env.example` v `.env.local`. Za Studio niso potrebne: brez njih deluje demo način.

## Spremenljivke okolja

| Spremenljivka | Obvezna | Namen |
| --- | --- | --- |
| `AI_3D_PROVIDER` | ne | `meshy` vklopi ponudnika umetne inteligence; brez nje deluje demo način |
| `MESHY_API_KEY` | ne (da, če je `AI_3D_PROVIDER=meshy`) | ključ za Meshy; samo na strežniku, na Vercelu kot **Sensitive** |
| `AI_3D_RATE_LIMIT_MAX`, `AI_3D_RATE_LIMIT_WINDOW_MS` | ne | omejitev ustvarjanj na IP (privzeto 10 na uro) |
| `DATABASE_URL` | da na Vercelu | baza Supabase za prijave zanimanja (stran `/izdelki`) |
| `DATABASE_PATH` | ne | lokalna datoteka SQLite za prijave (privzeto `data/vizija3d.sqlite`) |
| `NEXT_PUBLIC_SITE_URL` | priporočeno | javni naslov strani, npr. `https://vizija-3d.vercel.app` |
| `RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW_MS` | ne | omejitev oddaj zanimanja na IP |

Ključi API se berejo samo na strežniku (poti `/api/3d/*`) in nikoli niso v kodi brskalnika.

## Studio (platforma za 3D modele)

### Kaj je implementirano v MVP

- **Strani:** Domov (`/`), Studio (`/studio`), Moji modeli (`/moji-modeli`), Pomoč (`/pomoc`), O platformi (`/o-platformi`).
- **Vodeni postopek v 5 korakih:** način → vnos → nastavitve → predogled in urejanje → priprava za tisk. Na računalniku: levo vnos, nastavitve in zgodovina; v sredini 3D predogled; desno stanje, urejanje in tisk. Na telefonu: koraki eden za drugim.
- **Ustvarjanje iz besedila:** v demo načinu iz opisa prepoznamo obliko (posoda, škatla/organizator, vaza/lonček, obesek/ploščica, stojalo, figura), mere (»12 x 8 x 3 cm«, »visoka 9 cm«), luknjo in napis ter sestavimo zaprt, tiskalen model. »Izboljšaj opis« predlaga dodatke (mere, namen, ravno dno …) po pravilih, brez umetne inteligence.
- **Ustvarjanje iz slike:** v demo načinu iz slike nastane relief (ploščica s privzdignjenimi temnimi deli); več slik upošteva le ponudnik AI.
- **Urejanje obstoječega modela:** nalaganje STL (mm, Z navzgor), OBJ (mm, Y navzgor), GLB (m); omejitev 60 MB in 1 milijon ploskev; nenavadna velikost se samodejno prilagodi z opozorilom.
- **Urejanje:** velikost (š/g/v, z ohranjanjem razmerja), vrtenje po 90°, luknja (obesek, posoda, vaza, škatla), debelina sten, izbočen napis (obesek, škatla; lastna pisava iz kvadratkov s Č, Š, Ž), ponovno ustvarjanje z izboljšanim opisom, zgodovina sprememb s povrnitvijo. Vsaka sprememba takoj posodobi predogled.
- **Priprava za tisk:** mere, ocena velikosti datoteke, predlagan material, priporočena stena in polnitev, priporočilo za podpore; preverjanja zaprtosti, nepovezane geometrije, obrnjenih ploskev, debeline sten (vzorčna ocena), velikosti glede na ploščo 220 × 220 × 250 mm, ploskev brez površine in velikosti datoteke; »Poskusi popraviti model« (zapiranje lukenj, odstranitev napak, prilagoditev velikosti, odebelitev sten).
- **Prenos:** STL (binarni, mm, Z navzgor), GLB (m, Y navzgor) in paket ZIP (STL + GLB + `specifikacija.txt`).
- **Moji modeli:** samodejno shranjevanje v brskalnik (IndexedDB) s sličico, statusom in nadaljevanjem urejanja.
- **Varnost:** zavrnitev opisov in imen datotek z orožjem, deli orožja ali eksplozivi (v brskalniku in na strežniku), potrditev pravic za naložene datoteke, pravila uporabe na strani Pomoč, opozorila »Pred tiskom preveri …« in za funkcionalne dele.

### Demo način in ponudnik umetne inteligence

Brez spremenljivk `AI_3D_PROVIDER` in `MESHY_API_KEY` Studio deluje v **demo načinu** in to jasno prikaže. Celoten postopek do prenosa deluje, modeli pa nastanejo iz preprostih predlog (besedilo) ali kot relief (slika).

Ko je ponudnik nastavljen, brskalnik pošlje opis in slike (pomanjšane na največ 1024 px, največ 3) na `POST /api/3d/naloge`, nato vsake 3 sekunde preverja `GET /api/3d/naloge/[id]` in na koncu prenese GLB (neposredno ali prek `GET /api/3d/naloge/[id]/model`, do 4 MB).

**Prilagoditev za Meshy (`src/lib/generation/meshy.ts`) ni preizkušena z živim API-jem**, ker iz razvojnega okolja ni bilo dostopa do storitve. Pred uporabo preveri končne točke in polja v dokumentaciji Meshy.

### Kako zamenjati ponudnika AI

1. Ustvari razred, ki implementira vmesnik `ThreeDGenerationProvider` iz `src/lib/generation/types.ts` (`createTask`, `getTask`). Za zgled glej `src/lib/generation/meshy.ts`.
2. Dodaj ga v `getGenerationProvider()` v `src/lib/generation/provider.ts` (npr. `case "tripo"`).
3. Na Vercelu nastavi `AI_3D_PROVIDER` in ključ ponudnika (kot Sensitive) ter izvedi Redeploy.

(Ime `3DGenerationProvider` v TypeScriptu ni veljavno, ker se začne s števko; zato se vmesnik imenuje `ThreeDGenerationProvider`.)

### Namenoma ostalo za kasnejšo različico

- plačila, naročnine, uporabniški računi in shranjevanje projektov na strežniku,
- naročanje tiska in pošiljanje datotek tiskarnam (paket ZIP se le prenese),
- luknje, napisi in debelina sten pri naloženih modelih in modelih AI (zahteva CSG),
- popolna preverba tiskalnosti (npr. natančne debeline sten, samopresečišča), rezanje in razdelitev modelov,
- samodejno preverjanje vsebine slik (zdaj le potrditev pravic in preverjanje besedila),
- PDF specifikacija (zdaj TXT),
- prevod opisov v angleščino za ponudnike AI.

## Struktura

```
src/
  app/
    page.tsx                  Domov (platforma)
    studio/                   Studio
    moji-modeli/, pomoc/, o-platformi/
    izdelki/                  katalog izdelkov in prijave zanimanja
    zasebnost/                stran Zasebnost
    api/3d/                   ponudnik, naloge, prenos modela (AI)
    api/zanimanje/            prijave zanimanja
  components/
    studio/                   Studio: koraki, vnos, nastavitve, 3D pregledovalnik, urejanje, tisk, Moji modeli
    platform/                 domača stran platforme
    layout/, sections/, product/, graphics/, ui/
  lib/
    model3d/                  oblike, preverjanje, popravek, izvoz (STL, GLB, ZIP), nalaganje, shramba, opisi
    generation/               ponudniki AI (vmesnik, Meshy, obdelava zahtev)
    interest/, server/        prijave zanimanja
  content/                    besedila (platforma, izdelki, vprašanja)
  config/                     nastavitve strani in zasebnosti
public/izdelki/               slike izdelkov
scripts/prijave.mjs           povzetek, izvoz in izbris prijav
tests/unit, tests/e2e         testi (e2e/fixtures: testna slika in STL)
```

## Izdelki (stran /izdelki)

### Urejanje izdelkov in slik

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
| `badge` | neobvezna oznaka na kartici, npr. `"V razvoju"` |
| `priceEur` | neobvezna cena v evrih, npr. `3`; prikaže se kot »3 €«. Brez nje kartica prikaže »Cena bo objavljena ob začetku prodaje.« |

**Zamenjava slike:** shrani fotografijo v `public/izdelki/` (npr. `public/izdelki/drzalo-za-metlo.jpg`), v zapisu nastavi `imageSrc: "/izdelki/drzalo-za-metlo.jpg"`, posodobi `imageAlt` in pusti `imageIsConcept: false`. Slike so prikazane v razmerju 4 : 3; Next.js jih samodejno pomanjša in optimizira.

**Aktivacija praznega mesta:** nastavi `status: "in-development"`, izpolni `name`, `description`, `imageSrc`, `imageAlt` in po želji `interestEnabled: true`. Komponent ni treba spreminjati.

Predstavljeni izdelki so prikazani v mreži (1 stolpec na telefonu, 2 na tablici, 3 na namiznem zaslonu), prazna mesta pa pod njimi v kompaktni mreži. Znotraj obeh skupin velja vrstni red iz polja `order`.

### Trenutni izdelki

| Mesto | id | Ime | Kategorija |
| --- | --- | --- | --- |
| 1 | `drzalo-za-metlo` | Držalo za metlo | Pohištvo |
| 2 | `skatlica-za-metke` | Škatlica za metke | Orožje in hobi |
| 3 | `podloga-za-zapestje` | Podloga za zapestje | Pisarniški pripomočki |
| 4 | `avtomatska-wc-scetka` | Avtomatska električna WC ščetka (oznaka »V razvoju«) | Kopalnica |
| 5–10 | `mesto-05` … `mesto-10` | Nov izdelek prihaja | — |

Slike v `public/izdelki/` so obrezani posnetki zaslona (sličice 3D modelov, pri WC ščetki kader iz videa) (izvirniki so široki približno 320–360 slikovnih pik). Obrezani so tako, da ni angleških napisov, imen datotek, datumov in tujega logotipa; zaradi povečave so nekoliko zamegljeni. Pred javno objavo jih zamenjaj z lastnimi fotografijami natisnjenih izdelkov (priporočeno vsaj 1600 × 1200 slikovnih pik, razmerje 4 : 3).

Prva slika je vsebovala logotip drugega avtorja, kar kaže, da slika in morda tudi 3D model nista avtorska. Pred prodajo preveri licenco vsakega modela (ali dovoljuje komercialno prodajo natisnjenih izdelkov) in pravico do uporabe slik.

Ne dodajaj podatkov, ki jih lastnik ni potrdil: cen, materialov, mer, nosilnosti, certifikatov, rokov izdelave ali ocen kupcev. Cena 3 € je navedena pri držalu za metlo, škatlici za metke in podlogi za zapestje; pri drugih izdelkih piše »Cena bo objavljena ob začetku prodaje.«

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

- preverjanje vseh vnosov na odjemalcu in strežniku (količina 1–99, veljaven e-poštni naslov, obstoječ izdelek z omogočeno oddajo),
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

### Privolitev in obvestilo o nezavezujoči oddaji

Obrazec nima potrditvenega polja. Obiskovalec privolitev da z oddajo obrazca; namen uporabe e-poštnega naslova je naveden ob polju za e-pošto. Obvestilo »Izdelek je v razvoju. Oddaja pomeni nezavezujočo prijavo zanimanja, brez plačila.« se prikaže v potrditvi po oddaji. Ob vsaki spremembi tega načina povečaj `CONSENT_TEXT_VERSION` v `src/lib/interest/consent.ts` (trenutno `2026-11-v2`).

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

Testi Studia preverijo celoten tok iz besedila (ustvarjanje, urejanje, preverjanje, prenos STL/GLB/ZIP), relief iz slike, nalaganje in popravek odprtega STL, razumljivo napako ob pokvarjeni datoteki, zavrnitev prepovedanega opisa, »Izboljšaj opis«, shranjevanje in nadaljevanje v Moji modeli ter mobilni tok po korakih. Enotski testi preverijo, da so vse oblike zaprte in pravilno usmerjene, razčlenitev opisov, izvoz STL, veljavnost paketa ZIP, samodejni popravek in strežniški vmesnik za ponudnika AI.

Testi strani z izdelki preverijo navigacijo in mobilni meni, postavitev pri širinah 320–1440 px, povečan prikaz slike s tipkovnico, meje količine, preverjanje e-pošte, trajno shranjevanje, ponovno oddajo za isti izdelek, obravnavo napak strežnika in omrežja, preprečevanje dvojnih oddaj in prazna mesta brez obrazcev.

Testi shrambe v PostgreSQL se izvedejo samo z nastavljeno spremenljivko `TEST_DATABASE_URL` (testna baza; tabela se izprazni).

## Animacije

Vse animacije so v `src/app/globals.css` (razdelek »Gibanje«) in delujejo brez dodatnega JavaScripta:

| Razred | Učinek |
| --- | --- |
| `intro` | dvig in prikaz ob nalaganju (uvod); zamik nastavi `--d` |
| `reveal` | dvig in prikaz ob drsenju; zamik v skupini nastavi `--s` |
| `reveal-zoom`, `reveal-glow` | povečanje in sij osrednje grafike ob drsenju |
| `statement` + `w` | besede izjave se ob drsenju postopoma osvetlijo |
| `scene`, `scene-sticky`, `scene-step`, `scene-room`, `scene-marker` | pripet prizor vizualizacije: koraki se zaporedno poudarijo, oznake se pojavijo (od širine 1024 px) |

Animacije ob drsenju uporabljajo CSS *scroll-driven animations*. Brskalniki brez te podpore prikažejo vsebino brez animacij ob drsenju. Pri sistemski nastavitvi »zmanjšano gibanje« ni nobene animacije in prizor ni pripet.

## Prihodnja vizualizacija prostora

Trenutno je v `src/features/room-visualization/` le statičen konceptni prikaz (`RoomConceptPreview.tsx`) in tipi za prihodnje podatke o postavitvi (`types.ts`). Funkcija ne sprejema, ne analizira in ne shranjuje fotografij ter ne kliče zunanjih storitev. Ob razvoju se konceptni prikaz v razdelku `src/components/sections/RoomVision.tsx` zamenja z dejanskim urejevalnikom; preostanek strani ostane nespremenjen.
