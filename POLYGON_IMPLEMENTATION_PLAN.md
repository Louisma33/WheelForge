# WheelForge — Polygon.io Integration Implementation Plan

## Codebase Analysis & Integration Strategy

**Date:** February 11, 2026  
**Status:** Ready for Development  

---

## Current Architecture Summary

WheelForge is a **Vite + React** web app (not React Native as the spec mentions — architecture adapts accordingly). It uses:
- **Simulated price data** via GBM model in `engine/priceData.js`
- **Black-Scholes pricing** in `engine/blackScholes.js`
- **Wheel simulator** in `engine/wheelSimulator.js`
- **Monte Carlo / predictions** in `engine/predictionEngine.js`
- **Greeks calculator** in `engine/greeks.js`
- **Strategy optimizer** in `engine/optimizer.js`
- **Claude AI advisor** via direct API call in `utils/index.js`
- **8-tab layout**: Dashboard, Predict, Greeks, Optimize, AI Advisor, Portfolio, Trades, History
- **No backend** — everything runs client-side currently

---

## Phase 6: Polygon.io Integration

### 6.1 — Backend Proxy Service (Priority 1)

**New directory:** `server/`

Create a lightweight Express.js backend to proxy Polygon.io API calls.

```
server/
├── index.js              ← Express entry point
├── routes/
│   ├── stocks.js         ← Stock data endpoints
│   ├── options.js        ← Options chain endpoints
│   └── search.js         ← Ticker search/lookup
├── services/
│   ├── polygonClient.js  ← Polygon.io REST client wrapper
│   └── cache.js          ← In-memory cache (node-cache)
├── middleware/
│   └── rateLimiter.js    ← Per-user rate limiting
├── package.json
├── .env.example          ← POLYGON_API_KEY template
└── render.yaml           ← Render deployment config
```

**Key endpoints:**
| Route | Polygon Endpoint | Cache TTL |
|-------|-----------------|-----------|
| `GET /api/stocks/:ticker/snapshot` | `/v2/snapshot/locale/us/markets/stocks/tickers/{ticker}` | 5 min |
| `GET /api/stocks/:ticker/history` | `/v2/aggs/ticker/{ticker}/range/1/day/{from}/{to}` | 24 hrs |
| `GET /api/stocks/:ticker/prev-close` | `/v2/aggs/ticker/{ticker}/prev` | 5 min |
| `GET /api/options/:ticker/chain` | `/v3/snapshot/options/{ticker}` | 5 min |
| `GET /api/options/contract/:id` | `/v3/snapshot/options/{ticker}/{contract}` | 5 min |
| `GET /api/search?q=` | `/v3/reference/tickers?search={q}` | 7 days |
| `GET /api/ticker/:ticker/details` | `/v3/reference/tickers/{ticker}` | 7 days |
| `GET /api/market/status` | `/v1/marketstatus/now` | 1 min |

---

### 6.2 — Frontend API Client Layer (Priority 2)

**New file:** `src/services/polygonApi.js`

```js
// Centralized API client for all backend proxy calls
// Handles: fetch, error handling, response normalization
// Base URL: configurable via env (VITE_API_BASE_URL)
```

**New file:** `src/services/marketDataHooks.js`

```js
// Custom React hooks for data fetching:
// - useStockSnapshot(ticker)     → { price, change, volume, loading }
// - useStockHistory(ticker, range) → { data, loading }
// - useOptionsChain(ticker)      → { chain, loading }
// - useTickerSearch(query)       → { results, loading }
// - useMarketStatus()            → { status, isOpen }
// - useLivePrice(ticker)         → { price, updating } (WebSocket later)
```

---

### 6.3 — Engine Modifications (Priority 3)

#### `engine/priceData.js` — Hybrid Data Source
- Keep existing GBM generator as fallback
- Add `fetchLivePriceData(ticker)` — fetches from backend proxy
- Add `fetchHistoricalData(ticker, days)` — Polygon historical aggregates
- `TICKER_CONFIGS` augmented with live data when available

#### `engine/blackScholes.js` — Live Parameter Injection
- No structural changes needed
- Callers will pass live S, K, T, σ instead of simulated values

#### `engine/greeks.js` — Live Greeks Comparison
- Add `fetchLiveGreeks(ticker)` that pulls from Polygon options snapshot
- Show side-by-side: WheelForge-calculated vs. Polygon-reported Greeks

#### `engine/wheelSimulator.js` — Historical Backtesting
- Add `simulateWheelHistorical(ticker, params)` that uses actual Polygon OHLCV
- Current `simulateWheel()` remains for Monte Carlo / simulated runs

#### `engine/predictionEngine.js` — Real Volatility
- Replace hardcoded volatility with Polygon-derived historical vol
- Monte Carlo uses actual price distributions

---

### 6.4 — New Views (Priority 4-6)

#### `views/MarketOverviewView.jsx` (NEW — Priority 6)
- Market status bar (Open/Closed/Pre-Market/After-Hours)
- Watchlist table with live delayed prices
- Daily change %, volume, IV rank
- "Wheel-worthy" tickers: high IV + stable underlying
- Add as new tab: 📊 Market

#### `views/TickerDetailView.jsx` (NEW — Priority 4)
- Interactive price chart (Recharts — already a dependency)
- Timeframe selector: 1D, 1W, 1M, 3M, 1Y
- Key stats panel: market cap, P/E, 52-week range, avg volume
- Options overview: ATM IV, put/call ratio
- "Simulate This Ticker" CTA → pre-fills simulation

