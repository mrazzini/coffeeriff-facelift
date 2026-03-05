"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

function InstagramIcon() {
  return (
    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export default function Footer() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setSubmitted(true);
  };

  return (
    <footer className="border-t border-border">
      {/* Newsletter strip */}
      <div className="bg-cream-dark px-6 py-10">
        <div className="mx-auto max-w-lg text-center">
          <h3 className="font-serif text-lg font-semibold italic text-charcoal">
            Resta aggiornato sui nuovi arrivi
          </h3>
          <p className="mt-1 text-sm text-muted">
            Offerte riservate, microlotti in anteprima e consigli di degustazione.
          </p>
          {submitted ? (
            <p className="mt-4 text-sm font-medium text-brown">
              Grazie! Ti terremo aggiornato.
            </p>
          ) : (
            <form onSubmit={handleNewsletter} className="mt-4 flex gap-2">
              <input
                type="email"
                required
                placeholder="La tua email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 border border-border bg-white px-4 py-2.5 text-sm text-charcoal placeholder:text-muted/60 focus:border-brown focus:outline-none"
              />
              <button
                type="submit"
                className="shrink-0 bg-brown px-5 py-2.5 text-xs font-semibold uppercase tracking-widest text-cream transition-colors hover:bg-charcoal focus-ring"
              >
                Iscriviti
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Main footer */}
      <div className="bg-charcoal text-cream">
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

              {/* Social links */}
              <div className="mt-4 flex gap-3">
                <a
                  href="https://www.instagram.com/coffeeriff/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cream/50 transition-colors hover:text-cream"
                  aria-label="Coffeeriff su Instagram"
                >
                  <InstagramIcon />
                </a>
              </div>
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
      </div>
    </footer>
  );
}
