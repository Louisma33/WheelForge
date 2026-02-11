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
