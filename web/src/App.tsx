import { useEffect, useState } from "react";
import "./App.css";
import { api } from "./api/client";
import { BottomNav, type Tab } from "./components/BottomNav";
import { CycleCalendar } from "./components/CycleCalendar";
import { EntryForm } from "./components/EntryForm";
import { Status } from "./components/Status";
import { Timeline } from "./components/Timeline";
import { Today } from "./components/Today";
import { todayIso } from "./lib/dates";
import { calmByDefault, pickCurrentJourney } from "./lib/journey";
import { messages } from "./lib/labels";
import type { GestationalAge, Journey } from "./types";

const CALM_KEY = "babyloading.calm";

// Calm mode is a per-device preference for now (no real accounts until Phase 5).
// Storage can be unavailable (private windows, blocked site data), so failures fall back quietly.
function readCalmSetting(): boolean | null {
  try {
    const value = localStorage.getItem(CALM_KEY);
    return value === null ? null : value === "true";
  } catch {
    return null;
  }
}

function saveCalmSetting(calm: boolean) {
  try {
    localStorage.setItem(CALM_KEY, String(calm));
  } catch {
    // Not saved; it still applies for this visit.
  }
}

function App() {
  const [today] = useState(todayIso);
  const [journey, setJourney] = useState<Journey | null>(null);
  const [age, setAge] = useState<GestationalAge | null>(null);
  const [starting, setStarting] = useState(true);
  const [startError, setStartError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [calm, setCalm] = useState(false);
  const [tab, setTab] = useState<Tab>("today");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      setStarting(true);
      setStartError(false);
      try {
        const current = pickCurrentJourney(await api.journeys.list());
        const gestationalAge =
          current?.phase === "Pregnant" ? await api.journeys.gestationalAge(current.id).catch(() => null) : null;
        if (cancelled) return;
        setJourney(current);
        setAge(gestationalAge);
        setCalm(readCalmSetting() ?? calmByDefault(current));
      } catch {
        if (!cancelled) setStartError(true);
      } finally {
        if (!cancelled) setStarting(false);
      }
    }

    start();
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  function changeCalm(next: boolean) {
    setCalm(next);
    saveCalmSetting(next);
  }

  if (starting) {
    return (
      <div className="splash" role="status">
        <span className="splash-wordmark">
          baby<i>loading</i>
        </span>
        <span className="splash-bar" aria-hidden="true" />
        <span className="splash-text">loading your journey…</span>
      </div>
    );
  }

  if (startError) {
    return (
      <div className="app">
        <div className="screen">
          <Status kind="error" onRetry={() => setAttempt((a) => a + 1)}>
            {messages.loadError}
          </Status>
        </div>
      </div>
    );
  }

  // Cycle tracking only matters before pregnancy; it leaves the menu once she's pregnant.
  const phase = journey?.phase;
  const showCycle = !journey || phase === "Trying" || phase === "Treatment";
  const tabs: Tab[] = showCycle ? ["today", "timeline", "log", "cycle"] : ["today", "timeline", "log"];

  return (
    <div className={calm ? "app app--calm" : "app"}>
      <main className="app-main">
        {tab === "today" && (
          <Today
            journey={journey}
            age={age}
            today={today}
            calm={calm}
            onCalmChange={changeCalm}
            onWrite={() => setTab("log")}
            onTimeline={() => setTab("timeline")}
          />
        )}
        {tab === "timeline" && <Timeline refreshKey={refreshKey} />}
        {tab === "log" && (
          <EntryForm
            journey={journey}
            age={age}
            today={today}
            calm={calm}
            onSaved={() => setRefreshKey((k) => k + 1)}
          />
        )}
        {tab === "cycle" && showCycle && <CycleCalendar today={today} />}
      </main>
      <BottomNav tabs={tabs} active={tab} calm={calm} onSelect={setTab} />
    </div>
  );
}

export default App;
