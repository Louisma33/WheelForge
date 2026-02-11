// ─── POLYGON.IO REST CLIENT ───
// Wraps all Polygon.io API calls with error handling and response normalization

import NodeCache from "node-cache";

const POLYGON_BASE = "https://api.polygon.io";

// ─── CACHE CONFIGURATION ───
const cache = new NodeCache({ checkperiod: 60 });

const CACHE_TTL = {
    snapshot: 300,       // 5 minutes
    prevClose: 300,      // 5 minutes
    optionsChain: 300,   // 5 minutes
    history: 86400,      // 24 hours
    reference: 604800,   // 7 days
    marketStatus: 60,    // 1 minute
};

// ─── CORE FETCH HELPER ───
const polygonFetch = async (path, apiKey) => {
    const separator = path.includes("?") ? "&" : "?";
    const url = `${POLYGON_BASE}${path}${separator}apiKey=${apiKey}`;

    const res = await fetch(url);

    if (!res.ok) {
        const errorBody = await res.text().catch(() => "");
        const error = new Error(`Polygon API error: ${res.status} ${res.statusText}`);
        error.status = res.status;
        error.body = errorBody;
        throw error;
    }

    return res.json();
};

// ─── CACHED FETCH ───
const cachedFetch = async (cacheKey, ttl, fetchFn) => {
    const cached = cache.get(cacheKey);
    if (cached) return { ...cached, _cached: true };

    const data = await fetchFn();
    cache.set(cacheKey, data, ttl);
    return data;
};

// ─── STOCK ENDPOINTS ───

export const getStockSnapshot = async (ticker, apiKey) => {
    const cacheKey = `snapshot:${ticker}`;
    return cachedFetch(cacheKey, CACHE_TTL.snapshot, async () => {
        const data = await polygonFetch(
            `/v2/snapshot/locale/us/markets/stocks/tickers/${ticker.toUpperCase()}`,
            apiKey
        );
        const t = data.ticker;
        return {
            ticker: t.ticker,
            price: t.lastTrade?.p || t.prevDay?.c || 0,
            change: t.todaysChange || 0,
            changePercent: t.todaysChangePerc || 0,
            volume: t.day?.v || 0,
            open: t.day?.o || 0,
            high: t.day?.h || 0,
            low: t.day?.l || 0,
            prevClose: t.prevDay?.c || 0,
            vwap: t.day?.vw || 0,
            timestamp: t.updated ? new Date(t.updated / 1e6).toISOString() : null,
        };
    });
};

export const getPreviousClose = async (ticker, apiKey) => {
    const cacheKey = `prev:${ticker}`;
    return cachedFetch(cacheKey, CACHE_TTL.prevClose, async () => {
        const data = await polygonFetch(
            `/v2/aggs/ticker/${ticker.toUpperCase()}/prev`,
            apiKey
        );
        const result = data.results?.[0] || {};
        return {
            ticker: ticker.toUpperCase(),
            open: result.o || 0,
            high: result.h || 0,
            low: result.l || 0,
            close: result.c || 0,
            volume: result.v || 0,
            vwap: result.vw || 0,
            date: result.t ? new Date(result.t).toISOString().split("T")[0] : null,
        };
    });
};

export const getHistoricalAggregates = async (ticker, from, to, timespan = "day", multiplier = 1, apiKey) => {
    const cacheKey = `history:${ticker}:${from}:${to}:${timespan}:${multiplier}`;
    return cachedFetch(cacheKey, CACHE_TTL.history, async () => {
        const data = await polygonFetch(
            `/v2/aggs/ticker/${ticker.toUpperCase()}/range/${multiplier}/${timespan}/${from}/${to}?adjusted=true&sort=asc&limit=5000`,
            apiKey
        );
        return {
            ticker: ticker.toUpperCase(),
            count: data.resultsCount || 0,
            data: (data.results || []).map((r) => ({
                date: new Date(r.t).toISOString().split("T")[0],
                open: r.o,
                high: r.h,
                low: r.l,
                close: r.c,
                volume: r.v,
                vwap: r.vw,
                transactions: r.n,
            })),
        };
    });
};

// ─── OPTIONS ENDPOINTS ───

