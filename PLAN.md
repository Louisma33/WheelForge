# WheelForge — Implementation Plan

## ✅ Phase 1: Code Modularization (COMPLETE)
Broke the 845-line monolith into clean, organized modules:

### Architecture
```
src/
├── engine/              ← Financial computation modules
│   ├── blackScholes.js  ← Normal CDF + Black-Scholes pricing
│   ├── priceData.js     ← GBM price data generator + ticker configs
│   ├── wheelSimulator.js ← Core wheel strategy simulation loop
│   ├── predictionEngine.js ← Linear regression + Monte Carlo
│   └── index.js         ← Barrel exports
├── constants/
│   └── index.js         ← Design tokens, shared styles, onboarding config
├── utils/
│   └── index.js         ← Formatting, Claude API, LocalStorage helpers
├── components/          ← Reusable UI components
│   ├── StatCard.jsx     ← Metric display card
│   ├── ProgressRing.jsx ← Circular progress indicator
│   └── Tab.jsx          ← Navigation tab button
├── views/               ← Page-level view components
│   ├── DashboardView.jsx
│   ├── PredictionsView.jsx
│   ├── AdvisorView.jsx
│   ├── PortfolioView.jsx
│   ├── TradesView.jsx
│   ├── HistoryView.jsx   ← NEW
│   └── OnboardingScreen.jsx
├── WheelForgeApp.jsx    ← Main app orchestrator (state + routing)
├── App.jsx              ← Root component
└── main.jsx             ← Entry point
```

## ✅ Phase 2: Enhanced UI/UX (COMPLETE)
- Hover effects on StatCards with glow accents
- Trade row hover highlights
- Fixed ProgressRing percentage label positioning
- Message slide-in animations in AI Advisor chat
- Simulation counter in settings

## ✅ Phase 3: Data Persistence (COMPLETE)
- LocalStorage persistence for:
  - Onboarding state (answers, profile, onboarded flag)
  - Simulation parameters (ticker, capital, OTM%, DTE, contracts)
  - AI chat history
  - Simulation history (last 50 runs)
- New History tab showing past simulations with trend indicators
- Clear history functionality

## 🔲 Phase 4: Advanced Features (NEXT)
- [ ] Multi-ticker comparison (run strategy across multiple tickers)
- [ ] Strategy parameter optimizer (find optimal OTM%/DTE combos)
- [ ] Export simulations as CSV/PDF
- [ ] Greeks display (Delta, Gamma, Theta, Vega)
- [ ] Profit/Loss scenarios visualization
- [ ] Rolling returns analysis

## 🔲 Phase 5: Deployment
- [ ] Production build optimization
- [ ] Deploy to Vercel/Netlify
- [ ] Custom domain setup
- [ ] PWA support (offline-capable)
- [ ] Performance monitoring