#### Enhanced `views/DashboardView.jsx` (Priority 5)
- "Use Live Data" toggle in simulation config
- Live price pre-fill when selecting ticker
- Show live vs simulated price comparison

#### Enhanced `views/GreeksView.jsx` (Priority 8)
- "Compare with Market" toggle
- Polygon Greeks vs calculated Greeks side-by-side

---

### 6.5 — Options Chain Browser (Priority 3)

#### `views/OptionsChainView.jsx` (NEW)
- Expiration date tabs
- Strike price table: bid, ask, last, volume, OI, IV, delta
- Highlight ATM strikes
- Put/Call toggle
- Click to simulate wheel with selected contract

---

### 6.6 — WebSocket Streaming (Priority 7)

#### `src/services/websocketService.js` (NEW)
- Connect to backend WebSocket relay
- Subscribe to tickers user is actively viewing
- Auto-reconnect logic
- Price update events → React state

---

### 6.7 — AI Advisor Enhancement (Priority 9)

#### `utils/index.js` — Enhanced `callClaude()`
- Inject live market context into system prompt
- Include: current price, IV, recent movement, options premiums
- Advisor can now say: *"AAPL is trading at $232.50 with 28% IV — wheel premiums are moderate."*

---

## Updated Architecture

```
src/
├── engine/                        ← 7 modules (2 modified)
│   ├── blackScholes.js            ← (unchanged)
│   ├── priceData.js               ← + live data fetching
│   ├── wheelSimulator.js          ← + historical backtesting mode
│   ├── predictionEngine.js        ← + real volatility input
│   ├── greeks.js                  ← + live greeks comparison
│   ├── optimizer.js               ← (unchanged initially)
│   └── index.js                   ← + new exports
├── services/                      ← NEW — API layer
│   ├── polygonApi.js              ← Backend proxy client
│   ├── marketDataHooks.js         ← React hooks for data
│   └── websocketService.js        ← WebSocket connection
├── constants/
│   └── index.js                   ← + market-related tokens
├── utils/
│   ├── index.js                   ← + enriched AI context
│   └── exportUtils.js             ← (unchanged)
├── components/                    ← 3 → 6+ components
│   ├── StatCard.jsx
│   ├── ProgressRing.jsx
│   ├── Tab.jsx
│   ├── PriceChart.jsx             ← NEW — reusable chart
│   ├── OptionsChainTable.jsx      ← NEW — chain display
│   ├── MarketStatusBadge.jsx      ← NEW — open/closed
│   └── LivePriceTicker.jsx        ← NEW — streaming price
├── views/                         ← 9 → 12 views
│   ├── DashboardView.jsx          ← MODIFIED — live toggle
│   ├── PredictionsView.jsx        ← MODIFIED — real vol
│   ├── GreeksView.jsx             ← MODIFIED — live comparison
│   ├── OptimizerView.jsx
│   ├── AdvisorView.jsx            ← MODIFIED — market context
│   ├── PortfolioView.jsx
│   ├── TradesView.jsx
│   ├── HistoryView.jsx
│   ├── OnboardingScreen.jsx
│   ├── MarketOverviewView.jsx     ← NEW
│   ├── TickerDetailView.jsx       ← NEW
│   └── OptionsChainView.jsx       ← NEW
├── WheelForgeApp.jsx              ← MODIFIED — new tabs + routing
├── App.jsx
└── main.jsx

server/                            ← NEW — Backend proxy
├── index.js
├── routes/
├── services/
├── middleware/
└── package.json
```

---

## Implementation Order

### Sprint 1: Foundation (Days 1–3)
- [ ] **6.1** Set up Express backend with Polygon client
- [ ] **6.1** Implement caching layer + rate limiting
- [ ] **6.2** Create frontend API client + hooks
- [ ] Deploy backend to Render (dev environment)

### Sprint 2: Core Data Integration (Days 4–8)
- [ ] **6.3** Stock snapshot + search endpoints
- [ ] **6.3** Options chain snapshot endpoint
- [ ] **6.4** Ticker Detail View with charts
- [ ] **6.5** Options Chain Browser view

### Sprint 3: Simulation Enhancement (Days 9–13)
- [ ] **6.3** Historical backtesting with real data
- [ ] **6.4** Dashboard live data toggle
- [ ] **6.3** Monte Carlo with real volatility
- [ ] **6.3** Live Greeks comparison

### Sprint 4: Market View & Streaming (Days 14–19)
- [ ] **6.4** Market Overview / Watchlist screen
- [ ] **6.6** WebSocket delayed streaming
- [ ] **6.7** AI Advisor context enrichment
- [ ] Integration testing + polish

---

## Environment Variables

### Backend (`server/.env`)
```
POLYGON_API_KEY=your_polygon_api_key_here
PORT=3001
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development
```

### Frontend (`.env`)
```
VITE_API_BASE_URL=http://localhost:3001/api
```

---

## Pre-Requisites Before Starting

1. ✅ Polygon.io account created (free tier for dev)
2. ✅ API key provisioned (coordinate with William)
3. ✅ Render account ready for backend deployment
4. ✅ This plan reviewed and approved

---

**Ready to begin Sprint 1 on your command.** 🚀
