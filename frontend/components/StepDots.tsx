"use client";

interface StepDotsProps {
  current: number;
  total: number;
}

export default function StepDots({ current, total }: StepDotsProps) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            i < current
              ? "w-4 bg-brown"
              : i === current
              ? "w-6 bg-charcoal"
              : "w-1.5 bg-border"
          }`}
        />
      ))}
    </div>
  );
}
