import { Badge } from "@/components/ui/Badge";
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
      className="flex h-full flex-col rounded-xl border border-line bg-surface-1 transition-colors hover:border-line-strong"
    >
      <div className="relative">
        <ProductImageZoom
          src={product.imageSrc}
          alt={product.imageAlt}
          productName={product.name}
          isConcept={product.imageIsConcept}
          priority={priorityImage}
        />
        <span className="pointer-events-none absolute top-3 left-3 rounded-md border border-line-strong bg-bg/85 px-2.5 py-1 font-mono text-xs text-fg-muted">
          <span className="sr-only">Mesto </span>
          {slotLabel(product.order)}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div>
          <ul className="flex flex-wrap gap-2" aria-label="Oznake izdelka">
            <li>
              <Badge tone="signal">V razvoju</Badge>
            </li>
            {product.category ? (
              <li>
                <Badge tone="neutral" dot={false}>
                  {product.category}
                </Badge>
              </li>
            ) : null}
          </ul>
        </div>

        <h3
          id={headingId}
          className="mt-4 font-display text-2xl font-semibold tracking-tight text-fg"
        >
          {product.name}
        </h3>
        {product.description ? (
          <p className="mt-2 text-sm leading-relaxed text-fg-muted">
            {product.description}
          </p>
        ) : null}
        <p className="mt-4 border-l-2 border-line-strong pl-3 font-mono text-xs leading-relaxed text-fg-muted">
          {PRICE_NOTE}
        </p>

        <div className="mt-6 border-t border-line pt-6">
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
