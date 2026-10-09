import { useState } from "react";
import { api } from "../api/client";
import type { Symptom } from "../types";

interface EntryFormProps {
  onCreated: () => void;
}

export function EntryForm({ onCreated }: EntryFormProps) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [text, setText] = useState("");
  const [mood, setMood] = useState(3);
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [symptomName, setSymptomName] = useState("");
  const [symptomSeverity, setSymptomSeverity] = useState(3);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addSymptom() {
    if (!symptomName.trim()) return;
    setSymptoms([...symptoms, { name: symptomName.trim(), severity: symptomSeverity }]);
    setSymptomName("");
    setSymptomSeverity(3);
  }

  function removeSymptom(index: number) {
    setSymptoms(symptoms.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.journalEntries.create({
        date,
        text,
        mood,
        symptoms,
        phase: "Trying",
        pregnancyWeek: null,
      });
      setText("");
      setMood(3);
      setSymptoms([]);
      onCreated();
    } catch {
      setError("Couldn't save that entry. Is the API running?");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="entry-form">
      <h2>New journal entry</h2>

      <label>
        Date
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
      </label>

      <label>
        How are you feeling?
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} />
      </label>

      <label>
        Mood: {mood}/5
        <input type="range" min={1} max={5} value={mood} onChange={(e) => setMood(Number(e.target.value))} />
      </label>

      <fieldset>
        <legend>Symptoms</legend>
        <ul className="symptom-list">
          {symptoms.map((s, i) => (
            <li key={`${s.name}-${i}`}>
              {s.name} (severity {s.severity}/5)
              <button type="button" onClick={() => removeSymptom(i)} aria-label={`Remove ${s.name}`}>
                ×
              </button>
            </li>
          ))}
        </ul>
        <div className="symptom-add">
          <input
            placeholder="e.g. nausea"
            value={symptomName}
            onChange={(e) => setSymptomName(e.target.value)}
          />
          <select value={symptomSeverity} onChange={(e) => setSymptomSeverity(Number(e.target.value))}>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                severity {n}
              </option>
            ))}
          </select>
          <button type="button" onClick={addSymptom}>
            Add
          </button>
        </div>
      </fieldset>

      {error && <p role="alert">{error}</p>}

      <button type="submit" disabled={submitting}>
        {submitting ? "Saving..." : "Save entry"}
      </button>
    </form>
  );
}
