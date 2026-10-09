export type JourneyPhase = "Trying" | "Treatment" | "Pregnant" | "Postpartum" | "Ended";
export type JourneyOutcome = "Birth" | "Loss" | "Stopped";
export type ConceptionPath = "Natural" | "Iui" | "Ivf";
export type CycleEntryType = "Period" | "LhTest" | "Temperature";

export interface Symptom {
  name: string;
  severity: number; // 1-5
}

export interface JournalEntry {
  id: string;
  userId: string;
  date: string; // ISO date (yyyy-MM-dd)
  text: string;
  mood: number; // 1-5
  symptoms: Symptom[];
  phase: JourneyPhase;
  pregnancyWeek?: number | null;
}

export interface CycleEntry {
  id: string;
  userId: string;
  date: string;
  entryType: CycleEntryType;
  value: number;
}

export interface ScanResult {
  follicleCount?: number | null;
  liningMm?: number | null;
}

export interface TreatmentEntry {
  id: string;
  userId: string;
  date: string;
  cycleDay?: number | null;
  medication?: string | null;
  dose?: string | null;
  time?: string | null; // "HH:mm:ss"
  clinicVisit: boolean;
  scanResults?: ScanResult | null;
  betaHcgResult?: number | null;
}

export interface Journey {
  id: string;
  userId: string;
  phase: JourneyPhase;
  startDate: string;
  outcome?: JourneyOutcome | null;
  conceptionPath?: ConceptionPath | null;
  lastMenstrualPeriodDate?: string | null;
  ivfTransferDate?: string | null;
  ivfTransferDayNumber?: number | null;
  postpartumStartDate?: string | null;
}

export interface FertileWindowEstimate {
  windowStart: string;
  windowEnd: string;
  estimatedOvulationDay: string;
  isEstimate: boolean;
}
