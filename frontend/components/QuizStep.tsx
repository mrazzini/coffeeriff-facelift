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
    <div className="animate-fadeUp space-y-8">
      <h2 className="text-center font-serif text-2xl font-medium italic text-charcoal sm:text-3xl">
        {question}
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onSelect(opt)}
            className={`border px-5 py-4 text-left text-sm leading-snug transition-colors duration-150 ${
              selected === opt
                ? "border-brown bg-brown/10 text-charcoal"
                : "border-border bg-white text-charcoal hover:border-brown/50 hover:bg-brown/5"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
