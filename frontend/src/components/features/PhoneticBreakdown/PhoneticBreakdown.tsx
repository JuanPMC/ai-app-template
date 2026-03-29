import { useState } from "react";
import { cn } from "@/lib/utils";
import { CorrectionHint } from "@/components/features/CorrectionHint/CorrectionHint";
import type { PhonemeResult } from "@/types";

interface PhoneticBreakdownProps {
  results: PhonemeResult[];
}

export function PhoneticBreakdown({ results }: PhoneticBreakdownProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (results.length === 0) return null;

  return (
    <div className="flex flex-wrap justify-center gap-3">
      {results.map((result, i) => (
        <div key={i} className="relative">
          <button
            onClick={() => {
              if (!result.correct && result.hint) {
                setActiveIndex(activeIndex === i ? null : i);
              }
            }}
            className={cn(
              "rounded-full border px-4 py-2 text-lg font-mono font-semibold transition-colors",
              result.correct
                ? "border-emerald-500 bg-emerald-500/10 text-emerald-400 cursor-default"
                : "border-red-500 bg-red-500/10 text-red-400 hover:bg-red-500/20 cursor-pointer"
            )}
          >
            /{result.phoneme}/
          </button>

          {!result.correct && result.hint && (
            <CorrectionHint
              phoneme={result.phoneme}
              hint={result.hint}
              open={activeIndex === i}
              onClose={() => setActiveIndex(null)}
            />
          )}
        </div>
      ))}
    </div>
  );
}
