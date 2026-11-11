export interface FaqItem {
  question: string;
  answer: string;
}

export const faqItems: FaqItem[] = [
  {
    question: "Ali z oddajo že opravim nakup?",
    answer:
      "Ne. Gumb »Oddaj naročilo« trenutno odda le nezavezujočo prijavo zanimanja. Nakup ni sklenjen, izdelava se ne začne in plačilo ni izvedeno.",
  },
  {
    question: "Kdaj bodo izdelki na voljo?",
    answer:
      "Datuma še ne moremo napovedati, ker so izdelki še v razvoju. Če oddaš zanimanje, te bomo obvestili, ko bo izbrani izdelek na voljo.",
  },
  {
    question: "Ali moram zdaj kaj plačati?",
    answer:
      "Ne. Na spletnem mestu plačilo trenutno ni mogoče in ne zbiramo nobenih plačilnih podatkov.",
  },
  {
    question: "Ali lahko izberem več različnih izdelkov?",
    answer:
      "Da. Vsak izdelek ima svoj obrazec, zato zanimanje oddaš za vsak izdelek posebej, lahko z istim e-poštnim naslovom. Če za isti izdelek oddaš zanimanje znova, upoštevamo zadnjo izbrano količino.",
  },
  {
    question: "Zakaj cena še ni objavljena?",
    answer:
      "Izdelki so še v razvoju, zato končna cena še ni določena. Objavili jo bomo ob začetku prodaje.",
  },
  {
    question: "Ali lahko že naložim fotografijo prostora?",
    answer:
      "Še ne. Vizualizacija prostora je v pripravi. Na strani je zaenkrat le konceptni prikaz; fotografij prostora ne sprejemamo in ne shranjujemo.",
  },
  {
    question: "Kako boste uporabili moj e-poštni naslov?",
    answer:
      "E-poštni naslov uporabimo samo za obvestilo o razpoložljivosti izdelka, za katerega si oddal zanimanje. Ne uporabljamo ga za e-novice ali oglaševanje. Podrobnosti so na strani Zasebnost.",
  },
];
