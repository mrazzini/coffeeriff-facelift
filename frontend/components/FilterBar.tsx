"use client";

interface FilterOption {
  label: string;
  value: string;
}

interface FilterBarProps {
  options: FilterOption[];
  active: string | null;
  onSelect: (value: string | null) => void;
}

export default function FilterBar({ options, active, onSelect }: FilterBarProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      <button
        onClick={() => onSelect(null)}
        className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-medium uppercase tracking-wider transition-colors ${
          active === null
            ? "bg-charcoal text-cream"
            : "border border-border text-muted hover:border-brown hover:text-charcoal"
        }`}
      >
        Tutti
      </button>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onSelect(active === opt.value ? null : opt.value)}
          className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-medium uppercase tracking-wider transition-colors ${
            active === opt.value
              ? "bg-charcoal text-cream"
              : "border border-border text-muted hover:border-brown hover:text-charcoal"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
