import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-charcoal text-cream">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col gap-8 sm:flex-row sm:justify-between">
          {/* Brand */}
          <div>
            <p className="font-serif text-xl font-bold italic">Coffeeriff</p>
            <address className="mt-3 space-y-1 text-xs not-italic text-cream/50 leading-relaxed">
              <p>Coffeeriff di JL</p>
              <p>Via Palmiro Togliatti 9, 45010 Papozze</p>
              <a href="mailto:info@coffeeriff.com" className="transition-colors hover:text-cream">
                info@coffeeriff.com
              </a>
            </address>
          </div>

          {/* Nav */}
          <nav className="flex flex-col gap-3 text-xs uppercase tracking-widest text-cream/60 sm:items-end">
            <Link href="/caffetteria" className="transition-colors hover:text-cream">
              Caffè
            </Link>
            <a
              href="https://coffeeriff.com/collections/capsule-compatibili-nespresso-specialty"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-cream"
            >
              Capsule
            </a>
            <a
              href="https://coffeeriff.com/collections/accessori"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-cream"
            >
              Accessori
            </a>
            <Link href="/filosofia" className="transition-colors hover:text-cream">
              Filosofia
            </Link>
            <Link href="/quiz" className="transition-colors hover:text-cream">
              Quiz AI
            </Link>
            <a
              href="https://coffeeriff.com"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-cream"
            >
              Shop
            </a>
          </nav>
        </div>

        <div className="mt-8 border-t border-cream/10 pt-6 text-center text-xs text-cream/40">
          © {new Date().getFullYear()} Coffeeriff. Tutti i diritti riservati.
        </div>
      </div>
    </footer>
  );
}
