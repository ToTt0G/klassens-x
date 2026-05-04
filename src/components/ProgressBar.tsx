"use client";

interface Props {
  current: number;
  total: number;
}

export default function ProgressBar({ current, total }: Props) {
  const remaining = total - current;
  const pct = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className="w-full flex items-center gap-4">
      <div className="flex-shrink-0 font-[family-name:var(--font-headline)] font-black text-xl text-primary">
        {current} <span className="text-on-background">/ {total}</span>
      </div>
      <div className="flex-1 border-4 border-black bg-surface h-6 overflow-hidden relative skew-x-[-10deg]">
        <div 
          className="h-full bg-secondary-fixed border-r-4 border-black transition-all duration-500 ease-out" 
          style={{ width: `${pct}%` }} 
        />
      </div>
    </div>
  );
}
