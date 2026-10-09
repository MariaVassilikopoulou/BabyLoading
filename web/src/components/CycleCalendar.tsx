import { useEffect, useState } from "react";
import { api } from "../api/client";
import { daysBetween, formatDayMonth, formatLong } from "../lib/dates";
import { messages } from "../lib/labels";
import type { CycleEntry, CycleEntryType, FertileWindowEstimate } from "../types";
import { Status } from "./Status";

interface CycleCalendarProps {
  today: string;
}

const typeOptions: { id: CycleEntryType; label: string }[] = [
  { id: "Period", label: "Period" },
  { id: "LhTest", label: "LH test" },
  { id: "Temperature", label: "Temperature" },
];

const flows = ["Light", "Medium", "Heavy"];

export function CycleCalendar({ today }: CycleCalendarProps) {
  const [entries, setEntries] = useState<CycleEntry[]>([]);
  const [fertileWindow, setFertileWindow] = useState<FertileWindowEstimate | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const [date, setDate] = useState(today);
  const [entryType, setEntryType] = useState<CycleEntryType>("Period");
  const [flow, setFlow] = useState<number | null>(null); // 1-3
  const [lhPositive, setLhPositive] = useState<boolean | null>(null);
  const [temperature, setTemperature] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadError(false);
      try {
        const list = await api.cycleEntries.list();
        const estimate = await api.cycleEntries.fertileWindow().catch(() => null); // not enough data yet — not an error
        if (cancelled) return;
        setEntries([...list].sort((a, b) => b.date.localeCompare(a.date)));
        setFertileWindow(estimate);
      } catch {
        if (!cancelled) setLoadError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const temperatureValue = Number(temperature.replace(",", "."));
  const value =
    entryType === "Period" ? flow : entryType === "LhTest" ? (lhPositive === null ? null : lhPositive ? 1 : 0) : temperature && temperatureValue > 30 && temperatureValue < 45 ? temperatureValue : null;

  function edited() {
    setSaved(false);
    setSaveError(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (value === null) return;
    setSaving(true);
    setSaveError(false);
    try {
      await api.cycleEntries.create({ date, entryType, value });
      setFlow(null);
      setLhPositive(null);
      setTemperature("");
      setSaved(true);
      setAttempt((a) => a + 1); // reload the list and the fertile-window estimate
    } catch {
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  }

  const lastPeriod = entries.find((e) => e.entryType === "Period" && e.date <= today);
  const cycleDay = lastPeriod ? daysBetween(lastPeriod.date, today) + 1 : null;

  return (
    <div className="screen">
      <header className="screen-header">
        {cycleDay && <p className="eyebrow">Cycle day {cycleDay} · started {formatDayMonth(lastPeriod!.date)}</p>}
        <h1>Cycle</h1>
      </header>

      {fertileWindow && (
        <div className="info-band">
          <strong>
            Likely fertile window: {formatDayMonth(fertileWindow.windowStart)} – {formatDayMonth(fertileWindow.windowEnd)}
          </strong>
          <span>An estimate from your cycle history. Never use it as contraception.</span>
        </div>
      )}

      <form className="card stack" onSubmit={handleSave}>
        <h2 className="card-title">Log an entry</h2>

        <div className="segmented" role="group" aria-label="What are you logging?">
          {typeOptions.map((t) => (
            <button
              key={t.id}
              type="button"
              className="segment"
              aria-pressed={entryType === t.id}
              onClick={() => { edited(); setEntryType(t.id); }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {entryType === "Period" && (
          <fieldset className="field">
            <legend className="field-label">Flow</legend>
            <div className="option-row">
              {flows.map((label, i) => (
                <button key={label} type="button" className="choice choice--option" aria-pressed={flow === i + 1} onClick={() => { edited(); setFlow(i + 1); }}>
                  {label}
                </button>
              ))}
            </div>
          </fieldset>
        )}

        {entryType === "LhTest" && (
          <fieldset className="field">
            <legend className="field-label">Test result</legend>
            <div className="option-row">
              <button type="button" className="choice choice--option" aria-pressed={lhPositive === false} onClick={() => { edited(); setLhPositive(false); }}>
                Negative
              </button>
              <button type="button" className="choice choice--option" aria-pressed={lhPositive === true} onClick={() => { edited(); setLhPositive(true); }}>
                Positive
              </button>
            </div>
          </fieldset>
        )}

        {entryType === "Temperature" && (
          <label className="field">
            <span className="field-label">Basal body temperature</span>
            <span className="temp-input">
              <input
                type="text"
                inputMode="decimal"
                placeholder="36.50"
                value={temperature}
                onChange={(e) => { edited(); setTemperature(e.target.value); }}
              />
              <span aria-hidden="true">°C</span>
            </span>
            <span className="muted">Best taken right after waking, before getting up.</span>
          </label>
        )}

        <label className="field">
          <span className="field-label">Date</span>
          <input type="date" value={date} max={today} onChange={(e) => { edited(); setDate(e.target.value); }} required />
        </label>

        {saveError && <Status kind="error">{messages.saveError}</Status>}

        <button
          type="submit"
          className={saved ? "button button--done button--block button--large" : "button button--primary button--block button--large"}
          disabled={saving || value === null}
        >
          {saving ? "Saving…" : saved ? "Saved ✓" : "Save"}
        </button>
      </form>

      <section className="stack-sm" aria-labelledby="recent-title">
        <h2 id="recent-title" className="card-title">
          Recent
        </h2>
        {loading && <Status kind="loading">Loading…</Status>}
        {loadError && (
          <Status kind="error" onRetry={() => setAttempt((a) => a + 1)}>
            {messages.loadError}
          </Status>
        )}
        {!loading && !loadError && entries.length === 0 && <Status kind="empty">Nothing logged yet. Start with your period.</Status>}
        {!loading && !loadError && entries.length > 0 && (
          <ul className="card list">
            {entries.slice(0, 8).map((entry) => (
              <li key={entry.id} className="list-row">
                <span className={`entry-dot entry-dot--${entry.entryType.toLowerCase()}`} aria-hidden="true" />
                <span className="list-main">
                  <span className="list-title">{describe(entry)}</span>
                  <span className="muted">{formatLong(entry.date)}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function describe(entry: CycleEntry): string {
  switch (entry.entryType) {
    case "Period":
      return `Period · ${flows[Math.round(entry.value) - 1] ?? "Medium"} flow`;
    case "LhTest":
      return entry.value >= 1 ? "LH test · Positive" : "LH test · Negative";
    case "Temperature":
      return `Temperature · ${entry.value.toFixed(2)} °C`;
  }
}
