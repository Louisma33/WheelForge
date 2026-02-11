// ─── MOCK DATA SERVICE ───
// Returns realistic mock data when Polygon API key is not configured or "demo"
// Ensures the frontend works perfectly during development

const MOCK_TICKERS = {
    SPY: { price: 587.42, name: "SPDR S&P 500 ETF Trust", sector: "Index", marketCap: 540e9, vol: 0.16 },
    AAPL: { price: 232.15, name: "Apple Inc.", sector: "Technology", marketCap: 3.54e12, vol: 0.28 },
    TSLA: { price: 353.80, name: "Tesla, Inc.", sector: "Consumer Cyclical", marketCap: 1.13e12, vol: 0.55 },
    MSFT: { price: 432.60, name: "Microsoft Corporation", sector: "Technology", marketCap: 3.22e12, vol: 0.24 },
    NVDA: { price: 142.35, name: "NVIDIA Corporation", sector: "Technology", marketCap: 3.49e12, vol: 0.50 },
    AMD: { price: 162.70, name: "Advanced Micro Devices", sector: "Technology", marketCap: 263e9, vol: 0.45 },
    AMZN: { price: 213.45, name: "Amazon.com, Inc.", sector: "Consumer Cyclical", marketCap: 2.23e12, vol: 0.30 },
    META: { price: 593.20, name: "Meta Platforms, Inc.", sector: "Technology", marketCap: 1.51e12, vol: 0.35 },
    GOOGL: { price: 185.30, name: "Alphabet Inc.", sector: "Technology", marketCap: 2.29e12, vol: 0.27 },
    JPM: { price: 248.90, name: "JPMorgan Chase & Co.", sector: "Financial", marketCap: 705e9, vol: 0.22 },
};

// Generate realistic GBM price history
const generateHistory = (ticker, days = 252) => {
    const cfg = MOCK_TICKERS[ticker] || { price: 100, vol: 0.30 };
    const dt = 1 / 252;
    const drift = 0.08;
    const data = [];
    let price = cfg.price * (0.85 + Math.random() * 0.15); // Start ~10% lower
    const today = new Date();

    for (let i = days; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        if (d.getDay() === 0 || d.getDay() === 6) continue;

        const rand = Math.sqrt(-2 * Math.log(Math.random())) * Math.cos(2 * Math.PI * Math.random());
        price *= Math.exp((drift - 0.5 * cfg.vol * cfg.vol) * dt + cfg.vol * Math.sqrt(dt) * rand);

        const dayVol = price * (0.005 + Math.random() * 0.02);
        data.push({
            date: d.toISOString().split("T")[0],
            open: +(price * (1 + (Math.random() - 0.5) * 0.005)).toFixed(2),
            high: +(price * (1 + Math.random() * 0.015)).toFixed(2),
            low: +(price * (1 - Math.random() * 0.015)).toFixed(2),
            close: +price.toFixed(2),
            volume: Math.floor(10e6 + Math.random() * 50e6),
            vwap: +price.toFixed(2),
            transactions: Math.floor(50000 + Math.random() * 200000),
        });
    }
    return data;
};

