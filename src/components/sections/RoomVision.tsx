import { Badge } from "@/components/ui/Badge";
import { SectionIntro } from "@/components/ui/SectionIntro";
import { HERO_HEADLINE } from "@/content/copy";
import {
  CONCEPT_PREVIEW_LABEL,
  RoomConceptPreview,
} from "@/features/room-visualization/RoomConceptPreview";

const futureSteps = [
  {
    title: "Fotografiraj prostor",
    text: "Naložil boš fotografijo prostora, v katerega želiš postaviti izdelek.",
  },
  {
    title: "Umesti izdelke",
    text: "Izdelke boš postavil na želeno mesto in preveril, kako se ujemajo s prostorom.",
  },
  {
    title: "Naroči izdelavo",
    text: "Izbrane izdelke boš lahko naročil v izdelavo.",
  },
];

/**
 * Predstavitev prihodnje funkcije. Ne vsebuje nalaganja, analize ali
 * shranjevanja fotografij — vse je označeno kot funkcija v pripravi.
 *
 * Na širših zaslonih je prikaz pripet (sticky), koraki pa se ob drsenju
 * zaporedno poudarijo (razredi scene* v globals.css).
 */
export function RoomVision() {
  return (
    <section
      id="vizualizacija"
      aria-labelledby="vizualizacija-naslov"
      className="relative isolate overflow-clip border-t border-white/[0.06] bg-surface-1"
    >
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 -z-10 h-[60rem] bg-grid opacity-40 mask-fade-b"
      />
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-36">
        <SectionIntro
          eyebrow="Vizija platforme"
          title="Tvoj prostor. Naši izdelki. Tvoja vizija."
          titleId="vizualizacija-naslov"
          align="center"
        >
          <div className="mb-6">
            <Badge tone="accent">Funkcija v pripravi</Badge>
          </div>
          <p>
            V prihodnje boš lahko naložil fotografijo svojega prostora, preveril
            postavitev naših izdelkov in naročil njihovo izdelavo.
          </p>
          <p className="text-gradient mt-6 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            {HERO_HEADLINE}
          </p>
        </SectionIntro>

        <div className="scene mt-16 lg:mt-20">
          <div className="scene-sticky grid gap-10 lg:grid-cols-12 lg:items-center">
            <figure className="reveal lg:col-span-8">
              <div className="relative overflow-hidden rounded-[1.75rem] ring-1 ring-white/10">
                <div className="scene-room">
                  <RoomConceptPreview />
                </div>
                <p className="absolute top-4 left-1/2 -translate-x-1/2 rounded-full bg-bg/85 px-3 py-1 text-xs font-semibold tracking-[0.14em] text-accent uppercase backdrop-blur-sm">
                  Koncept
                </p>
              </div>
              <figcaption className="mt-4 flex items-start gap-2.5 text-sm text-fg">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 20 20"
                  className="mt-0.5 size-4 shrink-0 text-accent"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <circle cx="10" cy="10" r="7.5" />
                  <path d="M10 9v5M10 6v.5" strokeLinecap="round" />
                </svg>
                {CONCEPT_PREVIEW_LABEL}
              </figcaption>
            </figure>

            <div className="lg:col-span-4">
              <h3 className="reveal text-sm font-semibold tracking-[0.14em] text-fg-subtle uppercase">
                Kako bo delovalo
              </h3>
              <ol className="mt-6 grid gap-8">
                {futureSteps.map((step, index) => (
                  <li key={step.title} className="scene-step">
                    <div className="reveal flex items-baseline gap-4">
                      <span
                        aria-hidden="true"
                        className="text-gradient font-display text-3xl font-semibold"
                      >
                        {index + 1}
                      </span>
                      <div>
                        <h4 className="font-display text-2xl font-semibold tracking-tight text-fg">
                          {step.title}
                        </h4>
                        <p className="mt-2 leading-relaxed text-fg-muted">
                          {step.text}
                        </p>
                        <p className="mt-2 text-xs font-semibold tracking-[0.14em] text-fg-subtle uppercase">
                          V pripravi
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>

        <p className="reveal mx-auto mt-16 max-w-2xl text-center text-lg leading-relaxed text-fg-muted">
          Fotografij prostora zaenkrat ne sprejemamo in ne shranjujemo. Do
          takrat lahko oddaš{" "}
          <a
            href="#izdelki"
            className="text-accent underline-offset-4 hover:underline"
          >
            zanimanje za izdelke
          </a>
          .
        </p>
      </div>
    </section>
  );
}
