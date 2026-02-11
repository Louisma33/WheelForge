// ─── MARKET DATA REACT HOOKS ───
// Custom hooks for fetching and caching market data in components

import { useState, useEffect, useCallback, useRef } from "react";
import {
    fetchStockSnapshot,
    fetchStockHistory,
    fetchOptionsChain,
    fetchOptionsExpirations,
    searchTickers as searchTickersApi,
    fetchTickerDetails,
    fetchMarketStatus,
    fetchBatchSnapshots,
    fetchHistoryForRange,
} from "./polygonApi.js";

// ─── GENERIC FETCH HOOK ───
const useFetch = (fetchFn, deps = [], enabled = true) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;
        return () => { mountedRef.current = false; };
    }, []);

    const refetch = useCallback(async () => {
        if (!enabled) return;
        setLoading(true);
        setError(null);
        try {
            const result = await fetchFn();
            if (mountedRef.current) {
                setData(result);
                setLoading(false);
            }
        } catch (err) {
            if (mountedRef.current) {
                setError(err.message);
                setLoading(false);
            }
        }
    }, [fetchFn, enabled]);

    useEffect(() => {
        refetch();
    }, [...deps, refetch]);

    return { data, loading, error, refetch };
};

// ─── STOCK SNAPSHOT ───
export const useStockSnapshot = (ticker) => {
    const fetchFn = useCallback(() => fetchStockSnapshot(ticker), [ticker]);
    return useFetch(fetchFn, [ticker], !!ticker);
};

// ─── STOCK HISTORY ───
export const useStockHistory = (ticker, range = "1Y") => {
    const fetchFn = useCallback(() => fetchHistoryForRange(ticker, range), [ticker, range]);
    return useFetch(fetchFn, [ticker, range], !!ticker);
};

// ─── OPTIONS CHAIN ───
export const useOptionsChain = (ticker, expDate = null, contractType = null) => {
    const fetchFn = useCallback(
        () => fetchOptionsChain(ticker, { expDate, contractType }),
        [ticker, expDate, contractType]
    );
    return useFetch(fetchFn, [ticker, expDate, contractType], !!ticker);
};

// ─── OPTIONS EXPIRATIONS ───
export const useOptionsExpirations = (ticker) => {
    const fetchFn = useCallback(() => fetchOptionsExpirations(ticker), [ticker]);
    return useFetch(fetchFn, [ticker], !!ticker);
};

// ─── TICKER SEARCH ───
export const useTickerSearch = (query) => {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const debounceRef = useRef(null);

    useEffect(() => {
        if (!query || query.length < 1) {
            setResults([]);
            return;
        }

        setLoading(true);
        if (debounceRef.current) clearTimeout(debounceRef.current);

        debounceRef.current = setTimeout(async () => {
            try {
                const data = await searchTickersApi(query);
                setResults(data.results || []);
            } catch {
                setResults([]);
            }
            setLoading(false);
        }, 300);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [query]);

    return { results, loading };
};

// ─── TICKER DETAILS ───
export const useTickerDetails = (ticker) => {
    const fetchFn = useCallback(() => fetchTickerDetails(ticker), [ticker]);
    return useFetch(fetchFn, [ticker], !!ticker);
};

// ─── MARKET STATUS ───
export const useMarketStatus = (pollInterval = 60000) => {
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        const poll = async () => {
            try {
                const data = await fetchMarketStatus();
                if (mounted) {
                    setStatus(data);
                    setLoading(false);
                }
            } catch {
                if (mounted) setLoading(false);
            }
        };

        poll();
        const interval = setInterval(poll, pollInterval);
        return () => { mounted = false; clearInterval(interval); };
    }, [pollInterval]);

    return {
        status,
        loading,
        isOpen: status?.market === "open",
        isPreMarket: status?.market === "pre-market",
        isAfterHours: status?.market === "after-hours",
        isClosed: !status || status.market === "closed",
    };
};

// ─── BATCH SNAPSHOTS (Watchlist) ───
export const useBatchSnapshots = (tickers = [], pollInterval = 300000) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!tickers.length) { setData([]); setLoading(false); return; }

        let mounted = true;
        const fetch = async () => {
            try {
                const results = await fetchBatchSnapshots(tickers);
                if (mounted) {
                    setData(results);
                    setLoading(false);
                }
            } catch {
                if (mounted) setLoading(false);
            }
        };

        fetch();
        const interval = setInterval(fetch, pollInterval);
        return () => { mounted = false; clearInterval(interval); };
    }, [tickers.join(","), pollInterval]);

    return { data, loading };
};

// ─── AUTO-REFRESHING PRICE ───
export const useLivePrice = (ticker, refreshInterval = 60000) => {
    const [price, setPrice] = useState(null);
    const [change, setChange] = useState(null);
    const [changePercent, setChangePercent] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!ticker) return;
        let mounted = true;

        const poll = async () => {
            try {
                const snap = await fetchStockSnapshot(ticker);
                if (mounted) {
                    setPrice(snap.price);
                    setChange(snap.change);
                    setChangePercent(snap.changePercent);
                    setLoading(false);
                }
            } catch {
                if (mounted) setLoading(false);
            }
        };

        poll();
        const interval = setInterval(poll, refreshInterval);
        return () => { mounted = false; clearInterval(interval); };
    }, [ticker, refreshInterval]);

    return { price, change, changePercent, loading };
};
