import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { useSessionStore } from "@/stores/sessionStore";
import { useEvaluate } from "@/services/evaluationApi";
import { useMediaRecorder } from "@/hooks/useMediaRecorder";
import { WordCard } from "@/components/features/WordCard/WordCard";
import { AudioRecorder } from "@/components/features/AudioRecorder/AudioRecorder";
import { PhoneticBreakdown } from "@/components/features/PhoneticBreakdown/PhoneticBreakdown";
import { Button } from "@/components/ui/Button";
import type { WordResponse } from "@/types";

export function SessionPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const words: WordResponse[] = (location.state as { words: WordResponse[] } | null)?.words ?? [];

  const {
    currentIndex,
    recordingState,
    results,
    initSession,
    advance,
    setResults,
    setRecordingState,
  } = useSessionStore();

  const { mutate: evaluate } = useEvaluate();

  const { state: recState, start, stop, reset } = useMediaRecorder({
    onComplete: (blob) => {
      const word = words[currentIndex];
      if (!word) return;
      evaluate(
        { audio: blob, wordId: word.id },
        {
          onSuccess: (data) => setResults(data.results),
          onError: () => setRecordingState("idle"),
        }
      );
    },
  });

  useEffect(() => {
    if (words.length > 0) initSession(words);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setRecordingState(recState);
  }, [recState, setRecordingState]);

  const currentWord = words[currentIndex];
  const isLastWord = currentIndex >= words.length - 1;

  if (!currentWord) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6">
        <p className="text-zinc-300 text-lg">Session complete!</p>
        <Button onClick={() => navigate("/")}>Back to Word Lists</Button>
      </div>
    );
  }

  function handleNext() {
    if (isLastWord) {
      navigate("/");
    } else {
      advance();
      reset();
    }
  }

  function handleRetry() {
    useSessionStore.getState().setResults([]);
    useSessionStore.getState().setRecordingState("idle");
    reset();
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 gap-10">
      <button
        onClick={() => navigate("/")}
        className="absolute top-5 left-5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
      >
        ← Back
      </button>

      <WordCard word={currentWord.text} index={currentIndex} total={words.length} />

      <PhoneticBreakdown results={results ?? []} />

      <AudioRecorder
        onRecordingComplete={() => {}}
        state={recordingState}
        onStart={start}
        onStop={stop}
        disabled={recordingState === "processing"}
      />

      {results && results.length > 0 && (
        <div className="flex gap-3">
          <Button variant="ghost" onClick={handleRetry}>
            Retry
          </Button>
          <Button onClick={handleNext}>
            {isLastWord ? "Finish" : "Next →"}
          </Button>
        </div>
      )}
    </div>
  );
}
