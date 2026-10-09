interface StatusProps {
  kind: "loading" | "empty" | "error";
  children: React.ReactNode;
  onRetry?: () => void;
}

/** The one place loading, empty and error messages are drawn, so every screen says them the same way. */
export function Status({ kind, children, onRetry }: StatusProps) {
  return (
    <div className={`status status--${kind}`} role={kind === "error" ? "alert" : "status"}>
      {kind === "loading" && <span className="status-bar" aria-hidden="true" />}
      <p>{children}</p>
      {onRetry && (
        <button type="button" className="button button--secondary" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
