const express = require("express");
const axios = require("axios");
const store = require("../mirror/store");
const config = require("../config");

function createApiRouter() {
  const router = express.Router();

  router.get("/stats", (req, res) => {
    res.json({ stats: store.getStats(), sampleRate: config.SHADOW_SAMPLE_RATE });
  });

  router.get("/logs", (req, res) => {
    const limit = Number(req.query.limit) || 50;
    res.json({ logs: store.getLogs(limit) });
  });

  router.post("/logs/clear", (req, res) => {
    store.clearLogs();
    res.json({ ok: true });
  });

  router.get("/services", async (req, res) => {
    const check = async (url) => {
      const startedAt = Date.now();
      try {
        const r = await axios.get(`${url}/health`, { timeout: 1500 });
        return { url, up: true, latencyMs: Date.now() - startedAt, data: r.data };
      } catch (e) {
        return { url, up: false, latencyMs: Date.now() - startedAt, error: e.message };
      }
    };
    const [primary, shadow] = await Promise.all([
      check(config.PRIMARY_URL),
      check(config.SHADOW_URL)
    ]);
    res.json({ primary, shadow });
  });

  // Simulates real user traffic hitting the gateway so the dashboard has
  // something to show without needing an external load generator.
  router.post("/simulate", async (req, res) => {
    const count = Math.min(Number(req.body?.count) || 10, 100);
    const sampleRequests = [
      () => ({ method: "get", path: "/products" }),
      () => ({ method: "get", path: `/products/${1 + Math.floor(Math.random() * 4)}` }),
      () => ({ method: "get", path: `/users/${100 + Math.floor(Math.random() * 20)}` }),
      () => ({
        method: "post",
        path: "/orders",
        data: {
          productId: 1 + Math.floor(Math.random() * 4),
          quantity: 1 + Math.floor(Math.random() * 8)
        }
      })
    ];

    const gatewayBase = `http://localhost:${config.GATEWAY_PORT}/api/gateway`;
    const calls = Array.from({ length: count }).map(() => {
      const req = sampleRequests[Math.floor(Math.random() * sampleRequests.length)]();
      return axios({
        method: req.method,
        url: `${gatewayBase}${req.path}`,
        data: req.data,
        validateStatus: () => true
      }).catch(() => null);
    });

    await Promise.all(calls);
    res.json({ ok: true, dispatched: count });
  });

  return router;
}

module.exports = { createApiRouter };
