import Link from "next/link";
import Image from "next/image";
import MobileMenu from "./MobileMenu";

export const NAV_LINKS = [
  { href: "/caffetteria", label: "Caffè" },
  { href: "/capsule", label: "Capsule" },
  { href: "/accessori", label: "Accessori" },
  { href: "/filosofia", label: "Filosofia" },
  { href: "/quiz", label: "Quiz AI" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-cream/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
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
              className="text-sm font-medium uppercase tracking-widest text-muted transition-colors hover:text-charcoal"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Mobile hamburger */}
        <MobileMenu links={NAV_LINKS} />
      </div>
    </header>
  );
}
