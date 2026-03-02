"use client";

import { useState } from "react";
import Link from "next/link";
import QuizStep from "@/components/QuizStep";
import ProgressBar from "@/components/ProgressBar";
import ResultsCard from "@/components/ResultsCard";
import { getRecommendations, type Recommendation, type QuizAnswers } from "@/lib/api";

const QUESTIONS = [
  {
    key: "roast" as const,
    question: "Come preferisci il tuo caffè?",
    options: ["Leggero", "Medio", "Scuro", "Sorprendimi"],
  },
  {
    key: "flavors" as const,
    question: "Quali sapori ti attraggono?",
    options: [
      "Fruttato & Vivace",
      "Cioccolato & Nocciola",
      "Terroso & Intenso",
      "Floreale & Complesso",
    ],
  },
  {
    key: "brew_method" as const,
    question: "Come prepari il caffè di solito?",
    options: ["Filtro", "Espresso", "Moka", "French Press", "Non lo so ancora"],
  },
  {
    key: "intensity" as const,
    question: "Quanto lo vuoi forte?",
    options: ["Delicato", "Bilanciato", "Forte", "Fortissimo"],
  },
  {
    key: "adventure" as const,
    question: "Quanto sei avventuroso?",
    options: [
      "Classico & affidabile",
      "Aperto a suggerimenti",
      "Sorprendimi!",
    ],
  },
];

type AnswerKey = (typeof QUESTIONS)[number]["key"];

export default function QuizPage() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<Record<AnswerKey, string>>>({});
  const [results, setResults] = useState<Recommendation[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelect = async (value: string) => {
    const currentQ = QUESTIONS[step];
    const updated = { ...answers, [currentQ.key]: value };
    setAnswers(updated);

    if (step < QUESTIONS.length - 1) {
      // Small delay for animation feel
      setTimeout(() => setStep(step + 1), 300);
    } else {
      // Last question — submit
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

  // Loading state
  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
        <div className="space-y-6">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-coffee-700 border-t-coffee-200" />
          <p className="text-xl text-coffee-200">
            Il nostro sommelier AI sta analizzando i tuoi gusti...
          </p>
        </div>
      </main>
    );
  }

  // Results state
  if (results) {
    return (
      <main className="flex min-h-screen flex-col items-center px-4 py-12">
        <div className="w-full max-w-4xl space-y-8">
          <div className="text-center space-y-3">
            <h1 className="text-3xl font-bold text-coffee-100 sm:text-4xl">
              I Tuoi Caffè Perfetti
            </h1>
            <p className="text-coffee-200">
              Ecco i 3 caffè che meglio si adattano ai tuoi gusti
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((rec, i) => (
              <ResultsCard key={rec.product_name} rec={rec} index={i} />
            ))}
          </div>

          <div className="flex flex-col items-center gap-4 pt-4">
            <button
              onClick={restart}
              className="rounded-full border-2 border-coffee-200 px-6 py-3 font-semibold text-coffee-200 transition-all hover:bg-coffee-200/10"
            >
              Rifai il Quiz
            </button>
            <Link
              href="/"
              className="text-sm text-coffee-200/60 hover:text-coffee-200"
            >
              ← Torna alla Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Error state
  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
        <div className="space-y-6">
          <p className="text-xl text-red-400">{error}</p>
          <button
            onClick={restart}
            className="rounded-full bg-coffee-200 px-6 py-3 font-semibold text-coffee-900 hover:bg-coffee-100"
          >
            Riprova
          </button>
        </div>
      </main>
    );
  }

  // Quiz steps
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-xl space-y-8">
        <Link
          href="/"
          className="block text-center text-2xl font-bold text-coffee-200"
        >
          Coffeeriff
        </Link>

        <ProgressBar current={step} total={QUESTIONS.length} />

        <QuizStep
          question={QUESTIONS[step].question}
          options={QUESTIONS[step].options}
          onSelect={handleSelect}
          selected={answers[QUESTIONS[step].key]}
        />

        {step > 0 && (
          <button
            onClick={() => setStep(step - 1)}
            className="mx-auto block text-sm text-coffee-200/60 hover:text-coffee-200"
          >
            ← Domanda precedente
          </button>
        )}
      </div>
    </main>
  );
}
