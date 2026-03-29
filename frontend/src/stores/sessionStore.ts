import { create } from "zustand";
import type { WordResponse, PhonemeResult, RecordingState } from "@/types";

interface SessionState {
  words: WordResponse[];
  currentIndex: number;
  recordingState: RecordingState;
  results: PhonemeResult[] | null;
  activeHint: PhonemeResult | null;

  initSession: (words: WordResponse[]) => void;
  advance: () => void;
  setRecordingState: (state: RecordingState) => void;
  setResults: (results: PhonemeResult[]) => void;
  setActiveHint: (result: PhonemeResult | null) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  words: [],
  currentIndex: 0,
  recordingState: "idle",
  results: null,
  activeHint: null,

  initSession: (words) =>
    set({ words, currentIndex: 0, recordingState: "idle", results: null, activeHint: null }),

  advance: () =>
    set((s) => ({
      currentIndex: s.currentIndex + 1,
      recordingState: "idle",
      results: null,
      activeHint: null,
    })),

  setRecordingState: (recordingState) => set({ recordingState }),

  setResults: (results) => set({ results, recordingState: "done" }),

  setActiveHint: (activeHint) => set({ activeHint }),
}));
