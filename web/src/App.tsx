import { useState } from "react";
import "./App.css";
import { CycleCalendar } from "./components/CycleCalendar";
import { EntryForm } from "./components/EntryForm";
import { Timeline } from "./components/Timeline";

type Tab = "timeline" | "new-entry" | "cycle";

function App() {
  const [tab, setTab] = useState<Tab>("timeline");
  const [refreshKey, setRefreshKey] = useState(0);

  function refresh() {
    setRefreshKey((k) => k + 1);
  }

  return (
    <div className="app">
      <header>
        <h1>BabyLoading</h1>
      </header>

      <nav className="tabs">
        <button className={tab === "timeline" ? "active" : ""} onClick={() => setTab("timeline")}>
          Timeline
        </button>
        <button className={tab === "new-entry" ? "active" : ""} onClick={() => setTab("new-entry")}>
          New entry
        </button>
        <button className={tab === "cycle" ? "active" : ""} onClick={() => setTab("cycle")}>
          Cycle
        </button>
      </nav>

      <main>
        {tab === "timeline" && <Timeline refreshKey={refreshKey} />}
        {tab === "new-entry" && (
          <EntryForm
            onCreated={() => {
              refresh();
              setTab("timeline");
            }}
          />
        )}
        {tab === "cycle" && <CycleCalendar refreshKey={refreshKey} onChanged={refresh} />}
      </main>
    </div>
  );
}

export default App;
