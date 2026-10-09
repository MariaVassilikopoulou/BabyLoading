import { useEffect, useState } from "react";
import { api } from "../api/client";
import { formatMonthYear, formatShort } from "../lib/dates";
import { treatmentStepLabels } from "../lib/journey";
import { messages, moodLabels } from "../lib/labels";
import type { CycleEntry, JournalEntry, TreatmentEntry } from "../types";
import { Status } from "./Status";

type TimelineItem =
  | { kind: "journal"; date: string; entry: JournalEntry }
  | { kind: "cycle"; date: string; entry: CycleEntry }
  | { kind: "treatment"; date: string; entry: TreatmentEntry };

type Filter = "all" | TimelineItem["kind"] | "milestones";

const filters: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "milestones", label: "Milestones" },
  { id: "journal", label: "Journal" },
  { id: "cycle", label: "Cycle" },
  { id: "treatment", label: "Treatment" },
];

function matchesFilter(item: TimelineItem, filter: Filter): boolean {
  if (filter === "all") return true;
  if (filter === "milestones") return item.kind === "journal" && item.entry.isMilestone;
  return item.kind === filter;
}

const kindLabels = { journal: "Journal", cycle: "Cycle", treatment: "Treatment" };
const flowLabels = ["Light", "Medium", "Heavy"];

interface TimelineProps {
  refreshKey: number;
}

export function Timeline({ refreshKey }: TimelineProps) {
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [pinError, setPinError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(false);
      try {
        const [journal, cycle, treatment] = await Promise.all([
          api.journalEntries.list(),
          api.cycleEntries.list(),
          api.treatmentEntries.list(),
        ]);

        if (cancelled) return;

        const merged: TimelineItem[] = [
          ...journal.map((entry): TimelineItem => ({ kind: "journal", date: entry.date, entry })),
          ...cycle.map((entry): TimelineItem => ({ kind: "cycle", date: entry.date, entry })),
          ...treatment.map((entry): TimelineItem => ({ kind: "treatment", date: entry.date, entry })),
        ].sort((a, b) => b.date.localeCompare(a.date));

        setItems(merged);
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
  }, [refreshKey, attempt]);

  async function togglePin(entry: JournalEntry) {
    setPinError(false);
    const updated = { ...entry, isMilestone: !entry.isMilestone };
    try {
      await api.journalEntries.update(updated);
      setItems((list) =>
        list.map((item) => (item.kind === "journal" && item.entry.id === entry.id ? { ...item, entry: updated } : item)),
      );
    } catch {
      setPinError(true);
    }
  }

  const visible = items.filter((item) => matchesFilter(item, filter));
  const groups = groupItems(visible);

  return (
    <div className="screen">
      <header className="screen-header">
        <h1>Timeline</h1>
      </header>

      <div className="chip-row" role="group" aria-label="Show entries">
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            className="choice choice--filter"
            aria-pressed={filter === f.id}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {pinError && <Status kind="error">{messages.saveError}</Status>}
      {loading && <Status kind="loading">Loading your story…</Status>}
      {error && (
        <Status kind="error" onRetry={() => setAttempt((a) => a + 1)}>
          {messages.loadError}
        </Status>
      )}
      {!loading && !error && items.length === 0 && <Status kind="empty">Nothing loaded yet. Your first entry starts the story.</Status>}
      {!loading && !error && items.length > 0 && visible.length === 0 && (
        <Status kind="empty">
          {filter === "milestones"
            ? "No milestones yet. Tap the ☆ on a journal entry to pin a moment you want to remember."
            : "No entries of this kind yet."}
        </Status>
      )}

      {!loading &&
        !error &&
        groups.map((group, i) => (
          // The same month can appear twice if pregnancy weeks sit between, so the index keeps keys unique.
          <section key={`${group.key}-${i}`} className="timeline-group" aria-label={group.title}>
            <h2 className="group-title">{group.title}</h2>
            {group.items.map((item) => (
              <article key={`${item.kind}-${item.entry.id}`} className="card entry">
                <div className="entry-head">
                  <span className={`entry-kind entry-kind--${item.kind}`}>
                    <span className="entry-dot" aria-hidden="true" />
                    {kindLabels[item.kind]}
                  </span>
                  <span className="muted">{formatShort(item.date)}</span>
                </div>
                <EntryBody item={item} onTogglePin={togglePin} />
              </article>
            ))}
          </section>
        ))}
    </div>
  );
}

function EntryBody({ item, onTogglePin }: { item: TimelineItem; onTogglePin: (entry: JournalEntry) => void }) {
  if (item.kind === "journal") {
    const e = item.entry;
    return (
      <>
        <div className="entry-title-row">
          <p className="entry-title">Mood · {moodLabels[e.mood - 1] ?? e.mood}</p>
          <button
            type="button"
            className="pin"
            aria-pressed={e.isMilestone}
            aria-label={e.isMilestone ? "Unpin milestone" : "Pin as milestone"}
            onClick={() => onTogglePin(e)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill={e.isMilestone ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9Z" />
            </svg>
          </button>
        </div>
        {e.text && <p className="entry-text">{e.text}</p>}
        {e.symptoms.length > 0 && (
          <div className="chip-row">
            {e.symptoms.map((s) => (
              <span key={s.name} className="tag">
                {capitalize(s.name)} · {s.severity}/5
              </span>
            ))}
          </div>
        )}
      </>
    );
  }

  if (item.kind === "cycle") {
    return <p className="entry-title">{describeCycle(item.entry)}</p>;
  }

  const t = item.entry;
  const details = [
    t.medication && [t.medication, t.dose].filter(Boolean).join(" "),
    t.clinicVisit && "Clinic visit",
    t.scanResults?.follicleCount != null && `${t.scanResults.follicleCount} follicles`,
    t.scanResults?.liningMm != null && `lining ${t.scanResults.liningMm.toFixed(1)} mm`,
    t.betaHcgResult != null && `Beta hCG ${t.betaHcgResult}`,
  ].filter(Boolean);

  return (
    <>
      <p className="entry-title">{t.step ? treatmentStepLabels[t.step] : t.medication ?? "Treatment"}</p>
      {details.length > 0 && <p className="entry-text">{details.join(" · ")}</p>}
    </>
  );
}

function describeCycle(entry: CycleEntry): string {
  switch (entry.entryType) {
    case "Period":
      return `Period · ${flowLabels[Math.round(entry.value) - 1] ?? "Medium"} flow`;
    case "LhTest":
      return entry.value >= 1 ? "Positive LH test" : "Negative LH test";
    case "Temperature":
      return `Temperature · ${entry.value.toFixed(2)} °C`;
  }
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

interface Group {
  key: string;
  title: string;
  items: TimelineItem[];
}

/** Pregnancy entries group by week; everything else by month. Items arrive newest first. */
function groupItems(items: TimelineItem[]): Group[] {
  const groups: Group[] = [];
  for (const item of items) {
    const week = item.kind === "journal" ? item.entry.pregnancyWeek : null;
    const key = week ? `week-${week}` : `month-${item.date.slice(0, 7)}`;
    const last = groups[groups.length - 1];
    if (last?.key === key) {
      last.items.push(item);
    } else {
      groups.push({ key, title: week ? `Week ${week}` : formatMonthYear(item.date), items: [item] });
    }
  }
  return groups;
}
