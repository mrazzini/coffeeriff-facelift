"use client";

import type { Recommendation } from "@/lib/api";

interface ResultsCardProps {
  rec: Recommendation;
  rank?: number;
}

const RANK_LABELS: Record<number, string> = {
  1: "1ª Scelta",
  2: "2ª Scelta",
  3: "3ª Scelta",
};

export default function ResultsCard({ rec, rank }: ResultsCardProps) {
  const bullets = rec.description_bullets?.length
    ? rec.description_bullets
    : [rec.description];

  // First bullet is flavor notes — display prominently, rest are metadata
  const [flavorNotes, ...metaBullets] = bullets;

  return (
    <div className="relative flex flex-col border border-border bg-white transition-shadow hover:shadow-lg hover:shadow-charcoal/10">
      {/* Rank badge */}
      {rank !== undefined && RANK_LABELS[rank] && (
        <div className="absolute left-3 top-3 z-10">
          <span className="rounded-full bg-brown px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-cream shadow-sm">
            {RANK_LABELS[rank]}
          </span>
        </div>
      )}

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
        {/* Name + price + whole-bean tooltip */}
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-serif text-base font-semibold leading-snug text-charcoal">
            {rec.product_name}
          </h3>
          <div className="flex shrink-0 items-center gap-2">
            <span className="rounded bg-cream-dark px-2 py-0.5 text-sm font-semibold text-brown">
              €{rec.price}
            </span>
            <div className="group/tip relative">
              <span className="cursor-default select-none text-xs text-muted">ⓘ</span>
              <div className="pointer-events-none absolute right-0 top-5 z-10 hidden w-60 rounded border border-border bg-white px-3 py-2 text-xs leading-relaxed text-muted shadow-md group-hover/tip:block">
                I chicchi interi conservano gli aromi più a lungo del macinato. Per il massimo del gusto, acquista in grani e macina al momento.
              </div>
            </div>
          </div>
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

        {/* AI match reason — editorial blockquote */}
        <div className="relative pl-5">
          <span
            className="pointer-events-none absolute left-0 top-[-4px] select-none font-serif text-3xl leading-none text-brown/30"
            aria-hidden="true"
          >
            ❝
          </span>
          <blockquote className="border-l-2 border-brown/40 pl-3 font-serif text-sm italic leading-relaxed text-muted">
            {rec.match_reason}
          </blockquote>
        </div>

        {/* CTA */}
        <div className="mt-auto border-t border-border/60 pt-4">
          <a
            href={rec.shopify_url}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full border border-charcoal py-3 text-center text-xs font-semibold uppercase tracking-widest text-charcoal transition-colors hover:bg-charcoal hover:text-cream focus-ring sm:inline-block sm:w-auto sm:px-8"
          >
            Vai al Prodotto →
          </a>
        </div>
      </div>
    </div>
  );
}
