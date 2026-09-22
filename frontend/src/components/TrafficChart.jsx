import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

// Builds a small rolling series from the most recent log entries so the
// chart shows how primary vs shadow latency trend against each other.
function buildSeries(logs) {
  const ordered = [...logs].reverse(); // oldest -> newest
  return ordered.map((entry, idx) => ({
    idx: idx + 1,
    primary: entry.primary?.latencyMs ?? null,
    shadow: entry.shadow?.latencyMs ?? null
  }));
}

export default function TrafficChart({ logs }) {
  const data = buildSeries(logs.slice(0, 40));

  return (
    <div className="panel">
      <h2>Latency: Primary vs Shadow (most recent requests)</h2>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#223052" />
          <XAxis dataKey="idx" stroke="#8ea0c2" tick={{ fontSize: 11 }} />
          <YAxis stroke="#8ea0c2" tick={{ fontSize: 11 }} unit="ms" />
          <Tooltip
            contentStyle={{ background: "#121a2b", border: "1px solid #223052", fontSize: 12 }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line type="monotone" dataKey="primary" name="Primary" stroke="#4f8cff" dot={false} strokeWidth={2} />
          <Line type="monotone" dataKey="shadow" name="Shadow" stroke="#ffc857" dot={false} strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
