"use client";

export default function DiscoveryBoxCard() {
  return (
    <div className="flex flex-col border-2 border-brown bg-white p-6 transition-shadow hover:shadow-md">
      <div className="mb-4 text-2xl">☕</div>
      <h3 className="font-serif text-xl font-semibold italic text-charcoal">
        Non sei ancora sicuro?
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Esplora il catalogo completo o contatta il team Coffeeriff per un
        consiglio personalizzato — ti aiutiamo a trovare il tuo caffè ideale.
      </p>
      <a
        href="https://coffeeriff.com"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 block border border-brown py-3 text-center text-xs font-semibold uppercase tracking-widest text-brown transition-colors hover:bg-brown hover:text-cream"
      >
        Scopri il catalogo completo →
      </a>
    </div>
  );
}
