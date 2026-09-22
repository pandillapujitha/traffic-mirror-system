export default function ServiceStatus({ health }) {
  if (!health) return null;
  const { primary, shadow } = health;

  const row = (label, svc) => (
    <div className="service-row" key={label}>
      <span className={`dot ${svc?.up ? "up" : "down"}`} />
      <div>
        <strong>{label}</strong>{" "}
        <span style={{ color: "var(--muted)" }}>
          {svc?.up ? `up · ${svc.latencyMs}ms` : "unreachable"}
        </span>
      </div>
    </div>
  );

  return (
    <div className="panel">
      <h2>Service Health</h2>
      {row("Primary (live traffic)", primary)}
      {row("Shadow (candidate under test)", shadow)}
    </div>
  );
}
