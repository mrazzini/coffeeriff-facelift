import Link from "next/link";
import type { Product } from "@/lib/api";

interface ProductCardProps {
  product: Product;
  href?: string;
}

const STAR_PATH = "M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z";

/**
 * Render 4–5 star rating from SCA score.
 * SCA 84–89 (all specialty-grade coffees in the catalog) maps to 4.0–5.0 stars.
 * Supports half-star rendering via SVG clipPath.
 */
function ScaStars({ score }: { score: number }) {
  // Map actual data range 84–89 → 4.0–5.0, clamped
  const raw = 4.0 + (score - 84) / 5.0;
  const starsFloat = Math.min(5.0, Math.max(4.0, raw));
  // Round to nearest 0.5
  const starsRounded = Math.round(starsFloat * 2) / 2;

  return (
    <div
      className="flex items-center gap-0.5"
      aria-label={`SCA ${score} — ${starsRounded} stelle su 5`}
      title={`SCA ${score}`}
    >
      {Array.from({ length: 5 }).map((_, i) => {
        const clipId = `half-${score}-${i}`;
        const isFull = i + 1 <= starsRounded;
        const isHalf = !isFull && i + 0.5 <= starsRounded;

        if (isHalf) {
          return (
            <svg key={i} className="h-3 w-3" viewBox="0 0 20 20">
              <defs>
                <clipPath id={clipId}>
                  <rect x="0" y="0" width="10" height="20" />
                </clipPath>
              </defs>
              {/* Empty star base */}
              <path d={STAR_PATH} className="fill-border text-border" />
              {/* Half-filled overlay */}
              <path d={STAR_PATH} className="fill-brown text-brown" clipPath={`url(#${clipId})`} />
            </svg>
          );
        }

        return (
          <svg key={i} className="h-3 w-3" viewBox="0 0 20 20">
            <path
              d={STAR_PATH}
              className={isFull ? "fill-brown text-brown" : "fill-border text-border"}
            />
          </svg>
        );
      })}
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
