"use client";

import { useState } from "react";
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
  const raw = 4.0 + (score - 84) / 5.0;
  const starsFloat = Math.min(5.0, Math.max(4.0, raw));
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
              <path d={STAR_PATH} className="fill-border text-border" />
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

  // Build image list: prefer `images` array, fall back to single image_url
  const images =
    product.images && product.images.length > 0
      ? product.images
      : product.image_url
      ? [product.image_url]
      : [];

  const [currentIdx, setCurrentIdx] = useState(0);
  const hasMultiple = images.length > 1;

  function prev(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIdx((i) => (i - 1 + images.length) % images.length);
  }

  function next(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIdx((i) => (i + 1) % images.length);
  }

  function goTo(e: React.MouseEvent, idx: number) {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIdx(idx);
  }

  return (
    <Link
      href={href ?? `/caffetteria/${product.handle}`}
      className="group block ring-1 ring-border/50 transition-all duration-300 hover:ring-brown/30 hover:shadow-lg hover:shadow-charcoal/10"
    >
      {/* Image area */}
      <div className="relative aspect-square w-full overflow-hidden bg-cream-dark">
        {images.length > 0 ? (
          <>
            {/* Images — cross-fade via opacity */}
            {images.map((src, idx) => (
              <img
                key={src}
                src={src}
                alt={idx === 0 ? product.title : `${product.title} — immagine ${idx + 1}`}
                className={`absolute inset-0 h-full w-full object-cover transition-all duration-500 ${
                  idx === currentIdx
                    ? "opacity-100 scale-105 group-hover:scale-110"
                    : "opacity-0 scale-100"
                }`}
              />
            ))}

            {/* Gradient + flavor overlay */}
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-charcoal/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            {flavorText && (
              <p className="absolute inset-x-0 bottom-0 px-3 pb-3 text-[11px] font-medium leading-snug text-cream opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                {flavorText}
              </p>
            )}

            {/* Arrow buttons — only when multiple images, visible on hover */}
            {hasMultiple && (
              <>
                <button
                  onClick={prev}
                  aria-label="Immagine precedente"
                  className="absolute left-1.5 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center bg-cream/80 text-charcoal opacity-0 transition-opacity duration-200 group-hover:opacity-100 hover:bg-cream focus:outline-none"
                >
                  ‹
                </button>
                <button
                  onClick={next}
                  aria-label="Immagine successiva"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center bg-cream/80 text-charcoal opacity-0 transition-opacity duration-200 group-hover:opacity-100 hover:bg-cream focus:outline-none"
                >
                  ›
                </button>
              </>
            )}

            {/* Dot indicators */}
            {hasMultiple && (
              <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => goTo(e, idx)}
                    aria-label={`Vai all'immagine ${idx + 1}`}
                    className={`h-1 w-1 rounded-full transition-colors ${
                      idx === currentIdx ? "bg-brown" : "bg-cream/50 border border-cream/50"
                    }`}
                  />
                ))}
              </div>
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
        <div className="flex items-center justify-between">
          {enriched?.origin_country && (
            <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-brown">
              {enriched.origin_country}
            </span>
          )}
          {enriched?.sca_score && <ScaStars score={enriched.sca_score} />}
        </div>

        <h3 className="font-serif text-sm font-semibold leading-snug text-charcoal sm:text-base">
          {product.title}
        </h3>

        <p className="inline-block rounded bg-cream-dark px-2 py-0.5 text-xs font-semibold text-brown">
          €{product.price}
        </p>
      </div>
    </Link>
  );
}
