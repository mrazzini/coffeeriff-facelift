"use client";

interface QuizStepProps {
  question: string;
  options: string[];
  onSelect: (value: string) => void;
  selected?: string;
}

export default function QuizStep({
  question,
  options,
  onSelect,
  selected,
}: QuizStepProps) {
  return (
    <div className="space-y-6 animate-fadeIn">
      <h2 className="text-2xl font-semibold text-coffee-50 text-center sm:text-3xl">
        {question}
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 max-w-lg mx-auto">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onSelect(opt)}
            className={`rounded-xl border-2 px-6 py-4 text-left text-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
              selected === opt
                ? "border-coffee-200 bg-coffee-200/20 text-coffee-100"
                : "border-coffee-700 bg-coffee-800/50 text-coffee-200 hover:border-coffee-200/50"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
