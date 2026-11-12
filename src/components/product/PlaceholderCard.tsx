import { MAX_PRODUCT_SLOTS, type ProductSlot } from "@/content/products";

/** Rezervirano mesto v katalogu — brez obrazca. */
export function PlaceholderCard({ slot }: { slot: ProductSlot }) {
  const headingId = `izdelek-${slot.id}-naslov`;
  const number = String(slot.order).padStart(2, "0");

  return (
    <article
      aria-labelledby={headingId}
      className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-dashed border-white/15 bg-surface-1/60"
    >
      <div
        aria-hidden="true"
        className="relative grid h-24 place-items-center border-b border-dashed border-white/15 bg-layers"
      >
        <svg viewBox="0 0 120 100" className="h-14 w-auto text-fg-subtle">
          <g
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeDasharray="3 4"
          >
            <path d="M60 14 L100 37 L60 60 L20 37 Z" />
            <path d="M20 37 V67 L60 90 V60" />
            <path d="M100 37 V67 L60 90" />
          </g>
          <path
            d="M60 60 L100 37 L100 43 L60 66 L20 43 L20 37 Z"
            fill="#38c8ff"
            fillOpacity="0.18"
          />
          <path
            d="M20 37 L60 60 L100 37"
            fill="none"
            stroke="#38c8ff"
            strokeOpacity="0.8"
            strokeWidth="1.6"
          />
        </svg>
        <span className="absolute top-2 left-2.5 font-mono text-[11px] text-fg-subtle">
          {number} / {MAX_PRODUCT_SLOTS}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h4
          id={headingId}
          className="font-display text-base leading-snug font-semibold text-fg"
        >
          Nov izdelek prihaja
        </h4>
        <p className="mt-auto font-mono text-[11px] tracking-wide text-fg-subtle uppercase">
          <span className="sr-only">{`Mesto ${slot.order} od ${MAX_PRODUCT_SLOTS}, `}</span>
          V pripravi
        </p>
      </div>
    </article>
  );
}
