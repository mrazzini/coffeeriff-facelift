import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="max-w-2xl space-y-10">
        {/* Wordmark */}
        <div>
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-brown">
            Specialty Coffee Roasters
          </p>
          <h1 className="font-serif text-6xl font-bold italic tracking-tight text-charcoal sm:text-7xl">
            Coffeeriff
          </h1>
          <div className="mx-auto mt-4 h-px w-16 bg-brown" />
        </div>

        {/* Tagline */}
        <div className="space-y-4">
          <h2 className="font-serif text-2xl font-medium italic text-charcoal sm:text-3xl">
            Trova il tuo caffè perfetto
          </h2>
          <p className="mx-auto max-w-md text-base leading-relaxed text-muted">
            Rispondi a 5 domande e la nostra AI abbinerà i tuoi gusti ai
            migliori caffè specialty del nostro catalogo.
          </p>
        </div>

        {/* CTA */}
        <div className="space-y-4">
          <Link
            href="/quiz"
            className="inline-block border border-charcoal bg-charcoal px-10 py-4 text-sm font-semibold uppercase tracking-widest text-cream transition-colors hover:bg-transparent hover:text-charcoal"
          >
            Inizia il Quiz
          </Link>
          <p className="text-xs uppercase tracking-widest text-muted">
            5 domande · meno di un minuto
          </p>
        </div>
      </div>
    </main>
  );
}
