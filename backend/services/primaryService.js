const express = require("express");
const cors = require("cors");
const config = require("../config");
const logger = require("../utils/logger");

// A tiny in-memory "database" so the demo endpoints have something to return
const products = [
  { id: 1, name: "Wireless Mouse", price: 19.99, stock: 42 },
  { id: 2, name: "Mechanical Keyboard", price: 79.99, stock: 17 },
  { id: 3, name: "USB-C Hub", price: 34.5, stock: 63 },
  { id: 4, name: "27in Monitor", price: 249.0, stock: 8 }
];

function randomDelay(min = 20, max = 120) {
  return new Promise((resolve) =>
    setTimeout(resolve, Math.floor(Math.random() * (max - min + 1)) + min)
  );
}

function buildApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // simulate realistic, slightly variable latency for every call
  app.use(async (req, res, next) => {
    await randomDelay(20, 110);
    next();
  });

  app.get("/health", (req, res) => {
    res.json({ service: "primary", status: "healthy", uptime: process.uptime() });
  });

  app.get("/products", (req, res) => {
    res.json({ service: "primary", products });
  });

  app.get("/products/:id", (req, res) => {
    const product = products.find((p) => p.id === Number(req.params.id));
    if (!product) return res.status(404).json({ service: "primary", error: "not found" });
    res.json({ service: "primary", product });
  });

  // Business rule: orders of 5 or more units get a 10% bulk discount.
  app.post("/orders", (req, res) => {
    const { productId, quantity } = req.body || {};
    const product = products.find((p) => p.id === Number(productId));
    if (!product) {
      return res.status(400).json({ service: "primary", error: "invalid productId" });
    }
    const qty = quantity || 1;
    let total = product.price * qty;
    if (qty >= 5) total *= 0.9;
    res.status(201).json({
      service: "primary",
      order: {
        id: `ord_${Date.now()}`,
        productId,
        quantity: qty,
        total: Number(total.toFixed(2)),
        status: "confirmed"
      }
    });
  });

  app.get("/users/:id", (req, res) => {
    res.json({
      service: "primary",
      user: { id: req.params.id, name: `User ${req.params.id}`, tier: "gold" }
    });
  });

  return app;
}

function start() {
  const app = buildApp();
  app.listen(config.PRIMARY_PORT, () => {
    logger.info("PrimaryService", `listening on port ${config.PRIMARY_PORT}`);
  });
}

module.exports = { start, buildApp };
