export type Tab = "today" | "timeline" | "log" | "cycle";

interface BottomNavProps {
  tabs: Tab[];
  active: Tab;
  calm: boolean;
  onSelect: (tab: Tab) => void;
}

const icons: Record<Tab, React.ReactNode> = {
  today: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  timeline: <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />,
  log: (
    <>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </>
  ),
  cycle: (
    <>
      <path d="M21 12a9 9 0 1 1-3-6.7" />
      <path d="M21 3v6h-6" />
    </>
  ),
};

export function BottomNav({ tabs, active, calm, onSelect }: BottomNavProps) {
  const labels: Record<Tab, string> = { today: "Today", timeline: "Timeline", log: calm ? "Write" : "Log", cycle: "Cycle" };

  return (
    <nav className="bottom-nav" aria-label="Main">
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          className={tab === active ? "nav-item nav-item--active" : "nav-item"}
          aria-current={tab === active ? "page" : undefined}
          onClick={() => onSelect(tab)}
        >
          <span className="nav-icon">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              {icons[tab]}
            </svg>
          </span>
          {labels[tab]}
        </button>
      ))}
    </nav>
  );
}
