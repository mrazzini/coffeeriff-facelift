"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/lib/api";
import { getProducts } from "@/lib/api";
import ProductCard from "@/components/ProductCard";

const REVIEWS = [
  {
    name: "Alex",
    product: "Box Degustazione 4 Microlotti Specialty",
    rating: 5,
    text: "Quattro tipi di microlotti, tutti straordinari per intensità e caratteristiche. Il mio preferito nel box: Busanze Red Bourbon. Un altro microlotto che spero di ritrovare e riacquistare è il Colombia Golden Huila, semplicemente divino!",
  },
  {
    name: "Davide",
    product: "Abbonamento Specialty coffee",
    rating: 5,
    text: "Un piccolo rito mensile che vale ogni centesimo. Si sente la qualità della selezione e della tostatura: niente bruciato, niente amarezza aggressiva, solo carattere. Ogni caffè ha una sua identità precisa, e questa è la parte più affascinante dell'abbonamento: non bevi solo caffè, bevi storie diverse ogni mese.",
  },
  {
    name: "Giorgio Sguazzini",
    product: "India Plantation Bababudan AA",
    rating: 4,
    text: "È un caffè ben tostato con un corpo non pienissimo ma con profumo e sapore eccellente.",
  },
];

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} stelle su 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={`h-4 w-4 ${i < rating ? "fill-brown text-brown" : "fill-transparent text-border"}`}
          viewBox="0 0 20 20"
          stroke="currentColor"
          strokeWidth={i < rating ? 0 : 1.5}
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function Home() {
  const [featured, setFeatured] = useState<Product[]>([]);

  useEffect(() => {
    getProducts("coffee")
      .then((products) => {
        const sorted = [...products]
          .filter((p) => p.enriched?.sca_score)
          .sort((a, b) => (b.enriched?.sca_score ?? 0) - (a.enriched?.sca_score ?? 0))
          .slice(0, 4);
        setFeatured(sorted);
      })
      .catch(() => {});
  }, []);

  return (
    <>
      {/* 1. Hero — split layout: text left / image right on desktop */}
      <section className="relative flex min-h-[85vh] overflow-hidden">
        {/* Left: text content */}
        <div className="relative z-10 flex w-full flex-col items-center justify-center px-6 text-center lg:w-[56%] lg:items-start lg:pl-16 lg:pr-10 lg:text-left">
          {/* Subtle noise texture */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
              backgroundSize: "200px",
            }}
          />

          <div className="relative max-w-2xl space-y-10 animate-fadeUp lg:max-w-none">
            <div>
              <img
                src="/logo.webp"
                alt="Coffeeriff"
                className="invert mx-auto h-auto w-auto max-w-[55%] sm:max-w-[45%] lg:mx-0 lg:max-w-[260px]"
              />
              <p className="mt-4 font-serif text-lg italic text-brown lg:text-xl">
                è tutta un&apos;altra musica
              </p>
              <div className="mx-auto mt-5 h-px w-16 bg-brown/40 lg:mx-0" />
            </div>

            <p className="mx-auto max-w-md text-base leading-relaxed text-muted lg:mx-0">
              Bere caffè non è solo un gesto, è un piacere da gustare.
            </p>

            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center lg:justify-start">
              <Link
                href="/caffetteria"
                className="inline-block bg-brown px-10 py-4 text-xs font-semibold uppercase tracking-widest text-cream shadow-sm transition-all hover:bg-charcoal focus-ring"
              >
                Esplora i Caffè
              </Link>
              <Link
                href="/quiz"
                className="inline-block border border-brown/60 px-10 py-4 text-xs font-semibold uppercase tracking-widest text-brown transition-all hover:border-brown hover:bg-brown/5 focus-ring"
              >
                Trova il Tuo Caffè
              </Link>
            </div>
          </div>
        </div>

        {/* Right: image panel — desktop only */}
        <div className="hidden lg:block lg:w-[44%] relative">
          <Image
            src="/images/CoffeeRiff00771.jpg"
            alt="Caffè specialty Coffeeriff"
            fill
            className="object-cover object-center"
            priority
          />
          {/* Vignette: blend left edge into cream background */}
          <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-cream to-transparent" />
        </div>

        {/* Wave divider at the bottom */}
        <div className="absolute bottom-0 left-0 right-0 z-20">
          <svg
            viewBox="0 0 1440 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full"
            preserveAspectRatio="none"
          >
            <path
              d="M0 48L60 42.7C120 37.3 240 26.7 360 21.3C480 16 600 16 720 18.7C840 21.3 960 26.7 1080 29.3C1200 32 1320 32 1380 32L1440 32V48H1380C1320 48 1200 48 1080 48C960 48 840 48 720 48C600 48 480 48 360 48C240 48 120 48 60 48H0Z"
              fill="white"
            />
          </svg>
        </div>
      </section>

      {/* 2. Featured products */}
      {featured.length > 0 && (
        <section className="bg-white px-6 py-24 md:py-32">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 flex items-end justify-between">
              <div>
                <h2 className="font-serif text-2xl font-bold italic text-charcoal sm:text-3xl">
                  Le nostre selezioni
                </h2>
              </div>
              <Link
                href="/caffetteria"
                className="hidden text-xs font-semibold uppercase tracking-widest text-brown transition-colors hover:text-charcoal sm:block"
              >
                Vedi tutti →
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
              {featured.map((product) => (
                <ProductCard key={product.handle} product={product} />
              ))}
            </div>

            <div className="mt-10 text-center sm:hidden">
              <Link
                href="/caffetteria"
                className="text-xs font-semibold uppercase tracking-widest text-brown"
              >
                Vedi tutti i caffè →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* 3. Value proposition */}
      <section className="bg-cream-dark px-6 py-24 md:py-32">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-16 text-center font-serif text-2xl font-bold italic text-charcoal sm:text-3xl">
            Ogni tazza, un nuovo piacere
          </h2>
          <div className="grid grid-cols-1 gap-12 sm:grid-cols-3">
            {[
              {
                n: "1",
                title: "Più salutare",
                body: "Grazie alla nostra tostatura artigianale a temperature più basse e alla qualità superiore dei chicchi, il nostro caffè è più salutare rispetto ai caffè di bassa qualità.",
              },
              {
                n: "2",
                title: "Aromi intensi",
                body: "Scopri una sinfonia di sapori frutto di una lavorazione artigianale meticolosa e attenta ai dettagli. Assapora la differenza di un caffè di alta qualità tostato con cura.",
              },
              {
                n: "3",
                title: "Spedizione espressa",
                body: "Spedizione gratuita per ordini superiori a 47 euro. Puoi ricevere i migliori caffè direttamente a casa tua senza costi aggiuntivi.",
              },
            ].map((item) => (
              <div key={item.n}>
                <span className="font-serif text-5xl font-bold italic text-brown/20">
                  {item.n}
                </span>
                <h3 className="mt-3 font-serif text-lg font-semibold italic text-charcoal">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Quiz CTA */}
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="font-serif text-2xl font-bold italic text-charcoal sm:text-3xl">
            Non sai quale scegliere?
          </h2>
          <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-muted">
            Rispondi a 4 domande e la nostra AI abbinerà i tuoi gusti ai
            migliori caffè del nostro catalogo.
          </p>
          <Link
            href="/quiz"
            className="mt-8 inline-block bg-brown px-10 py-4 text-xs font-semibold uppercase tracking-widest text-cream shadow-sm transition-all hover:bg-charcoal focus-ring"
          >
            Inizia il Quiz
          </Link>
          <p className="mt-4 text-[11px] uppercase tracking-widest text-muted/70">
            4 domande · meno di un minuto
          </p>
        </div>
      </section>

      {/* 5. Brand identity — 2-col with origin image on desktop */}
      <section className="bg-cream-dark px-6 py-24 md:py-32">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-20">
            {/* Text */}
            <div className="text-center lg:text-left">
              <h2 className="font-serif text-2xl font-bold italic text-charcoal sm:text-3xl">
                Dai ritmo alla tua giornata con un riff
              </h2>
              <p className="mt-6 text-sm leading-relaxed text-muted">
                Il riff è una frase musicale distintiva, composta da una successione di note che
                si ripete frequentemente in una composizione, spesso utilizzata come accompagnamento.
              </p>
              <p className="mt-4 text-sm leading-relaxed text-muted">
                Ogni nostro caffè è paragonabile a un diverso strumento musicale: dalle note gravi
                e profonde di un Brasile naturale alle note acute e brillanti di un Kenya lavato,
                ogni tazza offre un&apos;esperienza unica e ricca di sfumature.
              </p>
            </div>

            {/* Origin image */}
            <div className="relative aspect-[4/3] overflow-hidden">
              <Image
                src="/images/monteverdeguzntr3m3f2g4vvdvdj3-md.png"
                alt="Origini del caffè specialty Coffeeriff"
                fill
                className="object-cover object-center"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 6. Reviews — swipeable on mobile */}
      <section className="bg-white px-6 py-24 md:py-32">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <h2 className="font-serif text-2xl font-bold italic text-charcoal">
              Cosa pensa chi lo ha già assaggiato
            </h2>
            <p className="mt-2 text-sm text-muted">Lasciamo parlare i clienti per noi</p>
          </div>

          {/* Swipeable on mobile, grid on desktop */}
          <div className="flex gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide sm:grid sm:grid-cols-3 sm:overflow-visible">
            {REVIEWS.map((r) => (
              <div
                key={r.name}
                className="relative min-w-[80vw] snap-start border border-border bg-cream/50 p-6 sm:min-w-0"
              >
                {/* Decorative large quote mark */}
                <span
                  className="pointer-events-none absolute right-4 top-2 select-none font-serif text-7xl leading-none text-brown/10"
                  aria-hidden="true"
                >
                  &ldquo;
                </span>

                <StarRow rating={r.rating} />
                <p className="relative mt-3 text-sm leading-relaxed text-charcoal">
                  &ldquo;{r.text}&rdquo;
                </p>
                <div className="mt-5 border-t border-border pt-4">
                  <p className="text-xs font-semibold text-charcoal">{r.name}</p>
                  <p className="mt-0.5 text-[11px] text-muted">{r.product}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Filosofia teaser — dark section with atmospheric background image */}
      <section className="relative overflow-hidden bg-charcoal px-6 py-24 text-cream md:py-32">
        {/* Background image — subtle, dark overlay */}
        <div className="absolute inset-0">
          <Image
            src="/images/BishanWate6.jpg"
            alt=""
            fill
            className="object-cover object-center opacity-20"
          />
          <div className="absolute inset-0 bg-charcoal/70" />
        </div>

        <div className="relative z-10 mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cream/50">
            La nostra filosofia
          </p>
          <p className="mt-6 font-serif text-2xl font-medium italic leading-relaxed sm:text-3xl">
            &ldquo;Bere meno, bere meglio.&rdquo;
          </p>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-cream/70">
            Cerchiamo tazze limpide, brillanti e definite, dove dolcezza, vivacità e chiarezza
            siano sempre in equilibrio.
          </p>
          <Link
            href="/filosofia"
            className="mt-8 inline-block border border-cream/30 px-8 py-3 text-xs font-semibold uppercase tracking-widest text-cream/80 transition-colors hover:border-cream hover:text-cream focus-ring"
          >
            Scopri la nostra filosofia →
          </Link>
        </div>
      </section>
    </>
  );
}
