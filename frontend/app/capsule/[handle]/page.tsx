"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { Product } from "@/lib/api";
import { getProducts } from "@/lib/api";

export default function CapsuleDetailPage({
  params,
}: {
  params: { handle: string };
}) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [descExpanded, setDescExpanded] = useState(false);

  useEffect(() => {
    getProducts("capsule")
      .then((products) => {
        setProduct(products.find((p) => p.handle === params.handle) ?? null);
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [params.handle]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brown border-t-transparent" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6">
        <p className="text-sm text-muted">Prodotto non trovato.</p>
        <Link href="/capsule" className="text-sm font-medium text-brown underline">
          ← Torna alle capsule
        </Link>
      </div>
    );
  }

  const shopifyUrl = `https://coffeeriff.com/products/${product.handle}`;
  const descriptionFull = product.description || "";
  const descriptionShort =
    descriptionFull.length > 300 ? descriptionFull.slice(0, 300) + "…" : descriptionFull;
  const showExpandButton = descriptionFull.length > 300;

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <Link
        href="/capsule"
        className="mb-6 inline-block text-xs font-medium uppercase tracking-widest text-muted transition-colors hover:text-charcoal"
      >
        ← Tutte le Capsule
      </Link>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-12">
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

        <div className="flex flex-col">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-brown">
            Compatibile Nespresso
          </p>

          <h1 className="font-serif text-2xl font-bold italic leading-tight text-charcoal sm:text-3xl">
            {product.title}
          </h1>

          <p className="mt-3 text-xl font-semibold text-brown">€{product.price}</p>

          {descriptionFull && (
            <div className="mt-5 border-t border-border pt-4">
              <p className="text-sm leading-relaxed text-muted">
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

          <a
            href={shopifyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 block border border-charcoal bg-charcoal py-4 text-center text-xs font-semibold uppercase tracking-widest text-cream transition-colors hover:bg-transparent hover:text-charcoal"
          >
            Acquista →
          </a>
        </div>
      </div>
    </div>
  );
}
