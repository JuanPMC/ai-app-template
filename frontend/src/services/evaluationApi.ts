import { useMutation } from "@tanstack/react-query";
import { BASE_URL } from "./api";
import type { EvaluationResponse } from "@/types";

export async function evaluateWord(
  audio: Blob,
  wordId: number
): Promise<EvaluationResponse> {
  const formData = new FormData();
  formData.append("audio", audio, "recording.webm");
  formData.append("word_id", String(wordId));
  formData.append("lang", "en");

  const res = await fetch(`${BASE_URL}/api/v1/evaluate`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const message = await res.text().catch(() => res.statusText);
    throw new Error(message);
  }

  return res.json() as Promise<EvaluationResponse>;
}

export function useEvaluate() {
  return useMutation({
    mutationFn: ({ audio, wordId }: { audio: Blob; wordId: number }) =>
      evaluateWord(audio, wordId),
  });
}
