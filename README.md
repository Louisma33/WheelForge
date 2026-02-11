# ⚒️ WheelForge

> **Cycle. Collect. Conquer.**

AI-powered options wheel strategy simulator built with React + Vite. Simulate selling cash-secured puts and covered calls with real-time Monte Carlo predictions, Greeks analysis, strategy optimization, and an AI trading advisor.

## 🔥 Features

| Feature | Description |
|---------|-------------|
| **📊 Dashboard** | Performance overview with wheel vs buy-and-hold comparison charts |
| **🔮 Predictions** | Monte Carlo simulations with confidence intervals and assignment probabilities |
| **📐 Greeks** | Full Options Greeks (Δ Γ Θ ν ρ) with P&L at expiration diagrams |
| **⚙️ Optimizer** | Grid search across 64+ OTM%/DTE combinations to find optimal strategy |
| **📊 Multi-Ticker** | Compare the same strategy across 8 popular tickers (SPY, AAPL, TSLA, etc.) |
| **🤖 AI Advisor** | Chat with the WheelForge AI for strategy analysis and recommendations |
| **💼 Portfolio** | Allocation breakdown, value history, and return analysis |
| **📋 Trades** | Complete trade log with CSV export |
| **📜 History** | Saved simulation results with trend indicators |
| **📥 CSV Export** | Export trades, summaries, portfolio history, and optimizer results |

## 🏗️ Architecture

```
src/
├── engine/                    ← Financial computation modules
│   ├── blackScholes.js        ← Normal CDF + Black-Scholes pricing
│   ├── priceData.js           ← GBM price data generator + 8 ticker configs
│   ├── wheelSimulator.js      ← Core wheel strategy simulation loop
│   ├── predictionEngine.js    ← Linear regression + Monte Carlo
│   ├── greeks.js              ← Options Greeks (Δ Γ Θ ν ρ) + P&L scenarios
│   ├── optimizer.js           ← Grid search optimizer + multi-ticker comparison
│   └── index.js               ← Barrel exports
├── constants/
│   └── index.js               ← 17 design tokens, shared styles, onboarding config
├── utils/
│   ├── index.js               ← Formatting, Claude API, LocalStorage persistence
│   └── exportUtils.js         ← CSV export (trades, summary, portfolio, optimizer)
├── components/                ← 3 reusable UI components
│   ├── StatCard.jsx           ← Metric display with hover glow
│   ├── ProgressRing.jsx       ← Circular progress indicator
│   └── Tab.jsx                ← Navigation tab button
├── views/                     ← 9 view components (5 lazy-loaded)
│   ├── DashboardView.jsx      ← Performance overview + AI analysis
│   ├── PredictionsView.jsx    ← Monte Carlo + assignment probabilities
│   ├── GreeksView.jsx         ← Options Greeks + P&L diagram
│   ├── OptimizerView.jsx      ← Strategy optimizer + multi-ticker
│   ├── AdvisorView.jsx        ← AI chat interface
│   ├── PortfolioView.jsx      ← Allocation + value chart + returns
│   ├── TradesView.jsx         ← Trade log + CSV export
│   ├── HistoryView.jsx        ← Simulation history
│   └── OnboardingScreen.jsx   ← 10-question onboarding flow
├── WheelForgeApp.jsx          ← Main app orchestrator (state + routing + 8 tabs)
├── App.jsx                    ← Root component
└── main.jsx                   ← Entry point
```

## 🚀 Getting Started

```bash
# Clone
git clone https://github.com/Louisma33/WheelForge.git
cd WheelForge

# Install
npm install

# Dev server
npm run dev

# Production build
npm run build
```

## 🛠️ Tech Stack

- **React 19** — UI framework
- **Vite 7** — Build tool with code splitting
- **Recharts** — Data visualization (lazy-loaded)
- **Lucide React** — Icon library
- **Black-Scholes** — Custom options pricing engine
- **Monte Carlo** — Probabilistic forecasting

## 📈 Performance

| Metric | Value |
|--------|-------|
| Main entry bundle | **221 KB** |
| Recharts vendor chunk | 393 KB (async) |
| Build warnings | **0** |
| Source files | 25 |
| Total source size | 178 KB |

## ⚠️ Disclaimer

This is an **educational simulator** using simulated price data and Black-Scholes estimates. Not financial advice. Past performance does not indicate future results.

---

Built with 🔥 by WheelForge
