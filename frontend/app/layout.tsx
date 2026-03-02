import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Coffeeriff — Trova il Tuo Caffè Perfetto",
  description: "Quiz interattivo per scoprire il caffè specialty perfetto per te",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it" className={`${playfair.variable} ${inter.variable}`}>
      <body className="min-h-screen bg-cream font-sans text-charcoal antialiased">
        {children}
      </body>
    </html>
  );
}
