const config = require("../config");

// Rolling log of mirrored requests, newest first
const logs = [];

const stats = {
  totalRequests: 0,
  shadowedRequests: 0,
  skippedByPolicy: 0, // not sent to shadow due to sample rate
  primaryErrors: 0,
  shadowErrors: 0,
  mismatches: 0,
  matches: 0,
  primaryLatencySum: 0,
  shadowLatencySum: 0,
  shadowLatencySamples: 0,
  startedAt: new Date().toISOString()
};

function addLogEntry(entry) {
  logs.unshift(entry);
  if (logs.length > config.MAX_LOG_ENTRIES) {
    logs.length = config.MAX_LOG_ENTRIES;
  }
}

function getLogs(limit = config.MAX_LOG_ENTRIES) {
  return logs.slice(0, limit);
}

function clearLogs() {
  logs.length = 0;
  stats.totalRequests = 0;
  stats.shadowedRequests = 0;
  stats.skippedByPolicy = 0;
  stats.primaryErrors = 0;
  stats.shadowErrors = 0;
  stats.mismatches = 0;
  stats.matches = 0;
  stats.primaryLatencySum = 0;
  stats.shadowLatencySum = 0;
  stats.shadowLatencySamples = 0;
  stats.startedAt = new Date().toISOString();
}

function getStats() {
  const avgPrimaryLatency =
    stats.totalRequests > 0 ? stats.primaryLatencySum / stats.totalRequests : 0;
  const avgShadowLatency =
    stats.shadowLatencySamples > 0 ? stats.shadowLatencySum / stats.shadowLatencySamples : 0;
  const parityRate =
    stats.matches + stats.mismatches > 0
      ? (stats.matches / (stats.matches + stats.mismatches)) * 100
      : 100;

  return {
    ...stats,
    avgPrimaryLatencyMs: Number(avgPrimaryLatency.toFixed(1)),
    avgShadowLatencyMs: Number(avgShadowLatency.toFixed(1)),
    parityRatePercent: Number(parityRate.toFixed(1))
  };
}

module.exports = { addLogEntry, getLogs, clearLogs, getStats, stats };
