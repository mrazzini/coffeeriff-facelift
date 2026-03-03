import Link from "next/link";
import MobileMenu from "./MobileMenu";

export const NAV_LINKS = [
  { href: "/caffetteria", label: "Caffè" },
  {
    href: "https://coffeeriff.com/collections/capsule-compatibili-nespresso-specialty",
    label: "Capsule",
    external: true,
  },
  {
    href: "https://coffeeriff.com/collections/accessori",
    label: "Accessori",
    external: true,
  },
  { href: "/filosofia", label: "Filosofia" },
  { href: "/quiz", label: "Quiz AI" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-cream/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-serif text-2xl font-bold italic text-charcoal">
          Coffeeriff
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 sm:flex">
          {NAV_LINKS.map((link) =>
            link.external ? (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium uppercase tracking-widest text-muted transition-colors hover:text-charcoal"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium uppercase tracking-widest text-muted transition-colors hover:text-charcoal"
              >
                {link.label}
              </Link>
            )
          )}
        </nav>

        {/* Mobile hamburger */}
        <MobileMenu links={NAV_LINKS} />
      </div>
    </header>
  );
}
