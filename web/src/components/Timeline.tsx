import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { CycleEntry, JournalEntry, TreatmentEntry } from "../types";

type TimelineItem =
  | { kind: "journal"; date: string; entry: JournalEntry }
  | { kind: "cycle"; date: string; entry: CycleEntry }
  | { kind: "treatment"; date: string; entry: TreatmentEntry };

interface TimelineProps {
  refreshKey: number;
}

export function Timeline({ refreshKey }: TimelineProps) {
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
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
        if (!cancelled) setError("Couldn't load the timeline. Is the API running?");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  if (loading) return <p>Loading timeline...</p>;
  if (error) return <p role="alert">{error}</p>;
  if (items.length === 0) return <p>No entries yet — add your first journal entry.</p>;

  return (
    <ul className="timeline">
      {items.map((item) => (
        <li key={`${item.kind}-${item.entry.id}`} className={`timeline-item timeline-item--${item.kind}`}>
          <span className="timeline-date">{item.date}</span>
          {item.kind === "journal" && (
            <div>
              <strong>Journal</strong> · mood {item.entry.mood}/5
              <p>{item.entry.text}</p>
              {item.entry.symptoms.length > 0 && (
                <p className="symptoms">
                  {item.entry.symptoms.map((s) => `${s.name} (${s.severity}/5)`).join(", ")}
                </p>
              )}
            </div>
          )}
          {item.kind === "cycle" && (
            <div>
              <strong>Cycle</strong> · {item.entry.entryType} = {item.entry.value}
            </div>
          )}
          {item.kind === "treatment" && (
            <div>
              <strong>Treatment</strong>
              {item.entry.medication && ` · ${item.entry.medication} ${item.entry.dose ?? ""}`}
              {item.entry.clinicVisit && " · clinic visit"}
              {item.entry.betaHcgResult != null && ` · beta hCG ${item.entry.betaHcgResult}`}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
