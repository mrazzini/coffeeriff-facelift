"use client";

import { useState, useEffect, useMemo } from "react";
import type { Product } from "@/lib/api";
import { getProducts } from "@/lib/api";
import ProductCard from "@/components/ProductCard";
import FilterBar from "@/components/FilterBar";

type FilterCategory = "origin" | "process" | "roast" | "brew";

interface ActiveFilters {
  origin: string | null;
  process: string | null;
  roast: string | null;
  brew: string | null;
}

export default function CaffetteriaPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ActiveFilters>({
    origin: null,
    process: null,
    roast: null,
    brew: null,
  });

  useEffect(() => {
    getProducts("coffee")
      .then(setProducts)
      .catch(() => setError("Impossibile caricare i prodotti"))
      .finally(() => setLoading(false));
  }, []);

  // Build filter options from actual data
  const filterOptions = useMemo(() => {
    const origins = new Map<string, number>();
    const processes = new Map<string, number>();
    const roasts = new Map<string, number>();
    const brews = new Map<string, number>();

    for (const p of products) {
      const e = p.enriched;
      if (e?.origin_country) origins.set(e.origin_country, (origins.get(e.origin_country) || 0) + 1);
      if (e?.process) processes.set(e.process, (processes.get(e.process) || 0) + 1);
      if (e?.roast) roasts.set(e.roast, (roasts.get(e.roast) || 0) + 1);
      if (e?.brew_compatibility) {
        for (const b of e.brew_compatibility) {
          brews.set(b, (brews.get(b) || 0) + 1);
        }
      }
    }

    const toOptions = (map: Map<string, number>) =>
      Array.from(map.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([value]) => ({ label: value, value }));

    return {
      origin: toOptions(origins),
      process: toOptions(processes),
      roast: toOptions(roasts),
      brew: toOptions(brews),
    };
  }, [products]);

  // Apply filters
  const filtered = useMemo(() => {
    let result = products;

    if (filters.origin) {
      result = result.filter((p) => p.enriched?.origin_country === filters.origin);
    }
    if (filters.process) {
      result = result.filter((p) => p.enriched?.process === filters.process);
    }
    if (filters.roast) {
      result = result.filter((p) => p.enriched?.roast === filters.roast);
    }
    if (filters.brew) {
      result = result.filter((p) =>
        p.enriched?.brew_compatibility?.includes(filters.brew!)
      );
    }

    // Sort by SCA score descending (nulls last)
    return result.sort(
      (a, b) => (b.enriched?.sca_score ?? 0) - (a.enriched?.sca_score ?? 0)
    );
  }, [products, filters]);

  const updateFilter = (category: FilterCategory) => (value: string | null) => {
    setFilters((prev) => ({ ...prev, [category]: value }));
  };

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-brown border-t-transparent" />
          <p className="text-sm text-muted">Caricamento caffè...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-6">
        <div className="text-center">
          <p className="text-sm text-muted">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 text-sm font-medium text-brown underline"
          >
            Riprova
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold italic text-charcoal sm:text-4xl">
          I Nostri Caffè
        </h1>
        <p className="mt-2 text-sm text-muted">
          Microlotti specialty selezionati e tostati artigianalmente.
        </p>
      </div>

      {/* Filters */}
      <div className="mb-8 space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted">
            Origine
          </span>
          <FilterBar
            options={filterOptions.origin}
            active={filters.origin}
            onSelect={updateFilter("origin")}
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted">
            Processo
          </span>
          <FilterBar
            options={filterOptions.process}
            active={filters.process}
            onSelect={updateFilter("process")}
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted">
            Metodo
          </span>
          <FilterBar
            options={filterOptions.brew}
            active={filters.brew}
            onSelect={updateFilter("brew")}
          />
        </div>

        {activeFilterCount > 0 && (
          <button
            onClick={() => setFilters({ origin: null, process: null, roast: null, brew: null })}
            className="text-xs text-brown underline"
          >
            Rimuovi filtri ({activeFilterCount})
          </button>
        )}
      </div>

      {/* Results count */}
      <p className="mb-6 text-xs text-muted">
        {filtered.length} {filtered.length === 1 ? "caffè" : "caffè"} disponibil{filtered.length === 1 ? "e" : "i"}
      </p>

      {/* Product grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((product) => (
            <ProductCard key={product.handle} product={product} />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center">
          <p className="text-sm text-muted">
            Nessun caffè corrisponde ai filtri selezionati.
          </p>
          <button
            onClick={() => setFilters({ origin: null, process: null, roast: null, brew: null })}
            className="mt-3 text-sm font-medium text-brown underline"
          >
            Mostra tutti
          </button>
        </div>
      )}
    </div>
  );
}
