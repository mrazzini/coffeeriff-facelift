"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { Product } from "@/lib/api";
import { getProducts } from "@/lib/api";
import ProductCard from "@/components/ProductCard";

export default function AccessoriPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getProducts("accessory")
      .then(setProducts)
      .catch(() => setError("Impossibile caricare gli accessori"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brown border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-6">
        <p className="text-sm text-muted">{error}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-10">
        <h1 className="font-serif text-3xl font-bold italic text-charcoal sm:text-4xl">
          Accessori
        </h1>
        <p className="mt-2 max-w-lg text-sm text-muted">
          Tutto il necessario per preparare il caffè al meglio: macinini, filtri, bricchi e altro ancora.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <ProductCard
            key={product.handle}
            product={product}
            href={`/accessori/${product.handle}`}
          />
        ))}
      </div>

      {products.length === 0 && (
        <p className="py-20 text-center text-sm text-muted">
          Nessun accessorio disponibile al momento.
        </p>
      )}

      <div className="mt-16 border-t border-border pt-10 text-center">
        <p className="text-sm text-muted">Hai già tutto il necessario?</p>
        <Link
          href="/caffetteria"
          className="mt-2 inline-block text-sm font-semibold text-brown underline"
        >
          Scegli il tuo caffè →
        </Link>
      </div>
    </div>
  );
}
