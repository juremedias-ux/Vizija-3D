import type { CSSProperties } from "react";

import { InterestSessionProvider } from "@/components/product/InterestSession";
import { PlaceholderCard } from "@/components/product/PlaceholderCard";
import { ProductCard } from "@/components/product/ProductCard";
import { SectionIntro } from "@/components/ui/SectionIntro";
import {
  MAX_PRODUCT_SLOTS,
  getProductSlots,
  isPresentedProduct,
} from "@/content/products";

/**
 * Katalog z desetimi mesti: najprej predstavljeni izdelki, nato prazna mesta.
 * Znotraj vsake skupine velja vrstni red iz polja order.
 */
export function ProductCatalog() {
  const slots = getProductSlots();
  const presented = slots.filter(isPresentedProduct);
  const upcoming = slots.filter((slot) => !isPresentedProduct(slot));

  return (
    <section
      id="izdelki"
      aria-labelledby="izdelki-naslov"
      className="relative border-t border-white/[0.06]"
    >
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-36">
        <SectionIntro
          eyebrow="Izdelki"
          title="Izdelki, ki jih razvijamo"
          titleId="izdelki-naslov"
          aside={
            <p className="text-fg-muted lg:text-right">
              <span className="text-gradient block font-display text-6xl leading-none font-semibold tracking-tight">
                {presented.length}
                <span className="text-fg-subtle"> / {MAX_PRODUCT_SLOTS}</span>
              </span>
              <span className="mt-2 block text-sm">
                predstavljenih izdelkov
              </span>
            </p>
          }
        >
          <p>
            Katalog ima deset mest. Izdelke dodajamo postopoma. Pri vsakem
            predstavljenem izdelku lahko izbereš količino in oddaš nezavezujoče
            zanimanje — brez plačila.
          </p>
        </SectionIntro>

        {presented.length > 0 ? (
          <InterestSessionProvider>
            <ul className="mt-16 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {presented.map((product, index) => (
                <li
                  key={product.id}
                  className="reveal"
                  style={{ "--s": index % 3 } as CSSProperties}
                >
                  <ProductCard product={product} priorityImage={index === 0} />
                </li>
              ))}
            </ul>
          </InterestSessionProvider>
        ) : null}

        {upcoming.length > 0 ? (
          <div className="mt-20">
            <div className="reveal flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
              <h3 className="font-display text-2xl font-semibold tracking-tight text-fg">
                Mesta v pripravi
              </h3>
              <p className="text-sm text-fg-muted">
                Rezervirana so za izdelke, ki jih še razvijamo.
              </p>
            </div>
            <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-7">
              {upcoming.map((slot, index) => (
                <li
                  key={slot.id}
                  className="reveal"
                  style={{ "--s": index % 7 } as CSSProperties}
                >
                  <PlaceholderCard slot={slot} />
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}
