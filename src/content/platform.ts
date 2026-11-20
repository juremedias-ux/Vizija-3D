/** Besedila platforme za ustvarjanje 3D modelov. */

export const PLATFORM_HEADLINE =
  "Ustvari svoj 3D model brez znanja 3D oblikovanja.";
export const PLATFORM_SUBHEADLINE =
  "Opiši predmet, naloži sliko ali uredi obstoječi model — in pripravi datoteko za 3D tisk.";

export const ENTRY_POINTS = [
  {
    nacin: "besedilo",
    title: "Ustvari iz besedila",
    text: "Napiši, kaj želiš, na primer »posoda za ključe, 12 x 8 x 3 cm«.",
    icon: "M4 6h12M4 10h12M4 14h7",
  },
  {
    nacin: "slika",
    title: "Ustvari iz slike",
    text: "Naloži fotografijo, skico ali več referenčnih slik.",
    icon: "M3 5h14v10H3zM6 12l3-3 3 3 2-2 3 3M7 8.5h.01",
  },
  {
    nacin: "model",
    title: "Uredi obstoječi model",
    text: "Naloži datoteko STL, OBJ ali GLB, jo prilagodi in pripravi za tisk.",
    icon: "M10 3l6 3.5v7L10 17l-6-3.5v-7zM10 10l6-3.5M10 10v7M10 10L4 6.5",
  },
] as const;

export const PLATFORM_STEPS = [
  {
    title: "Opiši ali naloži",
    text: "Napiši opis, dodaj sliko ali naloži svoj 3D model.",
  },
  {
    title: "Predogledaj",
    text: "Model si oglej z vseh strani: vrti, povečaj in premikaj pogled.",
  },
  {
    title: "Uredi",
    text: "Spremeni velikost, zavrti model, dodaj luknjo ali napis.",
  },
  {
    title: "Prenesi datoteko",
    text: "Preverimo, ali je primeren za tisk, ti pa preneseš STL, GLB ali paket ZIP.",
  },
];

export const USE_CASES = [
  {
    title: "Darila",
    text: "Obesek z imenom, okrasna škatlica ali figura za posebno priložnost.",
    icon: "M4 9h12v8H4zM3 6h14v3H3zM10 6v11M10 6c-1.5-3-5-3-4 0M10 6c1.5-3 5-3 4 0",
  },
  {
    title: "Dekoracija",
    text: "Vaze, lončki za rastline in okraski za dom.",
    icon: "M7 3h6M8 3v3c-3 2-4 5-3 8s3 3 5 3 4-1 5-3-0-6-3-8V3",
  },
  {
    title: "Organizatorji",
    text: "Posode za ključe, predalčki in organizatorji za mizo.",
    icon: "M3 7h14v9H3zM3 7l2-3h10l2 3M8 11h4",
  },
  {
    title: "Popravki",
    text: "Preprosti nadomestni deli, kot so pokrovčki ali podložke.",
    icon: "M12 3a4 4 0 00-3.8 5.3L3 13.5V17h3.5l5.2-5.2A4 4 0 1012 3z",
  },
  {
    title: "Figure",
    text: "Preproste figurice in liki za igro ali na polico.",
    icon: "M10 3a3 3 0 110 6 3 3 0 010-6zM5 17c0-4 2-6 5-6s5 2 5 6",
  },
  {
    title: "Personalizirani predmeti",
    text: "Ploščice in tablice z izbočenim napisom.",
    icon: "M3 6h14v8H3zM6 10h8M6 8h2",
  },
];
