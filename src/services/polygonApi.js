// ─── POLYGON API CLIENT ───
// Centralized client for all backend proxy calls
// All Polygon data flows through the backend — no API keys on the client

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api";

// ─── CORE FETCH HELPER ───
const apiFetch = async (path, options = {}) => {
    const url = `${API_BASE}${path}`;
    try {
        const res = await fetch(url, {
            headers: { "Content-Type": "application/json" },
            ...options,
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error || "API error");
        return json.data;
    } catch (err) {
        console.warn(`[API] ${path} failed:`, err.message);
        throw err;
    }
};

// ─── STOCK DATA ───

export const fetchStockSnapshot = (ticker) =>
    apiFetch(`/stocks/${ticker.toUpperCase()}/snapshot`);

export const fetchPreviousClose = (ticker) =>
    apiFetch(`/stocks/${ticker.toUpperCase()}/prev-close`);

export const fetchStockHistory = (ticker, { from, to, timespan = "day", multiplier = 1 } = {}) => {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (timespan) params.set("timespan", timespan);
    if (multiplier) params.set("multiplier", multiplier);
    const query = params.toString() ? `?${params}` : "";
    return apiFetch(`/stocks/${ticker.toUpperCase()}/history${query}`);
};

export const fetchBatchSnapshots = (tickers) =>
    apiFetch(`/stocks/batch/snapshots?tickers=${tickers.join(",")}`);

// ─── OPTIONS DATA ───

export const fetchOptionsChain = (ticker, { expDate, contractType } = {}) => {
    const params = new URLSearchParams();
    if (expDate) params.set("expDate", expDate);
    if (contractType) params.set("contractType", contractType);
    const query = params.toString() ? `?${params}` : "";
    return apiFetch(`/options/${ticker.toUpperCase()}/chain${query}`);
};

export const fetchOptionsExpirations = (ticker) =>
    apiFetch(`/options/${ticker.toUpperCase()}/expirations`);

export const fetchOptionsContract = (contractTicker) =>
    apiFetch(`/options/contract/${contractTicker}`);

// ─── SEARCH & REFERENCE ───

export const searchTickers = (query, limit = 20) =>
    apiFetch(`/search?q=${encodeURIComponent(query)}&limit=${limit}`);

export const fetchTickerDetails = (ticker) =>
    apiFetch(`/ticker/${ticker.toUpperCase()}/details`);

export const fetchMarketStatus = () =>
    apiFetch("/market/status");

// ─── AI (Proxied) ───

export const sendAiChat = (systemPrompt, userMessage, maxTokens = 1000) =>
    apiFetch("/ai/chat", {
        method: "POST",
        body: JSON.stringify({ systemPrompt, userMessage, maxTokens }),
    });

// ─── HEALTH CHECK ───

export const checkApiHealth = () => apiFetch("/health");

// ─── DERIVED HELPERS ───

export const fetchTickerFullData = async (ticker) => {
    const [snapshot, details] = await Promise.all([
        fetchStockSnapshot(ticker).catch(() => null),
        fetchTickerDetails(ticker).catch(() => null),
    ]);
    return { snapshot, details };
};

// Date range helpers
const formatDate = (d) => d.toISOString().split("T")[0];
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return formatDate(d); };
const today = () => formatDate(new Date());

export const RANGES = {
    "1D": { from: () => daysAgo(1), to: today, timespan: "minute", multiplier: 5 },
    "1W": { from: () => daysAgo(7), to: today, timespan: "hour", multiplier: 1 },
    "1M": { from: () => daysAgo(30), to: today, timespan: "day", multiplier: 1 },
    "3M": { from: () => daysAgo(90), to: today, timespan: "day", multiplier: 1 },
    "1Y": { from: () => daysAgo(365), to: today, timespan: "day", multiplier: 1 },
    "5Y": { from: () => daysAgo(1825), to: today, timespan: "week", multiplier: 1 },
};

export const fetchHistoryForRange = (ticker, range = "1Y") => {
    const r = RANGES[range] || RANGES["1Y"];
    return fetchStockHistory(ticker, {
        from: r.from(),
        to: r.to(),
        timespan: r.timespan,
        multiplier: r.multiplier,
    });
};
