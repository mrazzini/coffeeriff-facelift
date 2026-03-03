import Link from "next/link";
import type { Product } from "@/lib/api";

interface ProductCardProps {
  product: Product;
  href?: string;
}

export default function ProductCard({ product, href }: ProductCardProps) {
  const { enriched } = product;
  const flavorText = enriched?.flavor_notes?.join(", ");

  return (
    <Link
      href={href ?? `/caffetteria/${product.handle}`}
      className="group block"
    >
      {/* Image */}
      <div className="aspect-[4/5] w-full overflow-hidden bg-cream-dark">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted">
            Immagine non disponibile
          </div>
        )}
      </div>

      {/* Info */}
      <div className="mt-3 space-y-1">
        {/* Origin + SCA */}
        <div className="flex items-center justify-between">
          {enriched?.origin_country && (
            <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-brown">
              {enriched.origin_country}
            </span>
          )}
          {enriched?.sca_score && (
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted">
              SCA {enriched.sca_score}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-serif text-sm font-semibold leading-snug text-charcoal sm:text-base">
          {product.title}
        </h3>

        {/* Flavor notes */}
        {flavorText && (
          <p className="text-xs capitalize text-muted">{flavorText}</p>
        )}

        {/* Price */}
        <p className="pt-1 text-sm font-semibold text-brown">€{product.price}</p>
      </div>
    </Link>
  );
}