// Generate mock options chain
const generateOptionsChain = (ticker, underlyingPrice) => {
    const contracts = [];
    const now = new Date();

    // Generate 3 expirations
    const expirations = [7, 14, 30, 45].map((d) => {
        const date = new Date(now);
        date.setDate(date.getDate() + d);
        // Find next Friday
        while (date.getDay() !== 5) date.setDate(date.getDate() + 1);
        return date.toISOString().split("T")[0];
    });

    const cfg = MOCK_TICKERS[ticker] || { vol: 0.30 };
    const iv = cfg.vol;

    for (const expDate of expirations) {
        const dte = Math.max(1, Math.round((new Date(expDate) - now) / 86400000));
        const T = dte / 365;

        // Generate strikes around ATM
        const atmStrike = Math.round(underlyingPrice / 5) * 5;
        const strikes = [];
        for (let i = -8; i <= 8; i++) {
            const step = underlyingPrice > 200 ? 5 : underlyingPrice > 50 ? 2.5 : 1;
            strikes.push(atmStrike + i * step);
        }

        for (const strike of strikes) {
            const moneyness = underlyingPrice / strike;
            const sqrtT = Math.sqrt(T);

            for (const type of ["put", "call"]) {
                const otm = type === "put" ? strike < underlyingPrice : strike > underlyingPrice;
                const itm = !otm && strike !== underlyingPrice;

                // Simplified BS-like pricing
                const intrinsic = type === "put"
                    ? Math.max(0, strike - underlyingPrice)
                    : Math.max(0, underlyingPrice - strike);
                const timeValue = underlyingPrice * iv * sqrtT * 0.4 * Math.exp(-Math.abs(Math.log(moneyness)) * 2);
                const mid = Math.max(0.01, intrinsic + timeValue);

                // Greeks approximation
                const d1 = (Math.log(moneyness) + (0.05 + 0.5 * iv * iv) * T) / (iv * sqrtT || 1);
                const normCDF = (x) => 0.5 * (1 + Math.sign(x) * Math.sqrt(1 - Math.exp(-2 * x * x / Math.PI)));
                const delta = type === "call" ? normCDF(d1) : normCDF(d1) - 1;

                contracts.push({
                    contractTicker: `O:${ticker}${expDate.replace(/-/g, "").slice(2)}${type === "call" ? "C" : "P"}${String(Math.round(strike * 1000)).padStart(8, "0")}`,
                    strikePrice: strike,
                    expirationDate: expDate,
                    contractType: type,
                    bid: +Math.max(0, mid * 0.95).toFixed(2),
                    ask: +Math.max(0.01, mid * 1.05).toFixed(2),
                    midpoint: +mid.toFixed(2),
                    lastPrice: +mid.toFixed(2),
                    delta: +delta.toFixed(4),
                    gamma: +(0.01 * Math.exp(-d1 * d1 / 2) / (underlyingPrice * iv * sqrtT || 1)).toFixed(6),
                    theta: +((-underlyingPrice * iv * Math.exp(-d1 * d1 / 2)) / (2 * Math.sqrt(2 * Math.PI * T * 365) || 1)).toFixed(4),
                    vega: +(underlyingPrice * sqrtT * Math.exp(-d1 * d1 / 2) / (100 * Math.sqrt(2 * Math.PI))).toFixed(4),
                    impliedVolatility: +(iv * (0.85 + Math.random() * 0.3)).toFixed(4),
                    openInterest: Math.floor(Math.random() * 10000),
                    volume: Math.floor(Math.random() * 5000),
                    underlyingPrice,
                });
            }
        }
    }
    return contracts;
};

// ─── MOCK ENDPOINTS ───

export const mockStockSnapshot = (ticker) => {
    const cfg = MOCK_TICKERS[ticker.toUpperCase()] || { price: 100, name: ticker };
    const change = cfg.price * (Math.random() - 0.48) * 0.02;
    return {
        ticker: ticker.toUpperCase(),
        price: +(cfg.price + change).toFixed(2),
        change: +change.toFixed(2),
        changePercent: +((change / cfg.price) * 100).toFixed(2),
        volume: Math.floor(20e6 + Math.random() * 80e6),
        open: +(cfg.price * (1 + (Math.random() - 0.5) * 0.005)).toFixed(2),
        high: +(cfg.price * (1 + Math.random() * 0.012)).toFixed(2),
        low: +(cfg.price * (1 - Math.random() * 0.012)).toFixed(2),
        prevClose: +cfg.price.toFixed(2),
        vwap: +(cfg.price + change * 0.5).toFixed(2),
        timestamp: new Date().toISOString(),
        _mock: true,
    };
};

