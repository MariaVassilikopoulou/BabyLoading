import { useState } from "react";
import { daysBetween, formatDayMonth, formatFull } from "../lib/dates";
import { pregnancyProgress, type StepState } from "../lib/journey";
import type { FertileWindowEstimate, GestationalAge, Journey } from "../types";

// One card per journey phase, all sharing the "loading" voice:
// getting ready… → connecting… → baby loading… → loaded.

const trimesterNames = { 1: "first trimester", 2: "second trimester", 3: "third trimester" } as const;

export function PregnantCard({ age, journey }: { age: GestationalAge; journey: Journey }) {
  const [view, setView] = useState(0);
  const progress = pregnancyProgress(age);

  const views = [
    { big: `${progress.percent}%`, small: `Week ${age.weeks} + ${age.days} days · ${trimesterNames[progress.trimester]}` },
    { big: `Day ${progress.totalDays}`, small: `of about 280 · ${progress.daysToGo} days to go` },
    { big: `${age.weeks}w ${age.days}d`, small: `about ${progress.weeksToGo} weeks to go` },
  ];
  const current = views[view];

  // 40 segments, one per week; the current week fills by how many of its days have passed.
  const segments = Array.from({ length: 40 }, (_, i) => {
    const week = i + 1;
    if (week <= age.weeks) return 1;
    if (week === age.weeks + 1) return age.days / 7;
    return 0;
  });

  const datedFrom = journey.conceptionPath === "Ivf" ? "your transfer date" : "your last period";

  return (
    <section className="load-card load-card--pregnant" aria-label="Pregnancy progress">
      <div className="load-card-top">
        <span className="load-verb">baby loading…</span>
        <span className="load-tag">Pregnant{journey.conceptionPath === "Ivf" ? " · IVF" : ""}</span>
      </div>

      <button
        type="button"
        className="load-big-button"
        onClick={() => setView((view + 1) % views.length)}
        aria-label={`${current.big}, ${current.small}. Tap to switch view.`}
      >
        <span className="load-big">{current.big}</span>
        <span className="load-small">{current.small}</span>
      </button>

      <div>
        <div className="week-bar" role="img" aria-label={`Week ${age.weeks} plus ${age.days} days of 40`}>
          {segments.map((fill, i) => (
            <span key={i} className="week-seg" style={{ ["--fill" as string]: fill, animationDelay: `${i * 18}ms` }} />
          ))}
        </div>
        <div className="trimester-labels" aria-hidden="true">
          <span>1st trimester</span>
          <span>2nd trimester</span>
          <span>3rd</span>
        </div>
      </div>

      <div className="load-card-foot">
        <div>
          <span className="load-foot-label">Estimated arrival</span>
          <span className="load-foot-value">around {formatFull(age.estimatedDueDate)}</span>
        </div>
        <span className="load-foot-hint">Estimated from {datedFrom}</span>
      </div>
    </section>
  );
}

interface TryingCardProps {
  lastPeriodStart: string | null;
  fertileWindow: FertileWindowEstimate | null;
  today: string;
}

export function TryingCard({ lastPeriodStart, fertileWindow, today }: TryingCardProps) {
  const cycleDay = lastPeriodStart ? daysBetween(lastPeriodStart, today) + 1 : null;
  const length = Math.max(28, cycleDay ?? 0);

  const fertileFrom = lastPeriodStart && fertileWindow ? daysBetween(lastPeriodStart, fertileWindow.windowStart) + 1 : null;
  const fertileTo = lastPeriodStart && fertileWindow ? daysBetween(lastPeriodStart, fertileWindow.windowEnd) + 1 : null;

  return (
    <section className="load-card load-card--trying" aria-label="Cycle">
      <div className="load-card-top">
        <span className="load-verb">getting ready…</span>
        <span className="load-tag">Trying to conceive</span>
      </div>

      {cycleDay ? (
        <>
          <span className="load-big load-big--medium">Cycle day {cycleDay}</span>
          <div>
            <div className="cycle-bar" style={{ gridTemplateColumns: `repeat(${length}, minmax(0, 1fr))` }} aria-hidden="true">
              {Array.from({ length }, (_, i) => {
                const day = i + 1;
                const fertile = fertileFrom !== null && fertileTo !== null && day >= fertileFrom && day <= fertileTo;
                const classes = ["cycle-seg"];
                if (fertile) classes.push("cycle-seg--fertile");
                else if (day < cycleDay) classes.push("cycle-seg--past");
                if (day === cycleDay) classes.push("cycle-seg--today");
                return <span key={day} className={classes.join(" ")} />;
              })}
            </div>
            <div className="legend">
              <span><i className="swatch swatch--fertile" />likely fertile</span>
              <span><i className="swatch swatch--past" />days so far</span>
            </div>
          </div>
        </>
      ) : (
        <span className="load-big load-big--medium">Log your period to begin</span>
      )}

      <div className="load-card-foot load-card-foot--stack">
        {fertileWindow ? (
          <span className="load-foot-value">
            Likely fertile {formatDayMonth(fertileWindow.windowStart)} – {formatDayMonth(fertileWindow.windowEnd)}
          </span>
        ) : (
          <span className="load-foot-value">No fertile-window estimate yet</span>
        )}
        <span className="load-foot-hint">An estimate from your cycle history. Never use it as contraception.</span>
      </div>
    </section>
  );
}

export function TreatmentCard({ steps }: { steps: StepState[] }) {
  const nowIndex = steps.findIndex((s) => s.state === "now");
  const position = nowIndex === -1 ? steps.length : nowIndex + 1;
  const next = steps.find((s) => s.state === "now");

  return (
    <section className="load-card load-card--treatment" aria-label="Treatment progress">
      <div className="load-card-top">
        <span className="load-verb">connecting…</span>
        <span className="load-tag">Treatment</span>
      </div>
      <span className="load-big load-big--medium">
        Step {position} of {steps.length}
      </span>
      <ol className="step-list">
        {steps.map((s) => (
          <li key={s.step} className={`step step--${s.state}`}>
            <span className="step-mark" aria-hidden="true" />
            {s.label}
            <span className="visually-hidden">{s.state === "done" ? " (done)" : s.state === "now" ? " (current)" : ""}</span>
          </li>
        ))}
      </ol>
      {next && (
        <div className="load-card-foot load-card-foot--stack">
          <span className="load-foot-label">Next</span>
          <span className="load-foot-value">{next.label}</span>
        </div>
      )}
    </section>
  );
}

export function PostpartumCard({ journey, today }: { journey: Journey; today: string }) {
  const born = journey.postpartumStartDate;
  const daysSince = born ? daysBetween(born, today) : null;

  return (
    <section className="load-card load-card--postpartum" aria-label="After the birth">
      <div className="load-card-top">
        <span className="load-verb">loaded.</span>
      </div>
      <span className="load-big load-big--medium">Hello, little one</span>
      {born && daysSince !== null && (
        <span className="load-small">
          Born {formatDayMonth(born)} · {daysSince === 0 ? "today" : daysSince === 1 ? "yesterday" : `${daysSince} days ago`}
        </span>
      )}
      <div className="full-bar" aria-hidden="true">100%</div>
      <div className="load-card-foot load-card-foot--stack">
        <span className="load-foot-label">Now it's about you</span>
        {daysSince !== null && <span className="load-foot-value">Recovery · week {Math.floor(daysSince / 7) + 1}</span>}
      </div>
    </section>
  );
}
