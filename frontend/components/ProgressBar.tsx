"use client";

interface ProgressBarProps {
  current: number;
  total: number;
}

export default function ProgressBar({ current, total }: ProgressBarProps) {
  const pct = ((current + 1) / total) * 100;

  return (
    <div className="w-full max-w-md mx-auto mb-8">
      <div className="flex justify-between text-sm text-coffee-200 mb-2">
        <span>
          Domanda {current + 1} di {total}
        </span>
        <span>{Math.round(pct)}%</span>
      </div>
      <div className="h-2 rounded-full bg-coffee-800">
        <div
          className="h-2 rounded-full bg-coffee-200 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
