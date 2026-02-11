# WheelForge — Implementation Plan

## ✅ Phase 1: Code Modularization (COMPLETE)
Broke the 845-line monolith into clean, organized modules.

## ✅ Phase 2: Enhanced UI/UX (COMPLETE)
Hover effects, glow accents, trade row highlights, message animations, simulation counter.

## ✅ Phase 3: Data Persistence (COMPLETE)
LocalStorage for settings, onboarding, chat, simulation history. History tab.

## ✅ Phase 4: Advanced Features (COMPLETE)

### New Engine Modules
- **`engine/greeks.js`** — Full Options Greeks calculator (Delta Δ, Gamma Γ, Theta Θ, Vega ν, Rho ρ)
  - Derived from Black-Scholes model
  - Calculates Greeks for both put and call positions
  - P&L scenario generator for visualizing risk profiles at expiration
- **`engine/optimizer.js`** — Strategy optimizer + multi-ticker comparison
  - Grid search: 8 OTM% × 8 DTE = 64 combos × 3 Monte Carlo runs = 192 simulations
  - Multi-ticker: Same strategy across all 8 tickers × 3 runs = 24 simulations
  - Results ranked by wheel return with alpha, premium, and risk metrics

### New Views
- **`views/GreeksView.jsx`** — Full Greeks visualization
  - Toggle between cash-secured put and covered call
  - Animated bar visualizations for all 5 Greeks
  - P&L at expiration chart with strike and breakeven markers
  - Contextual "Wheel Insight" text explaining what the Greeks mean
- **`views/OptimizerView.jsx`** — Strategy optimization + multi-ticker comparison
  - Sub-tabs: Optimizer | Multi-Ticker
  - Optimizer: bar chart of top 10 combos, highlighted optimal strategy, full 20-row results table
  - Multi-Ticker: dual bar chart (wheel vs B&H), ranked ticker cards with medals (🥇🥈🥉)
  - CSV export for optimizer results

### New Utilities
- **`utils/exportUtils.js`** — CSV export for trades, summary, portfolio history, optimizer results
  - Auto-download via Blob/URL API
  - Metadata headers with parameters and timestamp

### Updated Components
- **TradesView** — Added export CSV button
- **WheelForgeApp** — 8 tabs: Dashboard, Predict, Greeks, Optimize, AI Advisor, Portfolio, Trades, History
  - Export summary button in header
  - All new views wired with proper props

## Architecture (Final)
```
src/
├── engine/                    ← 6 modules
│   ├── blackScholes.js        ← Normal CDF + BS pricing
│   ├── priceData.js           ← GBM price data + ticker configs
│   ├── wheelSimulator.js      ← Core wheel simulation loop
│   ├── predictionEngine.js    ← Linear regression + Monte Carlo
│   ├── greeks.js              ← Options Greeks (Δ Γ Θ ν ρ) + P&L scenarios
│   ├── optimizer.js           ← Grid search optimizer + multi-ticker
│   └── index.js               ← Barrel exports
├── constants/
│   └── index.js               ← 17 design tokens + styles + onboarding
├── utils/
│   ├── index.js               ← Formatting, Claude API, LocalStorage
│   └── exportUtils.js         ← CSV export (trades, summary, portfolio, optimizer)
├── components/                ← 3 reusable components
│   ├── StatCard.jsx
│   ├── ProgressRing.jsx
│   └── Tab.jsx
├── views/                     ← 9 view components
│   ├── DashboardView.jsx      ← Performance overview + AI analysis
│   ├── PredictionsView.jsx    ← Monte Carlo + assignment probabilities
│   ├── GreeksView.jsx         ← Options Greeks + P&L diagram
│   ├── OptimizerView.jsx      ← Strategy optimizer + multi-ticker
│   ├── AdvisorView.jsx        ← AI chat
│   ├── PortfolioView.jsx      ← Allocation + value chart + returns
│   ├── TradesView.jsx         ← Trade log + CSV export
│   ├── HistoryView.jsx        ← Simulation history
│   └── OnboardingScreen.jsx   ← 10-question onboarding flow
├── WheelForgeApp.jsx          ← Main app (state + routing + 8 tabs)
├── App.jsx                    ← Root component
└── main.jsx                   ← Entry point
```

## 🔲 Phase 5: Deployment & Polish (NEXT)
- [ ] Production build optimization (code splitting)
- [ ] Deploy to Vercel/Netlify
- [ ] PWA support (offline-capable)
- [ ] Custom domain setup
- [ ] Performance monitoring
- [ ] Responsive fine-tuning for tablets/desktop
- [ ] Keyboard shortcuts for power users

## 🔲 Phase 6: Polygon.io Market Data Integration (HIGH PRIORITY)
> **Spec by:** AFFIX Financial Solutions LLC — see `POLYGON_SPEC.md` and `POLYGON_IMPLEMENTATION_PLAN.md`

### Sprint 1: Foundation (Days 1–3)
- [ ] Express backend proxy (`server/`) with Polygon.io REST client
- [ ] In-memory caching (5min stocks, 24hr history, 7d reference)
- [ ] Rate limiting middleware
- [ ] Frontend API client + React hooks (`src/services/`)
- [ ] Deploy backend to Render (dev)

### Sprint 2: Core Data (Days 4–8)
- [ ] Stock snapshot + ticker search endpoints
- [ ] Options chain snapshot endpoint
- [ ] Ticker Detail View with interactive price charts
- [ ] Options Chain Browser view

### Sprint 3: Simulation Enhancement (Days 9–13)
- [ ] Historical backtesting with real Polygon OHLCV data
- [ ] Dashboard "Use Live Data" toggle
- [ ] Monte Carlo with real historical volatility
- [ ] Live Greeks comparison (calculated vs. Polygon)

### Sprint 4: Market View & Streaming (Days 14–19)
- [ ] Market Overview / Watchlist screen
- [ ] WebSocket delayed streaming (15-min)
- [ ] AI Advisor enriched with live market context
- [ ] Integration testing + polish
