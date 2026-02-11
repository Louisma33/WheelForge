// ─── TICKER CONFIGURATIONS ───
export const TICKER_CONFIGS = {
    SPY: { price: 585, vol: 0.16, drift: 0.08, name: "S&P 500 ETF", sector: "Index" },
    AAPL: { price: 230, vol: 0.28, drift: 0.10, name: "Apple Inc.", sector: "Tech" },
    TSLA: { price: 350, vol: 0.55, drift: 0.05, name: "Tesla Inc.", sector: "Growth" },
    MSFT: { price: 430, vol: 0.24, drift: 0.12, name: "Microsoft Corp.", sector: "Tech" },
    NVDA: { price: 140, vol: 0.50, drift: 0.15, name: "NVIDIA Corp.", sector: "Tech" },
    AMD: { price: 160, vol: 0.45, drift: 0.08, name: "AMD Inc.", sector: "Tech" },
    AMZN: { price: 210, vol: 0.30, drift: 0.11, name: "Amazon.com", sector: "Tech" },
    META: { price: 590, vol: 0.35, drift: 0.13, name: "Meta Platforms", sector: "Tech" },
};

export const TICKERS = Object.keys(TICKER_CONFIGS);

// ─── PRICE DATA GENERATOR ───
export const generatePriceData = (ticker, days = 252) => {
    const cfg = TICKER_CONFIGS[ticker] || { price: 100, vol: 0.30, drift: 0.07 };
    const dt = 1 / 252;
    const data = [];
    let price = cfg.price;
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() - days);

    for (let i = 0; i <= days; i++) {
        const date = new Date(start);
        date.setDate(date.getDate() + i);
        if (date.getDay() === 0 || date.getDay() === 6) continue;
        const rand =
            Math.sqrt(-2 * Math.log(Math.random())) *
            Math.cos(2 * Math.PI * Math.random());
        price =
            price *
            Math.exp(
                (cfg.drift - 0.5 * cfg.vol * cfg.vol) * dt +
                cfg.vol * Math.sqrt(dt) * rand
            );
        data.push({
            date: date.toISOString().split("T")[0],
            close: parseFloat(price.toFixed(2)),
        });
    }
    return { data, volatility: cfg.vol, drift: cfg.drift };
};

// ─── HISTORICAL VOLATILITY CALCULATION ───
// Calculate annualized historical vol from daily closing prices (log-return method)
export const calculateHistoricalVolatility = (prices, window = null) => {
    if (!prices || prices.length < 2) return 0.30; // fallback
    const closes = prices.map((p) => p.close || p);
    const n = window ? Math.min(window, closes.length) : closes.length;
    const slice = closes.slice(-n);

    // Log returns
    const logReturns = [];
    for (let i = 1; i < slice.length; i++) {
        if (slice[i] > 0 && slice[i - 1] > 0) {
            logReturns.push(Math.log(slice[i] / slice[i - 1]));
        }
    }
    if (logReturns.length < 2) return 0.30;

    const mean = logReturns.reduce((a, b) => a + b, 0) / logReturns.length;
    const variance =
        logReturns.reduce((sum, r) => sum + (r - mean) ** 2, 0) /
        (logReturns.length - 1);
    const dailyVol = Math.sqrt(variance);

    // Annualize: daily vol × √252
    return dailyVol * Math.sqrt(252);
};

// ─── DRIFT FROM HISTORICAL DATA ───
export const calculateHistoricalDrift = (prices) => {
    if (!prices || prices.length < 20) return 0.08;
    const closes = prices.map((p) => p.close || p);
    const first = closes[0];
    const last = closes[closes.length - 1];
    const years = closes.length / 252;
    if (first <= 0 || years <= 0) return 0.08;
    return Math.log(last / first) / years;
};

// ─── FETCH LIVE PRICE DATA ───
// Returns a snapshot from the backend proxy (Polygon or mock)
export const fetchLivePriceData = async (ticker) => {
    try {
        const { fetchStockSnapshot } = await import("../services/polygonApi.js");
        const snap = await fetchStockSnapshot(ticker);
        return {
            price: snap.price,
            change: snap.change,
            changePercent: snap.changePercent,
            volume: snap.volume,
            high: snap.high,
            low: snap.low,
            open: snap.open,
            prevClose: snap.prevClose,
            _live: true,
            _mock: snap._mock || false,
        };
    } catch {
        // Fallback to config
        const cfg = TICKER_CONFIGS[ticker];
        return cfg
            ? { price: cfg.price, _live: false, _mock: false }
            : { price: 100, _live: false, _mock: false };
    }
};

// ─── FETCH HISTORICAL PRICES ───
// Returns daily OHLCV from backend, with computed volatility & drift
export const fetchHistoricalPrices = async (ticker, days = 252) => {
    try {
        const { fetchHistoryForRange } = await import("../services/polygonApi.js");
        // Pick the best range for the requested days
        const range =
            days <= 7 ? "1W" :
                days <= 30 ? "1M" :
                    days <= 90 ? "3M" :
                        days <= 365 ? "1Y" : "5Y";

        const histData = await fetchHistoryForRange(ticker, range);
        const bars = histData?.data || [];

        if (bars.length < 5) throw new Error("Insufficient historical data");

        const volatility = calculateHistoricalVolatility(bars);
        const drift = calculateHistoricalDrift(bars);

        return {
            data: bars.map((b) => ({
                date: b.date,
                close: b.close,
                open: b.open,
                high: b.high,
                low: b.low,
                volume: b.volume,
            })),
            volatility,
            drift,
            count: bars.length,
            _live: true,
            _mock: histData._mock || false,
        };
    } catch {
        // Fallback to simulated data
        return { ...generatePriceData(ticker, days), _live: false };
    }
};

// ─── HYBRID PRICE DATA ───
// Tries live first, falls back to simulated  — drop-in replacement for generatePriceData()
export const getHybridPriceData = async (ticker, days = 252, forceLive = false) => {
    if (forceLive) {
        return fetchHistoricalPrices(ticker, days);
    }

    try {
        const result = await fetchHistoricalPrices(ticker, days);
        if (result._live && result.data.length >= 20) return result;
        throw new Error("Insufficient live data");
    } catch {
        return { ...generatePriceData(ticker, days), _live: false };
    }
};
