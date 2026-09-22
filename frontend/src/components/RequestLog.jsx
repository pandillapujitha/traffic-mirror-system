function StatusBadge({ entry }) {
  if (!entry.shadowed) return <span className="badge skipped">not mirrored</span>;
  if (!entry.diff) return <span className="badge skipped">pending</span>;
  return entry.diff.equal ? (
    <span className="badge match">match</span>
  ) : (
    <span className="badge mismatch">mismatch</span>
  );
}

export default function RequestLog({ logs }) {
  return (
    <div className="panel">
      <h2>Mirrored Request Log</h2>
      <div className="log-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Method</th>
              <th>Path</th>
              <th>Primary</th>
              <th>Shadow</th>
              <th>Result</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 && (
              <tr>
                <td colSpan={6} style={{ color: "var(--muted)", padding: "16px 10px" }}>
                  No traffic yet — click "Simulate Traffic" to generate requests.
                </td>
              </tr>
            )}
            {logs.map((entry) => (
              <tr key={entry.requestId}>
                <td>{new Date(entry.timestamp).toLocaleTimeString()}</td>
                <td>{entry.method?.toUpperCase()}</td>
                <td>{entry.path}</td>
                <td>
                  {entry.primary?.status} · {entry.primary?.latencyMs}ms
                </td>
                <td>
                  {entry.shadow ? `${entry.shadow.status} · ${entry.shadow.latencyMs}ms` : "—"}
                </td>
                <td>
                  <StatusBadge entry={entry} />
                  {entry.diff && !entry.diff.equal && entry.diff.differences?.length > 0 && (
                    <ul className="diff-list">
                      {entry.diff.differences.slice(0, 3).map((d, i) => (
                        <li key={i}>
                          {d.path}: {JSON.stringify(d.primaryValue)} → {JSON.stringify(d.shadowValue)}
                        </li>
                      ))}
                    </ul>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
