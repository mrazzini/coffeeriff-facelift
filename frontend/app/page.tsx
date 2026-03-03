"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { Product } from "@/lib/api";
import { getProducts } from "@/lib/api";
import ProductCard from "@/components/ProductCard";

const REVIEWS = [
  {
    name: "Alex",
    product: "Box Degustazione 4 Microlotti Specialty",
    text: "Quattro tipi di microlotti, tutti straordinari per intensità e caratteristiche. Il mio preferito nel box: Busanze Red Bourbon. Un altro microlotto che spero di ritrovare e riacquistare è il Colombia Golden Huila, semplicemente divino!",
  },
  {
    name: "Davide",
    product: "Abbonamento Specialty coffee",
    text: "Un piccolo rito mensile che vale ogni centesimo. Si sente la qualità della selezione e della tostatura: niente bruciato, niente amarezza aggressiva, solo carattere. Ogni caffè ha una sua identità precisa, e questa è la parte più affascinante dell'abbonamento: non bevi solo caffè, bevi storie diverse ogni mese.",
  },
  {
    name: "Giorgio Sguazzini",
    product: "India Plantation Bababudan AA",
    text: "È un caffè ben tostato con un corpo non pienissimo ma con profumo e sapore eccellente.",
  },
];

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
      {/* 1. Hero */}
      <section className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
        <div className="max-w-2xl space-y-8">
          <div>
            <img src="/logo.webp" alt="Coffeeriff" className="invert mx-auto h-auto w-auto max-w-[60%] sm:max-w-[50%]" />
            <p className="mt-3 font-serif text-lg italic text-brown">
              è tutta un&apos;altra musica
            </p>
            <div className="mx-auto mt-5 h-px w-16 bg-brown" />
          </div>

          <p className="mx-auto max-w-md text-base leading-relaxed text-muted">
            Bere caffè non è solo un gesto, è un piacere da gustare.
          </p>

          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4">
            <Link
              href="/caffetteria"
              className="inline-block border border-charcoal bg-charcoal px-10 py-4 text-xs font-semibold uppercase tracking-widest text-cream transition-colors hover:bg-transparent hover:text-charcoal"
            >
              Esplora i Caffè
            </Link>
            <Link
              href="/quiz"
              className="inline-block border border-border px-10 py-4 text-xs font-semibold uppercase tracking-widest text-charcoal transition-colors hover:border-charcoal"
            >
              Trova il Tuo Caffè
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Featured products */}
      {featured.length > 0 && (
        <section className="bg-white px-6 py-16">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 flex items-end justify-between">
              <div>
                <h2 className="font-serif text-2xl font-bold italic text-charcoal">
                  Le nostre selezioni
                </h2>
                <p className="mt-1 text-sm text-muted">
                  I caffè con il punteggio SCA più alto del nostro catalogo.
                </p>
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

            <div className="mt-8 text-center sm:hidden">
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
      <section className="bg-cream-dark px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-12 text-center font-serif text-2xl font-bold italic text-charcoal sm:text-3xl">
            Ogni tazza, un nuovo piacere
          </h2>
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
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
                <span className="font-serif text-4xl font-bold italic text-brown/30">
                  {item.n}
                </span>
                <h3 className="mt-2 font-serif text-lg font-semibold italic text-charcoal">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Quiz CTA */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="font-serif text-2xl font-bold italic text-charcoal sm:text-3xl">
            Non sai quale scegliere?
          </h2>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted">
            Rispondi a 5 domande e la nostra AI abbinerà i tuoi gusti ai
            migliori caffè del nostro catalogo.
          </p>
          <Link
            href="/quiz"
            className="mt-6 inline-block border border-brown px-10 py-4 text-xs font-semibold uppercase tracking-widest text-brown transition-colors hover:bg-brown hover:text-cream"
          >
            Inizia il Quiz
          </Link>
          <p className="mt-3 text-[11px] uppercase tracking-widest text-muted">
            5 domande · meno di un minuto
          </p>
        </div>
      </section>

      {/* 5. Brand identity */}
      <section className="bg-cream-dark px-6 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-serif text-2xl font-bold italic text-charcoal sm:text-3xl">
            Dai ritmo alla tua giornata con un riff
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-sm leading-relaxed text-muted">
            Il riff è una frase musicale distintiva, composta da una successione di note che
            si ripete frequentemente in una composizione, spesso utilizzata come accompagnamento.
          </p>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted">
            Ogni nostro caffè è paragonabile a un diverso strumento musicale: dalle note gravi
            e profonde di un Brasile naturale alle note acute e brillanti di un Kenya lavato,
            ogni tazza offre un&apos;esperienza unica e ricca di sfumature.
          </p>
        </div>
      </section>

      {/* 6. Reviews */}
      <section className="bg-white px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <h2 className="font-serif text-2xl font-bold italic text-charcoal">
              Cosa pensa chi lo ha già assaggiato
            </h2>
            <p className="mt-1 text-sm text-muted">Lasciamo parlare i clienti per noi</p>
          </div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {REVIEWS.map((r) => (
              <div key={r.name} className="border border-border p-6">
                <p className="text-sm leading-relaxed text-charcoal">&ldquo;{r.text}&rdquo;</p>
                <div className="mt-4 border-t border-border pt-4">
                  <p className="text-xs font-semibold text-charcoal">{r.name}</p>
                  <p className="mt-0.5 text-[11px] text-muted">{r.product}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Filosofia teaser */}
      <section className="bg-charcoal px-6 py-16 text-cream">
        <div className="mx-auto max-w-2xl text-center">
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
            className="mt-8 inline-block border border-cream/30 px-8 py-3 text-xs font-semibold uppercase tracking-widest text-cream/80 transition-colors hover:border-cream hover:text-cream"
          >
            Scopri la nostra filosofia →
          </Link>
        </div>
      </section>
    </>
  );
}
