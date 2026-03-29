import { useEffect, useRef } from "react";

interface CorrectionHintProps {
  phoneme: string;
  hint: string;
  open: boolean;
  onClose: () => void;
}

export function CorrectionHint({ phoneme, hint, open, onClose }: CorrectionHintProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      className="absolute z-10 bottom-full mb-2 left-1/2 -translate-x-1/2 w-64 rounded-xl border border-zinc-700 bg-zinc-900 p-3 shadow-xl"
    >
      <p className="text-xs font-semibold text-zinc-400 mb-1">
        /{phoneme}/
      </p>
      <p className="text-sm text-zinc-200 leading-relaxed">{hint}</p>
    </div>
  );
}