export const getOptionsChain = async (ticker, apiKey, params = {}) => {
    const cacheKey = `options:${ticker}:${JSON.stringify(params)}`;
    return cachedFetch(cacheKey, CACHE_TTL.optionsChain, async () => {
        let query = `?limit=250`;
        if (params.expDate) query += `&expiration_date=${params.expDate}`;
        if (params.contractType) query += `&contract_type=${params.contractType}`;
        if (params.strikePrice) query += `&strike_price=${params.strikePrice}`;
        if (params.order) query += `&order=${params.order}`;

        const data = await polygonFetch(
            `/v3/snapshot/options/${ticker.toUpperCase()}${query}`,
            apiKey
        );

        return {
            ticker: ticker.toUpperCase(),
            contracts: (data.results || []).map((c) => ({
                contractTicker: c.details?.ticker || "",
                strikePrice: c.details?.strike_price || 0,
                expirationDate: c.details?.expiration_date || "",
                contractType: c.details?.contract_type || "",
                // Pricing
                bid: c.last_quote?.bid || 0,
                ask: c.last_quote?.ask || 0,
                midpoint: c.last_quote?.midpoint || 0,
                lastPrice: c.last_trade?.price || 0,
                // Greeks
                delta: c.greeks?.delta || 0,
                gamma: c.greeks?.gamma || 0,
                theta: c.greeks?.theta || 0,
                vega: c.greeks?.vega || 0,
                // IV & Volume
                impliedVolatility: c.implied_volatility || 0,
                openInterest: c.open_interest || 0,
                volume: c.day?.volume || 0,
                // Underlying
                underlyingPrice: c.underlying_asset?.price || 0,
            })),
        };
    });
};

export const getOptionsContract = async (contractTicker, apiKey) => {
    const cacheKey = `contract:${contractTicker}`;
    return cachedFetch(cacheKey, CACHE_TTL.optionsChain, async () => {
        const data = await polygonFetch(
            `/v3/snapshot/options/${contractTicker.toUpperCase()}`,
            apiKey
        );
        const c = data.results;
        if (!c) throw new Error("Contract not found");
        return {
            contractTicker: c.details?.ticker || "",
            strikePrice: c.details?.strike_price || 0,
            expirationDate: c.details?.expiration_date || "",
            contractType: c.details?.contract_type || "",
            bid: c.last_quote?.bid || 0,
            ask: c.last_quote?.ask || 0,
            lastPrice: c.last_trade?.price || 0,
            delta: c.greeks?.delta || 0,
            gamma: c.greeks?.gamma || 0,
            theta: c.greeks?.theta || 0,
            vega: c.greeks?.vega || 0,
            impliedVolatility: c.implied_volatility || 0,
            openInterest: c.open_interest || 0,
            volume: c.day?.volume || 0,
            underlyingPrice: c.underlying_asset?.price || 0,
        };
    });
};

// ─── REFERENCE DATA ENDPOINTS ───

export const searchTickers = async (query, apiKey, limit = 20) => {
    const cacheKey = `search:${query.toLowerCase()}`;
    return cachedFetch(cacheKey, CACHE_TTL.reference, async () => {
        const data = await polygonFetch(
            `/v3/reference/tickers?search=${encodeURIComponent(query)}&active=true&limit=${limit}&market=stocks`,
            apiKey
        );
        return {
            results: (data.results || []).map((t) => ({
                ticker: t.ticker,
                name: t.name,
                market: t.market,
                type: t.type,
                primaryExchange: t.primary_exchange,
                currencyName: t.currency_name,
            })),
        };
    });
};

export const getTickerDetails = async (ticker, apiKey) => {
    const cacheKey = `details:${ticker}`;
    return cachedFetch(cacheKey, CACHE_TTL.reference, async () => {
        const data = await polygonFetch(
            `/v3/reference/tickers/${ticker.toUpperCase()}`,
            apiKey
        );
        const r = data.results || {};
        return {
            ticker: r.ticker,
            name: r.name,
            description: r.description || "",
            market: r.market,
            type: r.type,
            primaryExchange: r.primary_exchange,
            marketCap: r.market_cap || 0,
            shareClassSharesOutstanding: r.share_class_shares_outstanding || 0,
            sicDescription: r.sic_description || "",
            homepageUrl: r.homepage_url || "",
            logoUrl: r.branding?.icon_url
                ? `${r.branding.icon_url}?apiKey=${apiKey}`
                : null,
            listDate: r.list_date || "",
        };
    });
};

// ─── MARKET STATUS ───

export const getMarketStatus = async (apiKey) => {
    const cacheKey = "market:status";
    return cachedFetch(cacheKey, CACHE_TTL.marketStatus, async () => {
        const data = await polygonFetch("/v1/marketstatus/now", apiKey);
        return {
            market: data.market || "closed",
            serverTime: data.serverTime || "",
            exchanges: data.exchanges || {},
            afterHours: data.afterHours || false,
            earlyHours: data.earlyHours || false,
        };
    });
};

// ─── CACHE MANAGEMENT ───

export const flushCache = (pattern) => {
    if (pattern) {
        const keys = cache.keys().filter((k) => k.startsWith(pattern));
        keys.forEach((k) => cache.del(k));
        return keys.length;
    }
    cache.flushAll();
    return cache.keys().length;
};

export const getCacheStats = () => ({
    keys: cache.keys().length,
    hits: cache.getStats().hits,
    misses: cache.getStats().misses,
    ksize: cache.getStats().ksize,
    vsize: cache.getStats().vsize,
});
