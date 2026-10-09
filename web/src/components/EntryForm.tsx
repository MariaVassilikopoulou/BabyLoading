import { useState } from "react";
import { api } from "../api/client";
import { formatLong } from "../lib/dates";
import { pregnancyWeekOn } from "../lib/journey";
import { messages, moodLabels, severityLabels } from "../lib/labels";
import type { GestationalAge, Journey, Symptom } from "../types";
import { Status } from "./Status";

interface EntryFormProps {
  journey: Journey | null;
  age: GestationalAge | null;
  today: string;
  calm: boolean;
  onSaved: () => void;
}

const pregnancySymptoms = ["Nausea", "Tiredness", "Back pain", "Heartburn", "Headache", "Swelling", "Cramps", "Spotting"];
const cycleSymptoms = ["Cramps", "Bloating", "Tiredness", "Headache", "Breast tenderness", "Spotting", "Nausea", "Mood swings"];

export function EntryForm({ journey, age, today, calm, onSaved }: EntryFormProps) {
  const [date, setDate] = useState(today);
  const [text, setText] = useState("");
  const [mood, setMood] = useState<number | null>(null);
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [customSymptom, setCustomSymptom] = useState("");
  const [isMilestone, setIsMilestone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(false);

  const phase = journey?.phase ?? "Trying";
  const pregnant = phase === "Pregnant" && age !== null;
  // The phase and week are taken from her journey, so she never has to enter them.
  const pregnancyWeek = pregnant ? pregnancyWeekOn(date, age, today) : null;
  const quickPicks = phase === "Pregnant" || phase === "Postpartum" ? pregnancySymptoms : cycleSymptoms;
  const allChips = [...quickPicks, ...symptoms.map((s) => s.name).filter((n) => !quickPicks.includes(n))];

  function edited() {
    setSaved(false);
    setError(false);
  }

  function toggleSymptom(name: string) {
    edited();
    setSymptoms((list) =>
      list.some((s) => s.name === name) ? list.filter((s) => s.name !== name) : [...list, { name, severity: 3 }],
    );
  }

  function setSeverity(name: string, severity: number) {
    edited();
    setSymptoms((list) => list.map((s) => (s.name === name ? { ...s, severity } : s)));
  }

  function addCustomSymptom() {
    const name = customSymptom.trim();
    if (!name) return;
    if (!symptoms.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
      edited();
      setSymptoms((list) => [...list, { name, severity: 3 }]);
    }
    setCustomSymptom("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mood === null) return;
    setSubmitting(true);
    setError(false);
    try {
      await api.journalEntries.create({ date, text: text.trim(), mood, symptoms, phase, pregnancyWeek, isMilestone });
      setText("");
      setMood(null);
      setSymptoms([]);
      setIsMilestone(false);
      setDate(today);
      setSaved(true);
      onSaved();
    } catch {
      setError(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="screen form" onSubmit={handleSubmit}>
      <header className="screen-header">
        <h1>{calm ? "Write something" : "How are you today?"}</h1>
        <p className="eyebrow">
          {formatLong(date)}
          {!calm && pregnancyWeek !== null && ` · Week ${pregnancyWeek}`}
        </p>
      </header>

      <label className="field">
        <span className="field-label">Date</span>
        <input type="date" value={date} max={today} onChange={(e) => { edited(); setDate(e.target.value); }} required />
      </label>

      <fieldset className="field">
        <legend className="field-label">Mood</legend>
        <div className="mood-row">
          {moodLabels.map((label, i) => (
            <button
              key={label}
              type="button"
              className="choice choice--mood"
              aria-pressed={mood === i + 1}
              onClick={() => { edited(); setMood(i + 1); }}
            >
              <span className={`mood-dot mood-dot--${i + 1}`} aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="field">
        <legend className="field-label">Symptoms</legend>
        <div className="chip-row">
          {allChips.map((name) => (
            <button
              key={name}
              type="button"
              className="choice choice--chip"
              aria-pressed={symptoms.some((s) => s.name === name)}
              onClick={() => toggleSymptom(name)}
            >
              {name}
            </button>
          ))}
        </div>
        <div className="inline-add">
          <label className="visually-hidden" htmlFor="custom-symptom">
            Add your own symptom
          </label>
          <input
            id="custom-symptom"
            placeholder="Add your own"
            value={customSymptom}
            onChange={(e) => setCustomSymptom(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustomSymptom();
              }
            }}
          />
          <button type="button" className="button button--secondary" onClick={addCustomSymptom}>
            Add
          </button>
        </div>

        {symptoms.map((s) => (
          <div key={s.name} className="card severity">
            <div className="severity-head">
              <span>{s.name}: how strong?</span>
              <span className="muted">{severityLabels[s.severity - 1]}</span>
            </div>
            <div className="severity-row" role="group" aria-label={`${s.name} strength, 1 to 5`}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  className="choice choice--level"
                  aria-pressed={s.severity === n}
                  aria-label={`${n}, ${severityLabels[n - 1]}`}
                  onClick={() => setSeverity(s.name, n)}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        ))}
      </fieldset>

      <label className="field">
        <span className="field-label">Anything on your mind?</span>
        <textarea
          rows={4}
          value={text}
          placeholder="Write as much or as little as you like"
          onChange={(e) => { edited(); setText(e.target.value); }}
        />
      </label>

      <label className="checkbox">
        <input type="checkbox" checked={isMilestone} onChange={(e) => { edited(); setIsMilestone(e.target.checked); }} />
        <span>
          <strong>Pin as a milestone</strong>
          <span className="muted"> · a moment you want to remember</span>
        </span>
      </label>

      {error && <Status kind="error">{messages.saveError}</Status>}

      <div className="form-actions">
        {mood === null && !saved && <p className="muted center">Pick a mood to save.</p>}
        <button
          type="submit"
          className={saved ? "button button--done button--block button--large" : "button button--primary button--block button--large"}
          disabled={submitting || mood === null}
        >
          {submitting ? "Saving…" : saved ? "Saved to your story ✓" : "Save entry"}
        </button>
      </div>
    </form>
  );
}
