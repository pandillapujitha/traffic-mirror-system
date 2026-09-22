// Central configuration for the traffic shadowing/mirroring system
module.exports = {
  GATEWAY_PORT: process.env.GATEWAY_PORT || 4000,
  PRIMARY_PORT: process.env.PRIMARY_PORT || 4001,
  SHADOW_PORT: process.env.SHADOW_PORT || 4002,

  PRIMARY_URL: process.env.PRIMARY_URL || "http://localhost:4001",
  SHADOW_URL: process.env.SHADOW_URL || "http://localhost:4002",

  // Percentage (0-100) of live traffic that also gets mirrored to the shadow service
  SHADOW_SAMPLE_RATE: process.env.SHADOW_SAMPLE_RATE
    ? Number(process.env.SHADOW_SAMPLE_RATE)
    : 100,

  // Max number of requests kept in the in-memory rolling log
  MAX_LOG_ENTRIES: 200,

  // Timeout (ms) for the shadow call so a slow/broken shadow never affects real users
  SHADOW_TIMEOUT_MS: 3000
};
