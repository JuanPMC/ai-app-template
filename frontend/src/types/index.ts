export interface WordResponse {
  id: number;
  text: string;
  ipa: string[];
}

export interface PhonemeResult {
  phoneme: string;
  correct: boolean;
  hint: string | null;
}

export interface EvaluationResponse {
  word_id: number;
  word_text: string;
  results: PhonemeResult[];
  all_correct: boolean;
}

export type RecordingState = "idle" | "recording" | "processing" | "done";
