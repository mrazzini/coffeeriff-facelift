"use client";

import type { Recommendation } from "@/lib/api";

interface ResultsCardProps {
  rec: Recommendation;
}

export default function ResultsCard({ rec }: ResultsCardProps) {
  const bullets = rec.description_bullets?.length
    ? rec.description_bullets
    : [rec.description];

  // First bullet is flavor notes — display them prominently, rest are metadata
  const [flavorNotes, ...metaBullets] = bullets;

  return (
    <div className="flex flex-col border border-border bg-white transition-shadow hover:shadow-md">
      {rec.image_url && (
        <div className="aspect-square w-full overflow-hidden bg-cream">
          <img
            src={rec.image_url}
            alt={rec.product_name}
            className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
          />
        </div>
      )}

      <div className="flex flex-1 flex-col gap-4 p-5">
        {/* Name + price */}
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-serif text-base font-semibold leading-snug text-charcoal">
            {rec.product_name}
          </h3>
          <span className="shrink-0 text-sm font-semibold text-brown">
            €{rec.price}
          </span>
        </div>

        {/* Flavor notes */}
        {flavorNotes && (
          <p className="text-sm font-medium text-charcoal">{flavorNotes}</p>
        )}

        {/* Metadata bullets */}
        {metaBullets.length > 0 && (
          <ul className="space-y-1 border-t border-border pt-3">
            {metaBullets.map((line, i) => (
              <li key={i} className="flex gap-2 text-xs text-muted">
                <span className="mt-0.5 shrink-0 text-brown">—</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        )}

        {/* AI match reason */}
        <blockquote className="border-l-2 border-brown pl-3 font-serif text-sm italic text-muted">
          {rec.match_reason}
        </blockquote>

        {/* CTA */}
        <a
          href={rec.shopify_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto block border border-charcoal py-3 text-center text-xs font-semibold uppercase tracking-widest text-charcoal transition-colors hover:bg-charcoal hover:text-cream"
        >
          Vai al Prodotto →
        </a>
      </div>
    </div>
  );
}
