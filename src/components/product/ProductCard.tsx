import { PRICE_NOTE } from "@/content/copy";
import { MAX_PRODUCT_SLOTS, type ProductSlot } from "@/content/products";
import { InterestForm } from "./InterestForm";
import { ProductImageZoom } from "./ProductImageZoom";

function slotLabel(order: number) {
  return `${String(order).padStart(2, "0")} / ${MAX_PRODUCT_SLOTS}`;
}

export function ProductCard({
  product,
  priorityImage = false,
}: {
  product: ProductSlot & { name: string; imageSrc: string; imageAlt: string };
  priorityImage?: boolean;
}) {
  const headingId = `izdelek-${product.id}-naslov`;

  return (
    <article
      aria-labelledby={headingId}
      className="flex h-full flex-col overflow-hidden rounded-[1.75rem] bg-surface-1 ring-1 ring-white/[0.06] transition-[translate,box-shadow] duration-500 ease-out hover:-translate-y-1 hover:shadow-[0_30px_80px_-40px_rgb(56_200_255/0.35)]"
    >
      <div className="relative">
        <ProductImageZoom
          src={product.imageSrc}
          alt={product.imageAlt}
          productName={product.name}
          isConcept={product.imageIsConcept}
          priority={priorityImage}
        />
        <span className="pointer-events-none absolute top-4 left-4 rounded-full bg-bg/80 px-3 py-1 font-mono text-xs text-fg-muted backdrop-blur-sm">
          <span className="sr-only">Mesto </span>
          {slotLabel(product.order)}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-6 sm:p-7">
        {product.category ? (
          <p className="text-sm font-medium text-accent">{product.category}</p>
        ) : null}

        <h3
          id={headingId}
          className="mt-1.5 font-display text-[1.75rem] leading-tight font-semibold tracking-tight text-fg"
        >
          {product.name}
        </h3>
        {product.description ? (
          <p className="mt-3 text-[0.95rem] leading-relaxed text-fg-muted">
            {product.description}
          </p>
        ) : null}
        <p className="mt-4 text-sm text-fg-subtle">{PRICE_NOTE}</p>

        <div className="mt-7 border-t border-white/[0.07] pt-7">
          {product.interestEnabled ? (
            <InterestForm productId={product.id} productName={product.name} />
          ) : (
            <p className="text-sm text-fg-muted">
              Oddaja zanimanja za ta izdelek trenutno ni odprta.
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
