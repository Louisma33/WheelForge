# WheelForge — Polygon.io Market Data Integration Spec

## Technical Specification for Antigravity Development Team

**Project:** WheelForge  
**Client:** AFFIX Financial Solutions LLC  
**Date:** February 10, 2026  
**Priority:** High  

---

## 1. Overview

WheelForge currently operates as an AI-powered options trading simulator focused on the wheel strategy. This spec outlines the integration of **Polygon.io** as a live market data provider to deliver **15-minute delayed** stock and options data directly within the app, enhancing the simulator by grounding simulations in real market conditions.

---

## 2. Why Polygon.io

- Comprehensive options data: chains, greeks (delta, gamma, theta, vega), IV, and open interest
- Stock quotes & snapshots on 15-minute delay
- Deep historical data for backtesting
- WebSocket streaming for a live-feel market view
- Scalable pricing: Free tier for dev, Starter ($29/mo) for production
- Well-documented REST + WebSocket APIs compatible with React Native/Expo

---

## 3. Data Endpoints to Integrate

### Stock Market Data
- **Previous day close** → stock summary cards
- **Historical aggregates (OHLCV)** → charts, backtesting, Monte Carlo input
- **Snapshot (15-min delayed)** → live price display in simulator
- **WebSocket delayed stream** → live price ticker / market view

### Options Data
- **Options contracts list** → populate options chain selector
- **Options chain snapshot** → full chain with greeks, IV, bid/ask
- **Historical options pricing** → backtest wheel trades, validate Black-Scholes
- **Single contract snapshot** → detailed view for specific strike/expiry

### Reference Data
- **Ticker search/lookup** → stock search in onboarding and trade setup
- **Company details** → company name, sector, description
- **Ticker details** → market cap, type, primary exchange

---

## 4. Integration Architecture

### Backend Proxy (Required)
**Do NOT call Polygon.io directly from the React Native client.** Route all calls through the Render backend to protect the API key, implement caching, rate-limit per user, and normalize data.

```
[React Native App] → [Render Backend] → [Polygon.io REST/WebSocket]
                                          ↓
                                   [Cache Layer]
```

### Caching Strategy
- Stock snapshots: 5 minutes
- Options chain snapshots: 5 minutes
- Historical aggregates: 24 hours
- Reference data: 7 days

### WebSocket
- Backend maintains one WebSocket to Polygon delayed feed
- Fans out relevant ticker updates to connected clients
- Client subscribes only to actively viewed tickers

---

## 5. App UI Additions

### Market Overview Screen (New)
- Market status indicator (Open / Closed / Pre-Market / After-Hours)
- Watchlist with live delayed prices, daily change %, volume
- Trending tickers: high IV, high volume (wheel-relevant)

### Enhanced Simulation Setup
- Live price pre-fill when user selects a ticker
- Options chain browser (actual strikes, expirations, premiums)
- "Use Live Data" toggle vs. manual input

### Ticker Detail View
- Price chart (1D, 1W, 1M, 3M, 1Y)
- Key stats: market cap, P/E, 52-week range, avg volume
- Options overview: ATM IV, put/call ratio, nearest chain preview

---

## 6. Integration with Existing Features

### Black-Scholes Model
Replace manual inputs with live data: underlying price (S), strike (K), time to expiry (T), and implied volatility (σ) all sourced from Polygon snapshots.

### Monte Carlo Simulations
Feed historical price data from Polygon aggregates for more realistic probability distributions using actual historical volatility.

### AI Advisor (Claude API)
Enrich context: *"Based on current IV of 45% for AAPL, the wheel premiums look attractive..."*

---

## 7. Rate Limits & Plan

| Plan | Cost | WebSocket | Recommended For |
|------|------|-----------|-----------------|
| Free | $0/mo | No | Dev/testing only |
| **Starter** | **$29/mo** | **Delayed (15-min)** | **Production launch** |
| Developer | $79/mo | Real-time | Future upgrade |

---

## 8. Implementation Priority

| Priority | Task | Est. Effort |
|----------|------|-------------|
| 1 | Backend proxy + API key management | 1–2 days |
| 2 | Stock snapshot & search endpoints | 1–2 days |
| 3 | Options chain snapshot endpoint | 2–3 days |
| 4 | Ticker detail view with charts | 2–3 days |
| 5 | Simulation setup with live data pre-fill | 2–3 days |
| 6 | Market overview / watchlist screen | 2–3 days |
| 7 | WebSocket delayed streaming | 3–4 days |
| 8 | Black-Scholes & Monte Carlo live data | 2–3 days |
| 9 | AI Advisor context enrichment | 1–2 days |

**Total: ~16–25 development days**

---

## 9. Key Notes for Antigravity

- All Polygon calls go through backend — no client-side API keys
- Cache aggressively to stay within limits and reduce latency
- 15-minute delay is sufficient for a simulator — keeps costs low
- Polygon docs: https://polygon.io/docs
- Use free tier for dev, Starter for production
- Coordinate with William on Polygon account setup and API key provisioning

---

**Prepared by:** AFFIX Financial Solutions LLC  
**For:** Antigravity Development Team  
**Status:** Ready for Review & Estimation
