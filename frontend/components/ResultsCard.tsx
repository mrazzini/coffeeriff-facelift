"use client";

import type { Recommendation } from "@/lib/api";

interface ResultsCardProps {
  rec: Recommendation;
  index: number;
}

export default function ResultsCard({ rec, index }: ResultsCardProps) {
  return (
    <div
      className="rounded-2xl border border-coffee-700 bg-coffee-800/60 overflow-hidden transition-all hover:border-coffee-200/50 hover:shadow-lg"
      style={{ animationDelay: `${index * 150}ms` }}
    >
      {rec.image_url && (
        <div className="aspect-square w-full overflow-hidden bg-coffee-800">
          <img
            src={rec.image_url}
            alt={rec.product_name}
            className="h-full w-full object-cover transition-transform hover:scale-105"
          />
        </div>
      )}
      <div className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-xl font-semibold text-coffee-100">
            {rec.product_name}
          </h3>
          <span className="shrink-0 rounded-full bg-coffee-200/20 px-3 py-1 text-sm font-medium text-coffee-200">
            €{rec.price}
          </span>
        </div>
        <p className="text-sm text-coffee-200/80">{rec.description}</p>
        <div className="rounded-lg bg-coffee-900/50 p-3">
          <p className="text-sm italic text-coffee-200">
            &ldquo;{rec.match_reason}&rdquo;
          </p>
        </div>
        <a
          href={rec.shopify_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block w-full rounded-xl bg-coffee-200 py-3 text-center font-semibold text-coffee-900 transition-all hover:bg-coffee-100 hover:scale-[1.02] active:scale-[0.98]"
        >
          Vai al Prodotto →
        </a>
      </div>
    </div>
  );
}
