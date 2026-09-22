const express = require("express");
const cors = require("cors");
const config = require("../config");
const logger = require("../utils/logger");

// Same catalog as primary, but this represents a "v2" candidate deployment
// that we are validating with shadow traffic before promoting it.
const products = [
  { id: 1, name: "Wireless Mouse", price: 19.99, stock: 42 },
  { id: 2, name: "Mechanical Keyboard", price: 79.99, stock: 17 },
  { id: 3, name: "USB-C Hub", price: 34.5, stock: 63 },
  { id: 4, name: "27in Monitor", price: 249.0, stock: 8 }
];

function randomDelay(min = 20, max = 200) {
  return new Promise((resolve) =>
    setTimeout(resolve, Math.floor(Math.random() * (max - min + 1)) + min)
  );
}

function buildApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // shadow candidate is intentionally a bit slower/noisier so the dashboard
  // has something interesting to compare against the primary service
  app.use(async (req, res, next) => {
    await randomDelay(30, 180);
    next();
  });

  app.get("/health", (req, res) => {
    res.json({ service: "shadow", status: "healthy", uptime: process.uptime() });
  });

  app.get("/products", (req, res) => {
    res.json({ service: "shadow", products });
  });

  app.get("/products/:id", (req, res) => {
    const product = products.find((p) => p.id === Number(req.params.id));
    if (!product) return res.status(404).json({ service: "shadow", error: "not found" });
    res.json({ service: "shadow", product });
  });

  // Intentional bug in the v2 candidate: bulk orders (qty >= 5) are NOT
  // getting the discount that the real business rule expects. Shadow
  // mirroring exists to catch exactly this kind of regression before launch.
  app.post("/orders", (req, res) => {
    const { productId, quantity } = req.body || {};
    const product = products.find((p) => p.id === Number(productId));
    if (!product) {
      return res.status(400).json({ service: "shadow", error: "invalid productId" });
    }
    const qty = quantity || 1;
    let total = product.price * qty;
    // primary applies a 10% bulk discount at qty >= 5, this candidate forgets to
    res.status(201).json({
      service: "shadow",
      order: {
        id: `shd_${Date.now()}`,
        productId,
        quantity: qty,
        total: Number(total.toFixed(2)),
        status: "confirmed"
      }
    });
  });

  app.get("/users/:id", (req, res) => {
    res.json({
      service: "shadow",
      user: { id: req.params.id, name: `User ${req.params.id}`, tier: "gold" }
    });
  });

  // occasionally simulate an outright failure in the candidate service
  app.use((req, res) => {
    if (Math.random() < 0.03) {
      return res.status(500).json({ service: "shadow", error: "internal error" });
    }
    res.status(404).json({ service: "shadow", error: "unhandled route" });
  });

  return app;
}

function start() {
  const app = buildApp();
  app.listen(config.SHADOW_PORT, () => {
    logger.info("ShadowService", `listening on port ${config.SHADOW_PORT}`);
  });
}

module.exports = { start, buildApp };
