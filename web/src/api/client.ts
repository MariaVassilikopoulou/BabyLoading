import type { CycleEntry, FertileWindowEstimate, JournalEntry, TreatmentEntry } from "../types";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5248";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });

  if (!response.ok) {
    throw new Error(`${init?.method ?? "GET"} ${path} failed: ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const api = {
  journalEntries: {
    list: () => request<JournalEntry[]>("/api/journal-entries"),
    create: (entry: Omit<JournalEntry, "id" | "userId">) =>
      request<JournalEntry>("/api/journal-entries", { method: "POST", body: JSON.stringify(entry) }),
  },
  cycleEntries: {
    list: () => request<CycleEntry[]>("/api/cycle-entries"),
    create: (entry: Omit<CycleEntry, "id" | "userId">) =>
      request<CycleEntry>("/api/cycle-entries", { method: "POST", body: JSON.stringify(entry) }),
    fertileWindow: () => request<FertileWindowEstimate>("/api/cycle-entries/fertile-window"),
  },
  treatmentEntries: {
    list: () => request<TreatmentEntry[]>("/api/treatment-entries"),
  },
};
