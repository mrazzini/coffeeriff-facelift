import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="max-w-2xl space-y-8">
        <h1 className="text-5xl font-bold tracking-tight text-coffee-100 sm:text-6xl">
          Coffeeriff
        </h1>
        <p className="text-xl text-coffee-200">Specialty Coffee Roasters</p>

        <div className="mt-12 space-y-4">
          <h2 className="text-3xl font-semibold text-coffee-50">
            Trova il Tuo Caffè Perfetto
          </h2>
          <p className="text-lg text-coffee-200">
            Rispondi a 5 semplici domande e la nostra AI troverà il caffè
            specialty perfetto per i tuoi gusti.
          </p>
        </div>

        <Link
          href="/quiz"
          className="mt-8 inline-block rounded-full bg-coffee-200 px-8 py-4 text-lg font-semibold text-coffee-900 transition-all hover:bg-coffee-100 hover:scale-105 active:scale-95"
        >
          Inizia il Quiz →
        </Link>

        <p className="text-sm text-coffee-200/60">
          Solo 5 domande · Meno di un minuto · Raccomandazioni personalizzate
        </p>
      </div>
    </main>
  );
}
