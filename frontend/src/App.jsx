import { useEffect, useState, useCallback } from "react";
import Dashboard from "./components/Dashboard.jsx";
import ServiceStatus from "./components/ServiceStatus.jsx";
import TrafficChart from "./components/TrafficChart.jsx";
import RequestLog from "./components/RequestLog.jsx";
import { fetchStats, fetchLogs, fetchServiceHealth, clearLogs, simulateTraffic } from "./api.js";

const POLL_MS = 2000;

export default function App() {
  const [stats, setStats] = useState(null);
  const [sampleRate, setSampleRate] = useState(100);
  const [logs, setLogs] = useState([]);
  const [health, setHealth] = useState(null);
  const [simulating, setSimulating] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const [statsRes, logsRes, healthRes] = await Promise.all([
        fetchStats(),
        fetchLogs(60),
        fetchServiceHealth()
      ]);
      setStats(statsRes.stats);
      setSampleRate(statsRes.sampleRate);
      setLogs(logsRes.logs);
      setHealth(healthRes);
      setError(null);
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, POLL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  const handleSimulate = async () => {
    setSimulating(true);
    try {
      await simulateTraffic(15);
      await refresh();
    } finally {
      setSimulating(false);
    }
  };

  const handleClear = async () => {
    await clearLogs();
    await refresh();
  };

  return (
    <div className="app">
      <div className="app-header">
        <div>
          <h1>Microservices Traffic Shadowing &amp; Mirroring System</h1>
          <p>
            Live requests are served by the primary service; a copy is mirrored to the shadow
            candidate and diffed automatically.
          </p>
        </div>
        <div className="controls">
          <button onClick={handleSimulate} disabled={simulating}>
            {simulating ? "Sending…" : "Simulate Traffic"}
          </button>
          <button className="secondary" onClick={handleClear}>
            Clear Log
          </button>
        </div>
      </div>

      {error && (
        <div className="panel" style={{ borderColor: "var(--red)", color: "var(--red)" }}>
          Could not reach the gateway API ({error}). Make sure the backend server is running on
          port 4000.
        </div>
      )}

      <Dashboard stats={stats} sampleRate={sampleRate} />
      <ServiceStatus health={health} />
      <TrafficChart logs={logs} />
      <RequestLog logs={logs} />

      <footer>Gateway: http://localhost:4000 · Primary: :4001 · Shadow: :4002</footer>
    </div>
  );
}
