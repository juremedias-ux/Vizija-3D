import type { CSSProperties } from "react";

const STATEMENT =
  "Vizija 3D razvija uporabne izdelke za dom in delovni prostor. Vsak nastane s 3D tiskanjem, sloj za slojem. Ko bo platforma pripravljena, jih boš lahko najprej umestil v svoj prostor in šele nato naročil izdelavo.";

/** Izjava, pri kateri se besede ob drsenju postopoma osvetlijo. */
export function Statement() {
  const words = STATEMENT.split(" ");
  const step = `${(30 / words.length).toFixed(3)}%`;

  return (
    <section aria-label="O Viziji 3D" className="py-24 sm:py-32 lg:py-40">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <p
          className="statement font-display text-[clamp(1.75rem,4.4vw,3.6rem)] leading-[1.15] font-semibold tracking-[-0.025em] text-fg"
          style={{ "--step": step } as CSSProperties}
        >
          {words.map((word, index) => (
            <span key={index}>
              <span className="w" style={{ "--i": index } as CSSProperties}>
                {word}
              </span>
              {index < words.length - 1 ? " " : null}
            </span>
          ))}
        </p>
      </div>
    </section>
  );
}
