"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import MobileMenu from "./MobileMenu";

export const NAV_LINKS = [
  { href: "/caffetteria", label: "Caffè" },
  { href: "/capsule", label: "Capsule" },
  { href: "/accessori", label: "Accessori" },
  { href: "/filosofia", label: "Filosofia" },
  { href: "/quiz", label: "Quiz AI" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="sticky top-0 z-50">
      {/* Announcement bar */}
      <div className="bg-charcoal px-4 py-2 text-center text-[11px] font-medium uppercase tracking-widest text-cream/80">
        Spedizione gratuita sopra €47 &middot; Spedizione in 24h
      </div>

      {/* Main header */}
      <header
        className={`border-b border-border bg-cream/90 backdrop-blur-sm transition-all duration-300 ${
          scrolled ? "py-2" : "py-4"
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6">
          <Link href="/" aria-label="Coffeeriff — Home">
            {/* Logo is white; invert makes it black on the light cream header */}
            <Image
              src="/small_logo_header.png"
              alt="Coffeeriff-small-logo"
              width={20}
              height={10}
              className="invert"
              priority
            />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-8 sm:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium uppercase tracking-widest text-muted transition-colors hover:text-charcoal focus-ring"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Mobile hamburger */}
          <MobileMenu links={NAV_LINKS} />
        </div>
      </header>
    </div>
  );
}
