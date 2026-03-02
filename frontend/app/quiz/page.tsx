"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import QuizStep from "@/components/QuizStep";
import StepDots from "@/components/StepDots";
import ResultsCard from "@/components/ResultsCard";
import {
  getQuizConfig,
  getRecommendations,
  type QuizConfig,
  type QuizAnswers,
  type Recommendation,
} from "@/lib/api";

export default function QuizPage() {
  const [config, setConfig] = useState<QuizConfig | null>(null);
  const [configError, setConfigError] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<QuizAnswers>>({});
  const [results, setResults] = useState<Recommendation[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getQuizConfig()
      .then(setConfig)
      .catch(() => setConfigError(true));
  }, []);

  const handleSelect = async (value: string) => {
    if (!config) return;
    const currentQ = config.questions[step];
    const updated = { ...answers, [currentQ.key]: value };
    setAnswers(updated);

    if (step < config.questions.length - 1) {
      setTimeout(() => setStep(step + 1), 250);
    } else {
      setLoading(true);
      setError(null);
      try {
        const recs = await getRecommendations(updated as QuizAnswers);
        setResults(recs);
      } catch {
        setError("Si è verificato un errore. Riprova tra qualche secondo.");
      } finally {
        setLoading(false);
      }
    }
  };

  const restart = () => {
    setStep(0);
    setAnswers({});
    setResults(null);
    setError(null);
  };

  const Spinner = () => (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-brown border-t-transparent" />
      <p className="font-serif text-lg italic text-muted">
        Il nostro sommelier AI sta analizzando i tuoi gusti…
      </p>
    </div>
  );

  if (!config && !configError) return <Spinner />;

  if (configError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
        <p className="text-lg text-red-500">
          Impossibile caricare il quiz. Controlla che il backend sia attivo.
        </p>
        <Link href="/" className="text-sm text-brown underline underline-offset-4">
          ← Torna alla home
        </Link>
      </div>
    );
  }

  if (loading) return <Spinner />;

  if (results) {
    return (
      <main className="min-h-screen bg-cream px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <h1 className="font-serif text-4xl font-bold italic text-charcoal sm:text-5xl">
              I tuoi caffè perfetti
            </h1>
            <p className="mt-3 text-muted">Tre selezioni scelte apposta per te</p>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((rec) => (
              <ResultsCard key={rec.product_name} rec={rec} />
            ))}
          </div>

          <div className="mt-14 flex flex-col items-center gap-4">
            <button
              onClick={restart}
              className="border border-charcoal px-8 py-3 text-sm font-semibold text-charcoal transition-colors hover:bg-charcoal hover:text-cream"
            >
              Rifai il Quiz
            </button>
            <Link href="/" className="text-sm text-muted underline-offset-4 hover:underline">
              ← Torna alla home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
        <p className="text-lg text-red-500">{error}</p>
        <button
          onClick={restart}
          className="border border-charcoal px-8 py-3 text-sm font-semibold text-charcoal hover:bg-charcoal hover:text-cream"
        >
          Riprova
        </button>
      </div>
    );
  }

  const questions = config!.questions;
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-cream px-4 py-12">
      <div className="w-full max-w-xl">
        <Link
          href="/"
          className="mb-10 block text-center font-serif text-2xl font-bold italic tracking-wide text-charcoal"
        >
          Coffeeriff
        </Link>

        <StepDots current={step} total={questions.length} />

        <div className="mt-8">
          <QuizStep
            question={questions[step].question}
            options={questions[step].options}
            onSelect={handleSelect}
            selected={answers[questions[step].key as keyof QuizAnswers]}
          />
        </div>

        {step > 0 && (
          <button
            onClick={() => setStep(step - 1)}
            className="mx-auto mt-6 block text-sm text-muted underline-offset-4 hover:underline"
          >
            ← Domanda precedente
          </button>
        )}
      </div>
    </main>
  );
}
