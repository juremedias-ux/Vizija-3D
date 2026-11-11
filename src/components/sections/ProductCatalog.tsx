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
      className="relative border-b border-line"
    >
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <SectionIntro
          index="02"
          label="Izdelki"
          title="Izdelki, ki jih razvijamo"
          titleId="izdelki-naslov"
          aside={
            <p className="font-mono text-fg-muted">
              <span className="block text-xs tracking-[0.18em] text-fg-subtle uppercase">
                Predstavljeni izdelki
              </span>
              <span className="mt-1 block text-3xl text-fg lg:text-right">
                {presented.length}
                <span className="text-fg-subtle"> / {MAX_PRODUCT_SLOTS}</span>
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
            <ul className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {presented.map((product, index) => (
                <li key={product.id}>
                  <ProductCard product={product} priorityImage={index === 0} />
                </li>
              ))}
            </ul>
          </InterestSessionProvider>
        ) : null}

        {upcoming.length > 0 ? (
          <div className="mt-14">
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
              <h3 className="font-display text-xl font-semibold tracking-tight text-fg">
                Mesta v pripravi
              </h3>
              <p className="text-sm text-fg-muted">
                Rezervirana so za izdelke, ki jih še razvijamo.
              </p>
            </div>
            <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-7">
              {upcoming.map((slot) => (
                <li key={slot.id}>
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
