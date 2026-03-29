import { cn } from "@/lib/utils";
import type { RecordingState } from "@/types";

interface AudioRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
  disabled?: boolean;
  state: RecordingState;
  onStart: () => void;
  onStop: () => void;
}

export function AudioRecorder({
  disabled = false,
  state,
  onStart,
  onStop,
}: AudioRecorderProps) {
  const isRecording = state === "recording";
  const isProcessing = state === "processing";

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onPointerDown={onStart}
        onPointerUp={onStop}
        onPointerLeave={onStop}
        disabled={disabled || isProcessing}
        className={cn(
          "relative w-20 h-20 rounded-full border-2 transition-all duration-150 select-none",
          "flex items-center justify-center",
          isRecording
            ? "border-red-500 bg-red-500/20 scale-110 animate-pulse"
            : isProcessing
            ? "border-zinc-600 bg-zinc-800 cursor-wait"
            : "border-zinc-500 bg-zinc-800 hover:border-zinc-300 hover:bg-zinc-700 active:scale-95",
          (disabled || isProcessing) && "opacity-50"
        )}
      >
        {isProcessing ? (
          <svg
            className="w-6 h-6 animate-spin text-zinc-400"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
        ) : (
          <span
            className={cn(
              "w-5 h-5 rounded-full transition-colors",
              isRecording ? "bg-red-500" : "bg-zinc-400"
            )}
          />
        )}
      </button>
      <p className="text-xs text-zinc-500">
        {isRecording
          ? "Recording… release to stop"
          : isProcessing
          ? "Processing…"
          : "Hold to speak"}
      </p>
    </div>
  );
}
