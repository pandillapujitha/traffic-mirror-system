const express = require("express");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const config = require("../config");
const logger = require("../utils/logger");
const store = require("./store");
const { diffResponses } = require("./diff");

/**
 * Builds the gateway router that:
 *  1. Forwards every request to the PRIMARY service and returns that
 *     response to the real caller (the shadow path never affects the
 *     caller's response or latency).
 *  2. Fire-and-forgets a mirrored copy of the same request to the SHADOW
 *     service, respecting SHADOW_SAMPLE_RATE.
 *  3. Diffs the two responses and records the result for the dashboard.
 */
function createMirrorRouter() {
  const router = express.Router();

  router.use(express.json());

  router.all("/*", async (req, res) => {
    const requestId = uuidv4();
    const method = req.method;
    const path = req.originalUrl.replace(/^\/api\/gateway/, "") || "/";
    const body = req.body;
    const startedAt = Date.now();

    let primaryResult;
    try {
      const primaryResponse = await axios({
        method,
        url: `${config.PRIMARY_URL}${path}`,
        data: body,
        validateStatus: () => true
      });
      primaryResult = {
        status: primaryResponse.status,
        body: primaryResponse.data,
        latencyMs: Date.now() - startedAt
      };
    } catch (err) {
      primaryResult = { status: 502, body: { error: "primary unreachable" }, latencyMs: Date.now() - startedAt };
      store.stats.primaryErrors += 1;
      logger.error("TrafficMirror", "primary call failed", err.message);
    }

    // Respond to the real client immediately using the primary result only.
    res.status(primaryResult.status).json(primaryResult.body);

    store.stats.totalRequests += 1;
    store.stats.primaryLatencySum += primaryResult.latencyMs;
    if (primaryResult.status >= 500) store.stats.primaryErrors += 1;

    const shouldShadow = Math.random() * 100 < config.SHADOW_SAMPLE_RATE;
    if (!shouldShadow) {
      store.stats.skippedByPolicy += 1;
      store.addLogEntry({
        requestId,
        method,
        path,
        timestamp: new Date().toISOString(),
        primary: primaryResult,
        shadow: null,
        diff: null,
        shadowed: false
      });
      return;
    }

    // Mirror to shadow asynchronously - this never blocks or affects the caller.
    mirrorToShadow({ requestId, method, path, body, primaryResult });
  });

  return router;
}

async function mirrorToShadow({ requestId, method, path, body, primaryResult }) {
  const startedAt = Date.now();
  store.stats.shadowedRequests += 1;

  let shadowResult;
  try {
    const shadowResponse = await axios({
      method,
      url: `${config.SHADOW_URL}${path}`,
      data: body,
      timeout: config.SHADOW_TIMEOUT_MS,
      validateStatus: () => true
    });
    shadowResult = {
      status: shadowResponse.status,
      body: shadowResponse.data,
      latencyMs: Date.now() - startedAt
    };
    store.stats.shadowLatencySum += shadowResult.latencyMs;
    store.stats.shadowLatencySamples += 1;
    if (shadowResult.status >= 500) store.stats.shadowErrors += 1;
  } catch (err) {
    shadowResult = {
      status: 0,
      body: { error: err.code === "ECONNABORTED" ? "shadow timeout" : "shadow unreachable" },
      latencyMs: Date.now() - startedAt
    };
    store.stats.shadowErrors += 1;
    logger.warn("TrafficMirror", "shadow call failed", err.message);
  }

  const diff = diffResponses(primaryResult.body, shadowResult.body);
  const statusMismatch = primaryResult.status !== shadowResult.status;
  const equal = diff.equal && !statusMismatch;

  if (equal) {
    store.stats.matches += 1;
  } else {
    store.stats.mismatches += 1;
  }

  store.addLogEntry({
    requestId,
    method,
    path,
    timestamp: new Date().toISOString(),
    primary: primaryResult,
    shadow: shadowResult,
    diff: {
      equal,
      statusMismatch,
      differences: diff.differences
    },
    shadowed: true
  });
}

module.exports = { createMirrorRouter };
