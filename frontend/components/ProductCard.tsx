import Link from "next/link";
import type { Product } from "@/lib/api";

interface ProductCardProps {
  product: Product;
  href?: string;
}

/** Render filled/empty stars proportional to SCA score (range ~80–100 → 1–5 stars) */
function ScaStars({ score }: { score: number }) {
  // Map 80–100 → 1–5 stars
  const stars = Math.round(((score - 79) / 21) * 5);
  const clamped = Math.min(5, Math.max(1, stars));
  return (
    <div className="flex items-center gap-0.5" aria-label={`SCA ${score}`} title={`SCA ${score}`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={`h-3 w-3 ${i < clamped ? "fill-brown text-brown" : "fill-border text-border"}`}
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function ProductCard({ product, href }: ProductCardProps) {
  const { enriched } = product;
  const flavorText = enriched?.flavor_notes?.join(", ");

  return (
    <Link
      href={href ?? `/caffetteria/${product.handle}`}
      className="group block ring-1 ring-border/50 transition-all duration-300 hover:ring-brown/30 hover:shadow-lg hover:shadow-charcoal/10"
    >
      {/* Image with gradient overlay */}
      <div className="relative aspect-square w-full overflow-hidden bg-cream-dark">
        {product.image_url ? (
          <>
            <img
              src={product.image_url}
              alt={product.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {/* Gradient overlay — shows flavor text on hover */}
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-charcoal/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            {flavorText && (
              <p className="absolute inset-x-0 bottom-0 px-3 pb-3 text-[11px] font-medium leading-snug text-cream opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                {flavorText}
              </p>
            )}
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted">
            Immagine non disponibile
          </div>
        )}
      </div>

      {/* Info */}
      <div className="mt-3 space-y-1 px-0.5">
        {/* Origin + SCA stars */}
        <div className="flex items-center justify-between">
          {enriched?.origin_country && (
            <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-brown">
              {enriched.origin_country}
            </span>
          )}
          {enriched?.sca_score && <ScaStars score={enriched.sca_score} />}
        </div>

        {/* Title */}
        <h3 className="font-serif text-sm font-semibold leading-snug text-charcoal sm:text-base">
          {product.title}
        </h3>

        {/* Price badge */}
        <p className="inline-block rounded bg-cream-dark px-2 py-0.5 text-xs font-semibold text-brown">
          €{product.price}
        </p>
      </div>
    </Link>
  );
}
