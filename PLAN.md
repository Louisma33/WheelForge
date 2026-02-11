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

## ✅ Phase 5: Deployment & Polish (COMPLETE)
- [x] Production build optimization (code splitting via React.lazy)
- [ ] Deploy to Vercel/Netlify
- [ ] PWA support (offline-capable)
- [ ] Custom domain setup
- [ ] Performance monitoring
- [ ] Responsive fine-tuning for tablets/desktop
- [ ] Keyboard shortcuts for power users

## ✅ Phase 6: Polygon.io Market Data Integration (COMPLETE)
> **Spec by:** AFFIX Financial Solutions LLC — see `POLYGON_SPEC.md` and `POLYGON_IMPLEMENTATION_PLAN.md`

### Sprint 1: Foundation ✅
- [x] Express backend proxy (`server/`) with Polygon.io REST client
- [x] In-memory caching (5min stocks, 24hr history, 7d reference)
- [x] Rate limiting middleware
- [x] Frontend API client + React hooks (`src/services/`)
- [x] Deploy backend to Render (dev)

### Sprint 2: Core Data ✅
- [x] Stock snapshot + ticker search endpoints
- [x] Options chain snapshot endpoint
- [x] Ticker Detail View with interactive price charts
- [x] Options Chain Browser view

### Sprint 3: Simulation Enhancement ✅
- [x] Historical backtesting with real Polygon OHLCV data
- [x] Dashboard "Use Live Data" toggle
- [x] Monte Carlo with real historical volatility
- [x] Live Greeks comparison (calculated vs. Polygon)

### Sprint 4: Streaming & AI Enhancement ✅
- [x] Market Overview / Watchlist screen
- [x] WebSocket delayed streaming
- [x] AI Advisor enriched with live market context
- [x] Integration testing + polish

## Architecture (Current)
```
src/
├── engine/                      ← 7 modules
│   ├── blackScholes.js          ← Normal CDF + BS pricing
│   ├── priceData.js             ← GBM + live data + historical vol
│   ├── wheelSimulator.js        ← Wheel sim + historical backtest
│   ├── predictionEngine.js      ← Linear regression + Monte Carlo
│   ├── greeks.js                ← Greeks (Δ Γ Θ ν ρ) + market comparison
│   ├── optimizer.js             ← Grid search + multi-ticker
│   └── index.js                 ← Barrel exports
├── services/                    ← API + streaming
│   ├── polygonApi.js            ← REST client for backend proxy
│   ├── marketDataHooks.js       ← React hooks for market data
│   └── websocketService.js      ← WS client + React hooks
├── constants/
│   └── index.js                 ← Design tokens + styles + onboarding
├── utils/
│   ├── index.js                 ← Formatting, Claude API, LocalStorage
│   └── exportUtils.js           ← CSV export
├── components/                  ← Reusable components
│   ├── StatCard.jsx
│   ├── ProgressRing.jsx
│   ├── Tab.jsx
│   ├── MarketStatusBadge.jsx
│   ├── LivePriceTicker.jsx
│   ├── PriceChart.jsx
│   └── OptionsChainTable.jsx
├── views/                       ← 13 view components
│   ├── DashboardView.jsx        ← Performance + backtest metrics
│   ├── PredictionsView.jsx      ← Monte Carlo + real vol
│   ├── GreeksView.jsx           ← Greeks + market comparison
│   ├── OptimizerView.jsx        ← Strategy optimizer
│   ├── AdvisorView.jsx          ← AI chat (context-enriched)
│   ├── PortfolioView.jsx        ← Allocation + returns
│   ├── TradesView.jsx           ← Trade log + CSV
│   ├── HistoryView.jsx          ← Simulation history
│   ├── MarketOverviewView.jsx   ← Live market watchlist
│   ├── TickerDetailView.jsx     ← Ticker detail + charts
│   ├── OptionsChainView.jsx     ← Options chain browser
│   └── OnboardingScreen.jsx     ← Onboarding flow
├── WheelForgeApp.jsx            ← Main app (state + routing + 10 tabs)
├── App.jsx                      ← Root component
└── main.jsx                     ← Entry point

server/
├── index.js                     ← Express + WebSocket server
├── package.json
├── services/
│   ├── polygonClient.js         ← Polygon.io API client + cache
│   └── mockData.js              ← Mock data for development
├── routes/
│   ├── stocks.js                ← Stock endpoints
│   ├── options.js               ← Options endpoints
│   ├── search.js                ← Search + ticker details
│   └── ai.js                    ← AI chat proxy
├── middleware/
│   └── rateLimiter.js           ← Rate limiting tiers
├── .env.example
└── render.yaml                  ← Render deployment config
```

## ⏳ Phase 7: Production Deployment & PWA (IN PROGRESS)
- [x] Deploy frontend to Vercel → **https://wheelforge-alpha.vercel.app**
- [x] Vercel env: `VITE_API_BASE_URL` → `https://wheelforge-api.onrender.com/api`
- [ ] Deploy backend to Render (see steps below)
- [ ] Custom domain setup (e.g., wheelforge.app)
- [x] PWA manifest + icons (192px + 512px)
- [ ] PWA service worker (offline mode)
- [ ] Performance audit (Lighthouse 90+)
- [x] Responsive polish for tablet/desktop breakpoints
- [x] Keyboard shortcuts (Ctrl+Enter, Ctrl+S, 1-8, Esc)
- [x] SEO meta tags + Open Graph previews
- [x] Error boundary + fallback UI
- [ ] Analytics integration (optional)

### Render Backend Deployment Steps
1. Go to **https://dashboard.render.com/blueprints**
2. Click **"New Blueprint Instance"**
3. Connect the **WheelForge** GitHub repo
4. Render will auto-detect `render.yaml`
5. Set secret env vars:
   - `POLYGON_API_KEY` — your Polygon.io API key
   - `ANTHROPIC_API_KEY` — your Claude API key
6. Click **Deploy**
7. Once live, verify: `https://wheelforge-api.onrender.com/api/health`

