export default function Dashboard({ stats, sampleRate }) {
  if (!stats) return null;

  const parityClass =
    stats.parityRatePercent >= 98 ? "green" : stats.parityRatePercent >= 90 ? "yellow" : "red";

  return (
    <div className="grid">
      <div className="card">
        <div className="label">Total Requests</div>
        <div className="value">{stats.totalRequests}</div>
      </div>
      <div className="card">
        <div className="label">Shadowed ({sampleRate}% sample)</div>
        <div className="value">{stats.shadowedRequests}</div>
      </div>
      <div className="card">
        <div className="label">Avg Primary Latency</div>
        <div className="value">{stats.avgPrimaryLatencyMs}ms</div>
      </div>
      <div className="card">
        <div className="label">Avg Shadow Latency</div>
        <div className="value">{stats.avgShadowLatencyMs}ms</div>
      </div>
      <div className="card">
        <div className="label">Response Parity</div>
        <div className={`value ${parityClass}`}>{stats.parityRatePercent}%</div>
      </div>
      <div className="card">
        <div className="label">Mismatches Found</div>
        <div className={`value ${stats.mismatches > 0 ? "red" : "green"}`}>{stats.mismatches}</div>
      </div>
    </div>
  );
}
