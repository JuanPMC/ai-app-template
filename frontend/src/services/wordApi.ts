import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "./api";
import type { WordResponse } from "@/types";

export function getWords(): Promise<WordResponse[]> {
  return apiFetch<WordResponse[]>("/api/v1/words");
}

export function getWord(id: number): Promise<WordResponse> {
  return apiFetch<WordResponse>(`/api/v1/words/${id}`);
}

export function useWords() {
  return useQuery({ queryKey: ["words"], queryFn: getWords });
}
