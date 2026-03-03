"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getProducts, type Product } from "@/lib/api";

const DISCOVERY_HANDLE = "box-degustazione-caffe-artigianale-coffeeriff";

export default function DiscoveryBoxCard() {
  const [product, setProduct] = useState<Product | null>(null);

  useEffect(() => {
    getProducts("coffee")
      .then((products) => {
        const found = products.find((p) => p.handle === DISCOVERY_HANDLE);
        if (found) setProduct(found);
      })
      .catch(() => {});
  }, []);

  if (!product) {
    // Fallback: simple link while loading or if product not found
    return (
      <div className="flex flex-col border-2 border-brown bg-white p-6 transition-shadow hover:shadow-md">
        <h3 className="font-serif text-xl font-semibold italic text-charcoal">
          Non sei ancora sicuro?
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Scopri il nostro box degustazione — la scelta ideale per esplorare il
          mondo del caffè specialty.
        </p>
        <Link
          href="/caffetteria"
          className="mt-6 block border border-brown py-3 text-center text-xs font-semibold uppercase tracking-widest text-brown transition-colors hover:bg-brown hover:text-cream"
        >
          Scopri il catalogo →
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col border-2 border-brown bg-white transition-shadow hover:shadow-md">
      {product.image_url && (
        <div className="aspect-[4/5] w-full overflow-hidden bg-cream">
          <img
            src={product.image_url}
            alt={product.title}
            className="h-full w-full object-cover"
          />
        </div>
      )}
      <div className="flex flex-1 flex-col p-6">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-brown">
          Box degustazione
        </p>
        <h3 className="mt-1 font-serif text-lg font-semibold italic text-charcoal">
          {product.title}
        </h3>
        {product.description && (
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">
            {product.description}
          </p>
        )}
        <div className="mt-auto pt-4">
          <p className="text-sm font-semibold text-charcoal">€{product.price}</p>
          <Link
            href={`/caffetteria/${DISCOVERY_HANDLE}`}
            className="mt-3 block border border-brown py-3 text-center text-xs font-semibold uppercase tracking-widest text-brown transition-colors hover:bg-brown hover:text-cream"
          >
            Scopri il box →
          </Link>
        </div>
      </div>
    </div>
  );
}
