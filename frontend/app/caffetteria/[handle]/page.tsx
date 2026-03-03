"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { Product } from "@/lib/api";
import { getProducts } from "@/lib/api";

const PROCESS_LABELS: Record<string, string> = {
  naturale: "Naturale",
  lavato: "Lavato",
  anaerobico: "Anaerobico",
  "naturale-fermentato": "Naturale Fermentato",
  decaf: "Decaffeinato",
  altro: "Altro",
};

const BREW_LABELS: Record<string, string> = {
  espresso: "Espresso",
  filtro: "Filtro",
  moka: "Moka",
  "french-press": "French Press",
};

export default function ProductDetailPage({
  params,
}: {
  params: { handle: string };
}) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [descExpanded, setDescExpanded] = useState(false);

  useEffect(() => {
    getProducts()
      .then((products) => {
        const found = products.find((p) => p.handle === params.handle);
        setProduct(found ?? null);
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [params.handle]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-brown border-t-transparent" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6">
        <p className="text-sm text-muted">Prodotto non trovato.</p>
        <Link href="/caffetteria" className="text-sm font-medium text-brown underline">
          ← Torna ai caffè
        </Link>
      </div>
    );
  }

  const { enriched } = product;
  const shopifyUrl = `https://coffeeriff.com/products/${product.handle}`;

  // Build metadata rows
  const details: { label: string; value: string }[] = [];
  if (enriched?.origin_country) {
    const origin = enriched.origin_region
      ? `${enriched.origin_country} — ${enriched.origin_region}`
      : enriched.origin_country;
    details.push({ label: "Origine", value: origin });
  }
  if (enriched?.process) {
    details.push({
      label: "Processo",
      value: PROCESS_LABELS[enriched.process] || enriched.process,
    });
  }
  if (enriched?.roast) {
    details.push({
      label: "Tostatura",
      value: enriched.roast === "chiara" ? "Chiara" : "Media",
    });
  }
  if (enriched?.sca_score) {
    details.push({ label: "Punteggio SCA", value: `${enriched.sca_score} punti` });
  }

  // Truncate description for display
  const descriptionFull = product.description || "";
  const descriptionShort =
    descriptionFull.length > 300
      ? descriptionFull.slice(0, 300) + "…"
      : descriptionFull;
  const showExpandButton = descriptionFull.length > 300;

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      {/* Back link */}
      <Link
        href="/caffetteria"
        className="mb-6 inline-block text-xs font-medium uppercase tracking-widest text-muted transition-colors hover:text-charcoal"
      >
        ← Tutti i Caffè
      </Link>

      {/* Main layout: image + info */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-12">
        {/* Image */}
        <div className="aspect-[4/5] w-full overflow-hidden bg-cream-dark">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted">
              Immagine non disponibile
            </div>
          )}
        </div>

        {/* Product info */}
        <div className="flex flex-col">
          {/* Origin label */}
          {enriched?.origin_country && (
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-brown">
              {enriched.origin_country}
            </p>
          )}

          {/* Title */}
          <h1 className="font-serif text-2xl font-bold italic leading-tight text-charcoal sm:text-3xl">
            {product.title}
          </h1>

          {/* Price + SCA */}
          <div className="mt-3 flex items-center gap-4">
            <span className="text-xl font-semibold text-brown">€{product.price}</span>
            {enriched?.sca_score && (
              <span className="rounded-full border border-border px-3 py-0.5 text-xs font-semibold text-charcoal">
                SCA {enriched.sca_score}
              </span>
            )}
          </div>

          {/* Flavor notes as tags */}
          {enriched?.flavor_notes && enriched.flavor_notes.length > 0 && (
            <div className="mt-5">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted">
                Note aromatiche
              </p>
              <div className="flex flex-wrap gap-2">
                {enriched.flavor_notes.map((note) => (
                  <span
                    key={note}
                    className="rounded-full border border-border bg-white px-3 py-1 text-xs capitalize text-charcoal"
                  >
                    {note}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Metadata table */}
          {details.length > 0 && (
            <div className="mt-6 border-t border-border pt-4">
              <dl className="space-y-2">
                {details.map((d) => (
                  <div key={d.label} className="flex gap-3 text-sm">
                    <dt className="w-28 shrink-0 font-medium text-muted">{d.label}</dt>
                    <dd className="text-charcoal">{d.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {/* Brew compatibility */}
          {enriched?.brew_compatibility && enriched.brew_compatibility.length > 0 && (
            <div className="mt-5">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted">
                Metodi consigliati
              </p>
              <div className="flex flex-wrap gap-2">
                {enriched.brew_compatibility.map((method) => (
                  <span
                    key={method}
                    className="rounded-full bg-charcoal px-3 py-1 text-xs font-medium text-cream"
                  >
                    {BREW_LABELS[method] || method}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Buy CTA */}
          <a
            href={shopifyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 block border border-charcoal bg-charcoal py-4 text-center text-xs font-semibold uppercase tracking-widest text-cream transition-colors hover:bg-transparent hover:text-charcoal"
          >
            Acquista su Coffeeriff →
          </a>
        </div>
      </div>

      {/* Description section */}
      {descriptionFull && (
        <div className="mt-12 border-t border-border pt-8">
          <h2 className="mb-4 font-serif text-lg font-semibold italic text-charcoal">
            La Storia
          </h2>
          <p className="max-w-2xl text-sm leading-relaxed text-muted">
            {descExpanded ? descriptionFull : descriptionShort}
          </p>
          {showExpandButton && (
            <button
              onClick={() => setDescExpanded(!descExpanded)}
              className="mt-2 text-xs font-medium text-brown underline"
            >
              {descExpanded ? "Mostra meno" : "Leggi tutto"}
            </button>
          )}
        </div>
      )}

      {/* Quiz CTA */}
      <div className="mt-12 border-t border-border pt-8 text-center">
        <p className="text-sm text-muted">Non è il caffè giusto per te?</p>
        <Link
          href="/quiz"
          className="mt-2 inline-block text-sm font-semibold text-brown underline"
        >
          Fai il Quiz per trovare il tuo caffè perfetto
        </Link>
      </div>
    </div>
  );
}
