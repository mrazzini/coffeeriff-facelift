import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-charcoal text-cream">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col gap-8 sm:flex-row sm:justify-between">
          {/* Brand */}
          <div>
            {/* Logo is white — no filter needed on dark charcoal footer */}
            <Image src="/logo.webp" alt="Coffeeriff" width={110} height={36} />
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
            <Link href="/caffetteria" className="transition-colors hover:text-cream">Caffè</Link>
            <Link href="/capsule" className="transition-colors hover:text-cream">Capsule</Link>
            <Link href="/accessori" className="transition-colors hover:text-cream">Accessori</Link>
            <Link href="/filosofia" className="transition-colors hover:text-cream">Filosofia</Link>
            <Link href="/quiz" className="transition-colors hover:text-cream">Quiz AI</Link>
          </nav>
        </div>

        <div className="mt-8 border-t border-cream/10 pt-6 text-center text-xs text-cream/40">
          © {new Date().getFullYear()} Coffeeriff. Tutti i diritti riservati.
        </div>
      </div>
    </footer>
  );
}