export const mockPreviousClose = (ticker) => {
    const cfg = MOCK_TICKERS[ticker.toUpperCase()] || { price: 100 };
    return {
        ticker: ticker.toUpperCase(),
        open: +(cfg.price * 0.998).toFixed(2),
        high: +(cfg.price * 1.008).toFixed(2),
        low: +(cfg.price * 0.992).toFixed(2),
        close: +cfg.price.toFixed(2),
        volume: Math.floor(30e6 + Math.random() * 60e6),
        vwap: +cfg.price.toFixed(2),
        date: new Date(Date.now() - 86400000).toISOString().split("T")[0],
        _mock: true,
    };
};

export const mockHistoricalAggregates = (ticker, from, to) => {
    const start = new Date(from);
    const end = new Date(to);
    const days = Math.round((end - start) / 86400000);
    const data = generateHistory(ticker.toUpperCase(), Math.min(days, 365));
    // Filter to date range
    const filtered = data.filter((d) => d.date >= from && d.date <= to);
    return {
        ticker: ticker.toUpperCase(),
        count: filtered.length,
        data: filtered,
        _mock: true,
    };
};

export const mockOptionsChain = (ticker, params = {}) => {
    const cfg = MOCK_TICKERS[ticker.toUpperCase()] || { price: 100 };
    let contracts = generateOptionsChain(ticker.toUpperCase(), cfg.price);

    if (params.expDate) {
        contracts = contracts.filter((c) => c.expirationDate === params.expDate);
    }
    if (params.contractType) {
        contracts = contracts.filter((c) => c.contractType === params.contractType);
    }

    return {
        ticker: ticker.toUpperCase(),
        contracts,
        _mock: true,
    };
};

export const mockSearchTickers = (query) => {
    const q = query.toLowerCase();
    const results = Object.entries(MOCK_TICKERS)
        .filter(([t, cfg]) => t.toLowerCase().includes(q) || cfg.name.toLowerCase().includes(q))
        .map(([t, cfg]) => ({
            ticker: t,
            name: cfg.name,
            market: "stocks",
            type: "CS",
            primaryExchange: "XNAS",
            currencyName: "usd",
        }));
    return { results, _mock: true };
};

export const mockTickerDetails = (ticker) => {
    const cfg = MOCK_TICKERS[ticker.toUpperCase()];
    if (!cfg) {
        return {
            ticker: ticker.toUpperCase(),
            name: ticker.toUpperCase(),
            description: "No data available in mock mode.",
            market: "stocks",
            type: "CS",
            primaryExchange: "XNAS",
            marketCap: 0,
            _mock: true,
        };
    }
    return {
        ticker: ticker.toUpperCase(),
        name: cfg.name,
        description: `${cfg.name} is a publicly traded company in the ${cfg.sector} sector.`,
        market: "stocks",
        type: "CS",
        primaryExchange: "XNAS",
        marketCap: cfg.marketCap,
        shareClassSharesOutstanding: Math.floor(cfg.marketCap / cfg.price),
        sicDescription: cfg.sector,
        homepageUrl: "",
        logoUrl: null,
        listDate: "2000-01-01",
        _mock: true,
    };
};

export const mockMarketStatus = () => {
    const now = new Date();
    const hour = now.getUTCHours();
    const day = now.getUTCDay();
    const isWeekday = day >= 1 && day <= 5;
    const isMarketHours = hour >= 14 && hour < 21; // 9:30 AM - 4 PM ET in UTC
    const isPreMarket = hour >= 9 && hour < 14;
    const isAfterHours = hour >= 21 && hour < 24;

    let market = "closed";
    if (isWeekday) {
        if (isMarketHours) market = "open";
        else if (isPreMarket) market = "pre-market";
        else if (isAfterHours) market = "after-hours";
    }

    return {
        market,
        serverTime: now.toISOString(),
        exchanges: { nasdaq: market, nyse: market },
        afterHours: isAfterHours,
        earlyHours: isPreMarket,
        _mock: true,
    };
};

export const AVAILABLE_TICKERS = Object.keys(MOCK_TICKERS);
