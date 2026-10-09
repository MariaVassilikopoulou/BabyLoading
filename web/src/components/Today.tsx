import { useEffect, useState } from "react";
import { api } from "../api/client";
import { formatLong } from "../lib/dates";
import { pregnancyMilestones, treatmentProgress, type Milestone, type StepState } from "../lib/journey";
import { messages } from "../lib/labels";
import type { FertileWindowEstimate, GestationalAge, Journey } from "../types";
import { PostpartumCard, PregnantCard, TreatmentCard, TryingCard } from "./LoadingCard";
import { Status } from "./Status";

interface TodayProps {
  journey: Journey | null;
  age: GestationalAge | null;
  today: string;
  calm: boolean;
  onCalmChange: (calm: boolean) => void;
  onWrite: () => void;
  onTimeline: () => void;
}

interface PhaseData {
  milestones?: Milestone[];
  steps?: StepState[];
  lastPeriodStart?: string | null;
  fertileWindow?: FertileWindowEstimate | null;
}

export function Today({ journey, age, today, calm, onCalmChange, onWrite, onTimeline }: TodayProps) {
  const [data, setData] = useState<PhaseData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const phase = journey?.phase;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(false);
      try {
        let next: PhaseData = {};
        if (phase === "Pregnant" && age) {
          const [treatments, journal] = await Promise.all([api.treatmentEntries.list(), api.journalEntries.list()]);
          next = { milestones: pregnancyMilestones(age, treatments, journal, today) };
        } else if (phase === "Treatment" && journey) {
          next = { steps: treatmentProgress(journey, await api.treatmentEntries.list()) };
        } else if (phase === "Trying") {
          const cycle = await api.cycleEntries.list();
          const lastPeriod = cycle
            .filter((c) => c.entryType === "Period" && c.date <= today)
            .sort((a, b) => b.date.localeCompare(a.date))[0];
          const fertileWindow = await api.cycleEntries.fertileWindow().catch(() => null); // not enough data yet
          next = { lastPeriodStart: lastPeriod?.date ?? null, fertileWindow };
        }
        if (!cancelled) setData(next);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [phase, journey, age, today, attempt]);

  const calmToggle = <CalmToggle calm={calm} onChange={onCalmChange} />;

  if (calm) {
    return (
      <div className="screen screen--calm">
        <header className="screen-header">
          <p className="eyebrow">{formatLong(today)}</p>
          <h1>Today</h1>
        </header>
        <div className="calm-card">
          <p className="calm-title">Take whatever time you need.</p>
          <p>Everything you've written is kept safe and private. You can write here whenever you want to, or not at all.</p>
        </div>
        <div className="stack-sm">
          <button type="button" className="button button--secondary button--block" onClick={onWrite}>
            Write something
          </button>
          <button type="button" className="button button--link button--block" onClick={onTimeline}>
            Look back at your journey
          </button>
        </div>
        <div className="note">
          <p>You don't have to go through this alone. Your midwife, doctor or a support group can be there for you.</p>
        </div>
        {calmToggle}
      </div>
    );
  }

  return (
    <div className="screen">
      <header className="screen-header screen-header--row">
        <div>
          <p className="eyebrow">{formatLong(today)}</p>
          <h1>Today</h1>
        </div>
        <span className="wordmark" aria-hidden="true">
          baby<i>loading</i>
        </span>
      </header>

      {!journey && (
        <div className="card stack-sm">
          <h2>Nothing loaded yet.</h2>
          <p>Your first entry starts the story.</p>
        </div>
      )}

      {loading && journey && <Status kind="loading">Loading…</Status>}
      {error && (
        <Status kind="error" onRetry={() => setAttempt((a) => a + 1)}>
          {messages.loadError}
        </Status>
      )}

      {!loading && !error && journey && (
        <>
          {phase === "Pregnant" && age && <PregnantCard age={age} journey={journey} />}
          {phase === "Pregnant" && !age && (
            <div className="card">
              <p>Add your last period date or transfer date to see how far along you are.</p>
            </div>
          )}
          {phase === "Treatment" && data.steps && <TreatmentCard steps={data.steps} />}
          {phase === "Trying" && (
            <TryingCard lastPeriodStart={data.lastPeriodStart ?? null} fertileWindow={data.fertileWindow ?? null} today={today} />
          )}
          {phase === "Postpartum" && <PostpartumCard journey={journey} today={today} />}

          {data.milestones && (
            <section className="card" aria-labelledby="loading-log-title">
              <h2 id="loading-log-title" className="card-title">
                Loading log
              </h2>
              <ol className="milestones">
                {data.milestones.map((m) => (
                  <li key={m.key} className={`milestone milestone--${m.state}`}>
                    <span className="milestone-mark" aria-hidden="true">
                      {m.state === "done" && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 12l5 5 9-10" />
                        </svg>
                      )}
                    </span>
                    <span className="milestone-when">{m.when}</span>
                    <span className="milestone-what">{m.what}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </>
      )}

      <button type="button" className="button button--primary button--block button--large" onClick={onWrite}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
          <path d="M12 5v14M5 12h14" />
        </svg>
        How are you today?
      </button>

      <div className="note">
        <p>BabyLoading shows your own notes and never gives medical advice. If something feels wrong, contact your midwife or doctor.</p>
      </div>

      {calmToggle}
    </div>
  );
}

function CalmToggle({ calm, onChange }: { calm: boolean; onChange: (calm: boolean) => void }) {
  return (
    <div className="setting-row">
      <div>
        <span id="calm-label" className="setting-title">
          Calm mode
        </span>
        <span className="setting-hint">Hides percentages, countdowns and the loading theme.</span>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={calm}
        aria-labelledby="calm-label"
        className="switch"
        onClick={() => onChange(!calm)}
      >
        <span className="switch-knob" />
      </button>
    </div>
  );
}
