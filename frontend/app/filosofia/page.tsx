import Link from "next/link";

export default function FilosofiaPage() {
  return (
    <main className="bg-cream px-6 py-16">
      <div className="mx-auto max-w-2xl">
        {/* Back link */}
        <Link
          href="/"
          className="mb-10 inline-block text-xs font-medium uppercase tracking-widest text-muted transition-colors hover:text-charcoal"
        >
          ← Home
        </Link>

        {/* Page heading */}
        <h1 className="font-serif text-4xl font-bold italic text-charcoal sm:text-5xl">
          Filosofia
        </h1>

        {/* Opening quote */}
        <p className="mt-8 font-serif text-xl italic leading-relaxed text-brown sm:text-2xl">
          Bere caffè non è solo un gesto, è un piacere da gustare.
        </p>

        <p className="mt-4 text-sm leading-relaxed text-muted">
          Con Coffeeriff vivi un modo diverso di intendere il caffè, dove ogni tazza racconta
          un percorso fatto di scelte consapevoli e rispetto per chi lo coltiva.
        </p>

        <div className="mt-10 space-y-6 text-sm leading-relaxed text-muted">
          <p>
            Coffeeriff nasce dal desiderio di creare tazze pulite, luminose e vive, capaci di
            raccontare l&apos;identità di ogni origine. Selezioniamo caffè crudi in base a
            provenienza, lavorazione e risultato in tazza, scegliendo lotti tracciabili e
            riconoscendo prezzi equi a chi li coltiva, con prezzi superiori ai riferimenti di
            mercato.
          </p>

          <p>
            Sono Johnny, fondatore di Coffeeriff, e definisco la direzione tecnica del progetto:
            dalla selezione dei lotti allo sviluppo dei profili di tostatura. Ogni decisione
            parte da analisi, assaggi e confronto: il nostro obiettivo è valorizzare la materia
            prima e portare in tazza l&apos;identità di ogni origine.
          </p>

          <p>
            In laboratorio tostiamo micro-lotti con la nostra IMF a gas, controllando ogni
            variabile: temperatura di carico, potenza, airflow e velocità del tamburo. Ogni
            caffè riceve un profilo dedicato, costruito per esprimere al meglio quello che porta
            con sé. Preferiamo tostature dal chiaro al medio per far emergere dolcezza naturale
            e vivacità aromatica, lasciando che ogni origine racconti la propria storia.
            Cerchiamo tazze limpide, brillanti e definite, dove dolcezza, vivacità e chiarezza
            siano sempre in equilibrio. Ogni lotto è trattato con precisione, in piccoli batch.
          </p>

          <p>
            Lavorare in Italia significa confrontarsi con una tradizione gastronomica forte,
            radicata nel vino, nella cucina e anche nel caffè. Questo rende l&apos;innovazione
            più complessa rispetto ad altri contesti, ma ci offre anche un filtro naturale e una
            consapevolezza maggiore in ogni scelta. Valorizziamo le origini senza imporre uno
            stile unico: alcuni lotti spingono verso agrumi e fiori, altri verso cacao e
            cremosità.
          </p>

          <p>
            Tostiamo su ordinazione: produciamo quanto serve, quando serve, per garantire
            freschezza reale e ridurre gli sprechi. Se trovi aria nel sacchetto, è CO₂ naturale
            rilasciata dal caffè fresco, che protegge gli aromi e ne preserva
            l&apos;integrità. Maciniamo su richiesta, ma consigliamo il caffè in grani: è il
            modo migliore per mantenere intatto il profilo aromatico.
          </p>

          <p>
            Coffeeriff oggi è questo: una torrefazione che lavora per ottenere chiarezza,
            dolcezza ed energia sensoriale, unendo metodo, controllo e scelte consapevoli.
            Ogni caffè che proponiamo raggiunge standard precisi di qualità: scegliamo solo
            ciò che convince davvero in tazza. Ogni lotto racconta una storia diversa, ma
            l&apos;obiettivo resta uno: portare in tazza l&apos;essenza più viva di ogni
            origine.
          </p>
        </div>

        {/* Closing line */}
        <p className="mt-12 border-t border-border pt-10 font-serif text-2xl font-bold italic text-charcoal sm:text-3xl">
          Bere meno, bere meglio.
        </p>

        {/* CTA */}
        <div className="mt-10">
          <Link
            href="/caffetteria"
            className="inline-block border border-charcoal bg-charcoal px-10 py-4 text-xs font-semibold uppercase tracking-widest text-cream transition-colors hover:bg-transparent hover:text-charcoal"
          >
            Esplora i nostri caffè →
          </Link>
        </div>
      </div>
    </main>
  );
}
