import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="it">
      <body className="min-h-screen bg-coffee-900 text-coffee-50 antialiased">
        {children}
      </body>
    </html>
  );
}
