import { useNavigate } from "react-router";
import { useWords } from "@/services/wordApi";
import { Button } from "@/components/ui/Button";

export function WordListsPage() {
  const navigate = useNavigate();
  const { data: words, isLoading, isError } = useWords();

  function startSession() {
    if (words) {
      navigate("/session", { state: { words } });
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-zinc-100">Pronunciation Trainer</h1>
          <p className="text-sm text-zinc-500">Practice English phonemes</p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-widest">
              All Words
            </h2>
            {words && (
              <span className="text-xs text-zinc-500">{words.length} words</span>
            )}
          </div>

          {isLoading && (
            <p className="text-sm text-zinc-500">Loading dictionary…</p>
          )}

          {isError && (
            <p className="text-sm text-red-400">Failed to load words. Is the backend running?</p>
          )}

          {words && (
            <ul className="space-y-1">
              {words.slice(0, 6).map((w) => (
                <li key={w.id} className="flex items-center gap-3 text-sm">
                  <span className="text-zinc-200 font-medium w-24">{w.text}</span>
                  <span className="text-zinc-500 font-mono text-xs">
                    /{w.ipa.join(" · ")}/
                  </span>
                </li>
              ))}
              {words.length > 6 && (
                <li className="text-xs text-zinc-600">+ {words.length - 6} more…</li>
              )}
            </ul>
          )}
        </div>

        <Button
          className="w-full py-3 text-base"
          disabled={!words || words.length === 0}
          onClick={startSession}
        >
          Start Session →
        </Button>
      </div>
    </div>
  );
}
