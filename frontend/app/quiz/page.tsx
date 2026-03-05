"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import QuizStep from "@/components/QuizStep";
import StepDots from "@/components/StepDots";
import ResultsCard from "@/components/ResultsCard";
import DiscoveryBoxCard from "@/components/DiscoveryBoxCard";
import {
  getQuizConfig,
  getRecommendations,
  type QuizConfig,
  type QuizAnswers,
  type Recommendation,
} from "@/lib/api";

/** Thin top progress bar */
function ProgressBar({ value }: { value: number }) {
  return (
    <div className="fixed left-0 right-0 top-0 z-50 h-0.5 bg-border">
      <div
        className="h-full bg-brown transition-all duration-500 ease-out"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

/** Coffee cup SVG loading indicator */
function LoadingState() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-4 text-center">
      <div className="animate-pulse">
        <svg
          width="56"
          height="56"
          viewBox="0 0 56 56"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-brown"
        >
          {/* Cup body */}
          <path
            d="M10 20h28l-4 20H14L10 20z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
            fill="none"
          />
          {/* Handle */}
          <path
            d="M38 24c4 0 7 2 7 6s-3 6-7 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
          {/* Saucer */}
          <path
            d="M6 42h36"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Steam lines */}
          <path
            d="M18 14c0-2 2-2 2-4M24 12c0-2 2-2 2-4M30 14c0-2 2-2 2-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <p className="font-serif text-lg italic text-muted">
        Il nostro sommelier AI sta analizzando i tuoi gusti…
      </p>
    </div>
  );
}

export default function QuizPage() {
  const router = useRouter();
  const [config, setConfig] = useState<QuizConfig | null>(null);
  const [configError, setConfigError] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<QuizAnswers>>({});
  const [results, setResults] = useState<Recommendation[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [capsuleMode, setCapsuleMode] = useState(false);

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

    // Nespresso short-circuit: redirect to capsule page
    if (currentQ.key === "brew_method" && value === "Capsule Nespresso") {
      setCapsuleMode(true);
      return;
    }

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
    setCapsuleMode(false);
  };

  if (!config && !configError) return <LoadingState />;

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

  if (loading) return <LoadingState />;

  // Capsule redirect screen
  if (capsuleMode) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
        <p className="font-serif text-2xl font-bold italic text-charcoal">
          Sei nel posto giusto
        </p>
        <p className="max-w-sm text-sm leading-relaxed text-muted">
          Esplora le nostre capsule specialty — caffè di alta qualità nel
          formato che preferisci.
        </p>
        <Link
          href="/capsule"
          className="inline-block border border-brown bg-brown px-10 py-4 text-xs font-semibold uppercase tracking-widest text-cream transition-colors hover:bg-transparent hover:text-brown focus-ring"
        >
          Esplora le capsule →
        </Link>
        <button
          onClick={restart}
          className="text-sm text-muted underline-offset-4 hover:underline"
        >
          ← Ricomincia il quiz
        </button>
      </div>
    );
  }

  if (results) {
    // Grinder note: user has no grinder (or uses capsules) and chose espresso or moka
    const bm = (answers.brew_method ?? "").toLowerCase();
    const needsGrinderNote =
      (answers.has_grinder === "No, compro già macinato" ||
        answers.has_grinder === "Uso capsule Nespresso") &&
      (bm.includes("espresso") || bm.includes("moka"));
    const brewLabel = bm.includes("espresso") ? "espresso" : "moka";

    // Discovery card: ≥1 uncertain signal
    const uncertaintyCount = [
      answers.process?.endsWith("sorprendimi!"),
      answers.flavor_profile?.endsWith("sorprendimi"),
      answers.has_grinder === "Non lo so",
    ].filter(Boolean).length;
    const showDiscoveryCard = uncertaintyCount >= 1;

    return (
      <main className="min-h-screen bg-cream px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center animate-fadeUp">
            <h1 className="font-serif text-4xl font-bold italic text-charcoal sm:text-5xl">
              I tuoi caffè perfetti
            </h1>
            <p className="mt-3 text-muted">Tre selezioni scelte apposta per te</p>
          </div>

          {/* Grinder note banner */}
          {needsGrinderNote && (
            <p className="mb-8 rounded border border-brown/30 bg-brown/5 px-4 py-3 text-sm text-charcoal">
              Non hai un macinacaffè: sul sito seleziona la versione{" "}
              <strong>macinata per {brewLabel}</strong> dove disponibile.
            </p>
          )}

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Discovery card first when user is uncertain */}
            {showDiscoveryCard && <DiscoveryBoxCard />}

            {results.map((rec, i) => (
              <ResultsCard key={rec.product_name} rec={rec} rank={i + 1} />
            ))}
          </div>

          <div className="mt-14 flex flex-col items-center gap-4">
            <button
              onClick={restart}
              className="border border-charcoal px-8 py-3 text-sm font-semibold text-charcoal transition-colors hover:bg-charcoal hover:text-cream focus-ring"
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
          className="border border-charcoal px-8 py-3 text-sm font-semibold text-charcoal hover:bg-charcoal hover:text-cream focus-ring"
        >
          Riprova
        </button>
      </div>
    );
  }

  const questions = config!.questions;
  const progressPct = Math.round((step / questions.length) * 100);

  return (
    <>
      <ProgressBar value={progressPct} />
      <main className="flex min-h-screen flex-col items-center justify-center bg-cream px-4 py-12">
        <div className="w-full max-w-xl">
          <StepDots current={step} total={questions.length} />

          <div className="mt-8">
            <QuizStep
              key={step}
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

          {/* Store shortcut for users who already know what they want */}
          <Link
            href="/caffetteria"
            className="mx-auto mt-4 block text-center text-xs text-muted underline-offset-4 hover:underline"
          >
            So già quello che voglio →
          </Link>
        </div>
      </main>
    </>
  );
}
