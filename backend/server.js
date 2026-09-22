const express = require("express");
const cors = require("cors");
const config = require("./config");
const logger = require("./utils/logger");
const primaryService = require("./services/primaryService");
const shadowService = require("./services/shadowService");
const { createMirrorRouter } = require("./mirror/trafficMirror");
const { createApiRouter } = require("./routes/api");

function startGateway() {
  const app = express();
  app.use(cors());

  // /api/gateway/*  -> mirrored traffic entry point (this is what a real
  //                    client / API consumer would call)
  app.use("/api/gateway", createMirrorRouter());

  // /api/*          -> dashboard/control API consumed by the React frontend
  app.use("/api", createApiRouter());

  app.get("/", (req, res) => {
    res.json({
      service: "traffic-mirror-gateway",
      endpoints: ["/api/gateway/*", "/api/stats", "/api/logs", "/api/services", "/api/simulate"]
    });
  });

  app.listen(config.GATEWAY_PORT, () => {
    logger.info("Gateway", `listening on port ${config.GATEWAY_PORT}`);
    logger.info(
      "Gateway",
      `mirroring ${config.SHADOW_SAMPLE_RATE}% of traffic from ${config.PRIMARY_URL} to ${config.SHADOW_URL}`
    );
  });
}

primaryService.start();
shadowService.start();
startGateway();
