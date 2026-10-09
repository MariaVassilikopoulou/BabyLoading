import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { CycleEntry, CycleEntryType, FertileWindowEstimate } from "../types";

interface CycleCalendarProps {
  refreshKey: number;
  onChanged: () => void;
}

export function CycleCalendar({ refreshKey, onChanged }: CycleCalendarProps) {
  const [entries, setEntries] = useState<CycleEntry[]>([]);
  const [fertileWindow, setFertileWindow] = useState<FertileWindowEstimate | null>(null);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [entryType, setEntryType] = useState<CycleEntryType>("Period");
  const [value, setValue] = useState(1);

  async function load() {
    const list = await api.cycleEntries.list();
    setEntries([...list].sort((a, b) => b.date.localeCompare(a.date)));

    try {
      setFertileWindow(await api.cycleEntries.fertileWindow());
    } catch {
      setFertileWindow(null); // not enough data yet — not an error state
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    await api.cycleEntries.create({ date, entryType, value });
    onChanged();
  }

  return (
    <div className="cycle-calendar">
      <h2>Cycle tracking</h2>

      {fertileWindow && (
        <div className="fertile-window-banner">
          <strong>Estimated fertile window:</strong> {fertileWindow.windowStart} to {fertileWindow.windowEnd}
          <p className="disclaimer">This is an estimate from your cycle history — never use it as contraception.</p>
        </div>
      )}

      <form onSubmit={handleAdd} className="cycle-form">
        <label>
          Date
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </label>
        <label>
          Type
          <select value={entryType} onChange={(e) => setEntryType(e.target.value as CycleEntryType)}>
            <option value="Period">Period</option>
            <option value="LhTest">LH test</option>
            <option value="Temperature">Temperature</option>
          </select>
        </label>
        <label>
          Value
          <input
            type="number"
            step="0.1"
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
            title={
              entryType === "LhTest"
                ? "1 = positive, 0 = negative"
                : entryType === "Temperature"
                  ? "basal body temperature, °C"
                  : "flow intensity, 1-3"
            }
          />
        </label>
        <button type="submit">Add</button>
      </form>

      <ul className="cycle-list">
        {entries.map((entry) => (
          <li key={entry.id}>
            {entry.date} — {entry.entryType}: {entry.value}
          </li>
        ))}
      </ul>
    </div>
  );
}
