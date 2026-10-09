import type { GestationalAge, JournalEntry, Journey, TreatmentEntry, TreatmentStep } from "../types";
import { addDays, daysBetween, formatDayMonth } from "./dates";

const FULL_TERM_DAYS = 280;
const THIRD_TRIMESTER_DAY = 28 * 7;

/** The journey shown on Today: the newest one that hasn't ended, else the newest one. */
export function pickCurrentJourney(journeys: Journey[]): Journey | null {
  if (journeys.length === 0) return null;
  const byNewest = [...journeys].sort((a, b) => b.startDate.localeCompare(a.startDate));
  return byNewest.find((j) => j.phase !== "Ended") ?? byNewest[0];
}

/** A journey that ended in loss or was stopped gets calm mode by default. */
export function calmByDefault(journey: Journey | null): boolean {
  return journey?.outcome === "Loss" || journey?.outcome === "Stopped";
}

export interface PregnancyProgress {
  totalDays: number;
  percent: number;
  daysToGo: number;
  weeksToGo: number;
  trimester: 1 | 2 | 3;
}

export function pregnancyProgress(age: GestationalAge): PregnancyProgress {
  const totalDays = age.weeks * 7 + age.days;
  const daysToGo = Math.max(0, FULL_TERM_DAYS - totalDays);
  return {
    totalDays,
    percent: Math.min(100, Math.round((totalDays / FULL_TERM_DAYS) * 100)),
    daysToGo,
    weeksToGo: Math.round(daysToGo / 7),
    trimester: age.weeks < 13 ? 1 : age.weeks < 28 ? 2 : 3,
  };
}

/** Pregnancy week on a past date, from today's gestational age. Null before week 1. */
export function pregnancyWeekOn(dateIso: string, age: GestationalAge, todayIso: string): number | null {
  const daysOnDate = age.weeks * 7 + age.days - daysBetween(dateIso, todayIso);
  return daysOnDate >= 7 ? Math.floor(daysOnDate / 7) : null;
}

export const treatmentStepLabels: Record<TreatmentStep, string> = {
  Stimulation: "Stimulation",
  Trigger: "Trigger shot",
  Retrieval: "Egg retrieval",
  Transfer: "Embryo transfer",
  PregnancyTest: "Pregnancy test",
};

const ivfSteps: TreatmentStep[] = ["Stimulation", "Trigger", "Retrieval", "Transfer", "PregnancyTest"];
const iuiSteps: TreatmentStep[] = ["Stimulation", "Trigger", "PregnancyTest"];

export interface StepState {
  step: TreatmentStep;
  label: string;
  state: "done" | "now" | "next";
}

/** Where she is in a treatment course: steps with an entry are done, the first one without is "now". */
export function treatmentProgress(journey: Journey, treatments: TreatmentEntry[]): StepState[] {
  const steps = journey.conceptionPath === "Iui" ? iuiSteps : ivfSteps;
  const logged = new Set(treatments.map((t) => t.step).filter(Boolean));
  let nowAssigned = false;
  return steps.map((step) => {
    let state: StepState["state"] = "next";
    if (logged.has(step)) state = "done";
    else if (!nowAssigned) {
      state = "now";
      nowAssigned = true;
    }
    return { step, label: treatmentStepLabels[step], state };
  });
}

export interface Milestone {
  key: string;
  when: string; // short label: "16 May", "Now", "~1 Feb"
  what: string;
  state: "done" | "now" | "next";
}

const milestoneSteps: TreatmentStep[] = ["Retrieval", "Transfer", "PregnancyTest"];

function quote(text: string): string {
  const firstSentence = text.split(/(?<=[.!?])\s/)[0];
  const short = firstSentence.length > 48 ? `${firstSentence.slice(0, 45).trimEnd()}…` : firstSentence;
  return `“${short}”`;
}

/**
 * The "loading log" while pregnant: treatment milestones and entries she pinned (done),
 * the current week (now), and the next dates ahead. Only her own data and calendar math.
 */
export function pregnancyMilestones(
  age: GestationalAge,
  treatments: TreatmentEntry[],
  journal: JournalEntry[],
  todayIso: string,
): Milestone[] {
  const done: (Milestone & { date: string })[] = [];

  for (const step of milestoneSteps) {
    const first = treatments
      .filter((t) => t.step === step)
      .sort((a, b) => a.date.localeCompare(b.date))[0];
    if (first) {
      done.push({ key: `t-${first.id}`, date: first.date, when: formatDayMonth(first.date), what: treatmentStepLabels[step], state: "done" });
    }
  }

  for (const entry of journal.filter((e) => e.isMilestone && e.date <= todayIso)) {
    done.push({ key: `j-${entry.id}`, date: entry.date, when: formatDayMonth(entry.date), what: quote(entry.text), state: "done" });
  }

  done.sort((a, b) => a.date.localeCompare(b.date));

  const { totalDays } = pregnancyProgress(age);
  const next: Milestone[] = [];
  if (totalDays < THIRD_TRIMESTER_DAY) {
    const date = addDays(todayIso, THIRD_TRIMESTER_DAY - totalDays);
    next.push({ key: "third-trimester", when: formatDayMonth(date), what: "Third trimester", state: "next" });
  }
  next.push({ key: "due", when: `~${formatDayMonth(age.estimatedDueDate)}`, what: "Arrival", state: "next" });

  return [
    ...done.slice(-4),
    { key: "now", when: "Now", what: `Week ${age.weeks + 1} loading…`, state: "now" },
    ...next,
  ];
}
