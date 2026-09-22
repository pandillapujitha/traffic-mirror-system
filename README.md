# Microservices Traffic Shadowing and Mirroring System
## 🚀 Live Demo

**Live Portal:** https://traffic-mirror-frontend.onrender.com

**Backend API:** https://traffic-mirror-system.onrender.com

A cloud-computing style demo project that shows how to safely validate a new
("shadow") microservice version by mirroring real production traffic to it,
without ever letting the shadow's response, latency, or errors affect real
users.

## How it works

```
            ┌─────────────┐        ┌───────────────────┐
  Client ──▶│   Gateway    │──────▶ │  Primary Service   │  (port 4001)
            │ (port 4000)  │        │  serves real users │
            │  mirroring   │        └───────────────────┘
            │  middleware  │
            │              │──────▶ ┌───────────────────┐
            └──────┬───────┘        │  Shadow Service     │  (port 4002)
                   │                │  candidate v2 build │
                   │  diff + log    └───────────────────┘
                   ▼
          In-memory stats/log store ──▶ React dashboard (Vite, port 5173)
```

1. The **Gateway** (`backend/server.js` + `backend/mirror/trafficMirror.js`)
   receives every request at `/api/gateway/*`.
2. It forwards the request to the **Primary Service** and returns that
   response to the caller immediately — the shadow path never blocks or
   affects the real response.
3. Asynchronously, the same request is **mirrored** to the **Shadow
   Service** (a stand-in for a new/candidate deployment). The shadow call
   has its own timeout so a slow or broken candidate can never impact
   production traffic.
4. The two responses are **diffed** (`backend/mirror/diff.js`) and the
   result — status codes, latency, and any field-level differences — is
   stored in a rolling in-memory log (`backend/mirror/store.js`).
5. The **React dashboard** polls `/api/stats` and `/api/logs` every couple
   of seconds and renders live stat cards, a latency comparison chart, a
   service health panel, and a request-by-request diff log.

The bundled shadow service intentionally contains a bug (bulk order
discounts aren't applied) so you can see the mismatch detection working
end to end.

## Project structure

```
traffic-mirror-system/
├── backend/
│   ├── server.js              # boots primary, shadow, and gateway servers
│   ├── config.js              # ports, sample rate, timeouts
│   ├── services/
│   │   ├── primaryService.js  # mock "production" microservice
│   │   └── shadowService.js   # mock "candidate" microservice
│   ├── mirror/
│   │   ├── trafficMirror.js   # core shadow/mirror gateway logic
│   │   ├── diff.js            # structural response diffing
│   │   └── store.js           # in-memory logs + aggregate stats
│   ├── routes/
│   │   └── api.js             # dashboard API: /stats /logs /services /simulate
│   ├── utils/logger.js
│   └── package.json
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── src/
    │   ├── main.jsx
    │   ├── App.jsx
    │   ├── api.js
    │   ├── index.css
    │   └── components/
    │       ├── Dashboard.jsx
    │       ├── ServiceStatus.jsx
    │       ├── TrafficChart.jsx
    │       └── RequestLog.jsx
    └── package.json
```

## Running it

### 1. Backend (gateway + primary + shadow services, all in one process)

```bash
cd backend
npm install
npm start
```

This starts three servers:
- Gateway: `http://localhost:4000`
- Primary service: `http://localhost:4001`
- Shadow service: `http://localhost:4002`

### 2. Frontend (React dashboard)

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The Vite dev server proxies `/api/*` calls to
the gateway on port 4000 (see `vite.config.js`).

### 3. Generate traffic

Click **Simulate Traffic** in the dashboard to fire a batch of sample
requests through the gateway, or send your own requests directly:

```bash
curl http://localhost:4000/api/gateway/products
curl -X POST http://localhost:4000/api/gateway/orders \
  -H "Content-Type: application/json" \
  -d '{"productId": 2, "quantity": 6}'
```

Orders with `quantity >= 5` are a good way to trigger a visible mismatch,
since the shadow candidate forgets to apply the bulk discount.

## Configuration

All tunables live in `backend/config.js` and can be overridden with
environment variables:

| Variable              | Default | Description                                   |
|------------------------|---------|------------------------------------------------|
| `GATEWAY_PORT`         | 4000    | Gateway/API port                                |
| `PRIMARY_PORT`         | 4001    | Mock primary service port                       |
| `SHADOW_PORT`          | 4002    | Mock shadow service port                         |
| `SHADOW_SAMPLE_RATE`   | 100     | % of traffic mirrored to shadow (0-100)          |
| `SHADOW_TIMEOUT_MS`    | 3000    | Max time to wait on the shadow call              |

## Extending this into a real system

- Swap the mock primary/shadow services for calls to your real
  microservices (or an API gateway like Kong/Envoy) behind the same
  `PRIMARY_URL` / `SHADOW_URL` config.
- Replace the in-memory store with Redis or a time-series DB for
  persistence across restarts and multi-instance gateways.
- Add authentication/allow-listing so mirrored traffic can't be abused as
  an amplification vector against the shadow service.
- Mask or strip PII from mirrored payloads before they reach a
  non-production shadow environment.
