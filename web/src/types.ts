export type JourneyPhase = "Trying" | "Treatment" | "Pregnant" | "Postpartum" | "Ended";
export type JourneyOutcome = "Birth" | "Loss" | "Stopped";
export type ConceptionPath = "Natural" | "Iui" | "Ivf";
export type CycleEntryType = "Period" | "LhTest" | "Temperature";
export type TreatmentStep = "Stimulation" | "Trigger" | "Retrieval" | "Transfer" | "PregnancyTest";

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
  isMilestone: boolean;
  pregnancyWeek?: number | null;
}

export interface CycleEntry {
  id: string;
  userId: string;
  date: string;
  entryType: CycleEntryType;
  value: number; // Period: flow 1-3. LhTest: 1 = positive, 0 = negative. Temperature: °C.
}

export interface ScanResult {
  follicleCount?: number | null;
  liningMm?: number | null;
}

export interface TreatmentEntry {
  id: string;
  userId: string;
  date: string;
  step?: TreatmentStep | null;
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

export interface GestationalAge {
  weeks: number;
  days: number;
  estimatedDueDate: string;
}

export interface FertileWindowEstimate {
  windowStart: string;
  windowEnd: string;
  estimatedOvulationDay: string;
  isEstimate: boolean;
}
