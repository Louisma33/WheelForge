// ─── MARKET OVERVIEW VIEW ───
// Watchlist, market status, trending tickers, wheel-worthy scanner

import { useState, useMemo } from "react";
import { TrendingUp, Plus, X, Star, Activity, BarChart3, Eye, Zap } from "lucide-react";
import MarketStatusBadge from "../components/MarketStatusBadge";
import LivePriceTicker from "../components/LivePriceTicker";
import { useMarketStatus, useBatchSnapshots } from "../services/marketDataHooks";
import {
    GOLD, GOLD_LIGHT, GREEN, RED, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED,
    DARK_BG, DARK_CARD, DARK_SURFACE, DARK_BORDER, AMBER, BLUE, PURPLE, VIOLET,
    monoFont, sansFont, cardStyle,
} from "../constants";

const DEFAULT_WATCHLIST = ["SPY", "AAPL", "TSLA", "MSFT", "NVDA", "AMD", "AMZN", "META"];

export default function MarketOverviewView({ onSelectTicker }) {
    const [watchlist, setWatchlist] = useState(DEFAULT_WATCHLIST);
    const [newTicker, setNewTicker] = useState("");
    const [sortBy, setSortBy] = useState("ticker");
    const [sortDir, setSortDir] = useState("asc");

    const { status, isOpen, isPreMarket, isAfterHours } = useMarketStatus(30000);
    const { data: snapshots, loading } = useBatchSnapshots(watchlist, 60000);

    // Sort snapshots
    const sortedSnapshots = useMemo(() => {
        if (!snapshots?.length) return [];
        return [...snapshots].sort((a, b) => {
            let aVal = a[sortBy], bVal = b[sortBy];
            if (sortBy === "ticker") return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
            return sortDir === "asc" ? aVal - bVal : bVal - aVal;
        });
    }, [snapshots, sortBy, sortDir]);

    // Top movers
    const topMovers = useMemo(() => {
        if (!snapshots?.length) return [];
        return [...snapshots]
            .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
            .slice(0, 4);
    }, [snapshots]);

    const addTicker = () => {
        const t = newTicker.trim().toUpperCase();
        if (t && !watchlist.includes(t)) {
            setWatchlist([...watchlist, t]);
        }
        setNewTicker("");
    };

    const removeTicker = (t) => {
        setWatchlist(watchlist.filter((w) => w !== t));
    };

    const toggleSort = (col) => {
        if (sortBy === col) setSortDir((d) => d === "asc" ? "desc" : "asc");
        else { setSortBy(col); setSortDir("asc"); }
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                <div>
                    <h2 style={{ fontFamily: sansFont, fontSize: 22, fontWeight: 700, color: TEXT_PRIMARY, margin: 0 }}>
                        <Activity size={20} style={{ marginRight: 8, color: GOLD, verticalAlign: "middle" }} />
                        Market Overview
                    </h2>
                    <p style={{ fontFamily: monoFont, fontSize: 11, color: TEXT_SECONDARY, margin: "4px 0 0 0" }}>
                        15-minute delayed quotes • Updated every 60s
                    </p>
                </div>
                <MarketStatusBadge status={status?.market || "closed"} />
            </div>

            {/* Top Movers Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
                {topMovers.map((snap) => (
                    <div
                        key={snap.ticker}
                        onClick={() => onSelectTicker?.(snap.ticker)}
                        style={{
                            ...cardStyle, padding: 16, cursor: "pointer",
                            borderLeft: `3px solid ${snap.changePercent >= 0 ? GREEN : RED}`,
                            transition: "transform 0.2s, box-shadow 0.2s",
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 8px 25px rgba(0,0,0,0.3)`; }}
                        onMouseOut={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontFamily: monoFont, fontSize: 16, fontWeight: 700, color: TEXT_PRIMARY }}>
                                {snap.ticker}
                            </span>
                            <span style={{
                                fontFamily: monoFont, fontSize: 11, fontWeight: 700, padding: "2px 8px",
                                borderRadius: 6, color: snap.changePercent >= 0 ? GREEN : RED,
                                background: snap.changePercent >= 0 ? `${GREEN}15` : `${RED}15`,
                            }}>
                                {snap.changePercent >= 0 ? "▲" : "▼"} {Math.abs(snap.changePercent).toFixed(2)}%
                            </span>
                        </div>
                        <div style={{ fontFamily: monoFont, fontSize: 20, fontWeight: 700, color: TEXT_PRIMARY, marginTop: 8 }}>
                            ${snap.price?.toFixed(2)}
                        </div>
                        <div style={{ fontFamily: monoFont, fontSize: 10, color: TEXT_SECONDARY, marginTop: 4 }}>
                            Vol: {(snap.volume / 1e6).toFixed(1)}M
                        </div>
                    </div>
                ))}
            </div>

            {/* Watchlist Table */}
            <div style={{ ...cardStyle, padding: 16, overflow: "hidden" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <h3 style={{ fontFamily: sansFont, fontSize: 16, fontWeight: 700, color: GOLD, margin: 0 }}>
                        <Eye size={16} style={{ marginRight: 6, verticalAlign: "middle" }} />
                        Watchlist
                    </h3>

                    {/* Add Ticker */}
                    <div style={{ display: "flex", gap: 6 }}>
                        <input
                            type="text"
                            value={newTicker}
                            onChange={(e) => setNewTicker(e.target.value.toUpperCase())}
                            onKeyDown={(e) => e.key === "Enter" && addTicker()}
                            placeholder="Add ticker..."
                            style={{
                                padding: "5px 10px", borderRadius: 8, border: `1px solid ${DARK_BORDER}`,
                                background: DARK_SURFACE, color: TEXT_PRIMARY,
                                fontFamily: monoFont, fontSize: 12, width: 100,
                                outline: "none",
                            }}
                        />
                        <button
                            onClick={addTicker}
                            style={{
                                padding: "5px 10px", borderRadius: 8, border: `1px solid ${GOLD}44`,
                                background: `${GOLD}15`, color: GOLD, cursor: "pointer",
                                fontFamily: monoFont, fontSize: 12, fontWeight: 600,
                            }}
                        >
                            <Plus size={14} />
                        </button>
                    </div>
                </div>

                {loading && !sortedSnapshots.length ? (
                    <div style={{ padding: 40, textAlign: "center", color: TEXT_SECONDARY, fontFamily: monoFont }}>
                        Loading market data...
                    </div>
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: monoFont, fontSize: 12 }}>
                            <thead>
                                <tr>
                                    {[
                                        { key: "ticker", label: "Ticker", align: "left" },
                                        { key: "price", label: "Price" },
                                        { key: "change", label: "Change" },
                                        { key: "changePercent", label: "Change %" },
                                        { key: "volume", label: "Volume" },
                                        { key: "high", label: "High" },
                                        { key: "low", label: "Low" },
                                        { key: "actions", label: "" },
                                    ].map((col) => (
                                        <th
                                            key={col.key}
                                            onClick={() => col.key !== "actions" && toggleSort(col.key)}
                                            style={{
                                                padding: "8px 8px",
                                                textAlign: col.align || "right",
                                                cursor: col.key !== "actions" ? "pointer" : "default",
                                                color: GOLD_LIGHT, fontWeight: 600, fontSize: 10,
                                                borderBottom: `1px solid ${DARK_BORDER}`,
                                                whiteSpace: "nowrap", userSelect: "none",
                                                letterSpacing: 0.8,
                                            }}
                                        >
                                            {col.label}
                                            {sortBy === col.key && (sortDir === "asc" ? " ↑" : " ↓")}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {sortedSnapshots.map((snap) => (
                                    <tr
                                        key={snap.ticker}
                                        style={{ cursor: "pointer", transition: "background 0.15s" }}
                                        onMouseOver={(e) => e.currentTarget.style.background = `${GOLD}10`}
                                        onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
                                    >
                                        <td
                                            onClick={() => onSelectTicker?.(snap.ticker)}
                                            style={{
                                                padding: "10px 8px", textAlign: "left",
                                                fontWeight: 700, color: TEXT_PRIMARY, fontSize: 14,
                                                borderBottom: `1px solid ${DARK_BORDER}33`,
                                            }}
                                        >
                                            {snap.ticker}
                                        </td>
                                        <td onClick={() => onSelectTicker?.(snap.ticker)} style={{ padding: "10px 8px", textAlign: "right", fontWeight: 600, color: TEXT_PRIMARY, borderBottom: `1px solid ${DARK_BORDER}33` }}>
                                            ${snap.price?.toFixed(2)}
                                        </td>
                                        <td onClick={() => onSelectTicker?.(snap.ticker)} style={{
                                            padding: "10px 8px", textAlign: "right", fontWeight: 600,
                                            color: snap.change >= 0 ? GREEN : RED,
                                            borderBottom: `1px solid ${DARK_BORDER}33`,
                                        }}>
                                            {snap.change >= 0 ? "+" : ""}{snap.change?.toFixed(2)}
                                        </td>
                                        <td onClick={() => onSelectTicker?.(snap.ticker)} style={{
                                            padding: "10px 8px", textAlign: "right",
                                            borderBottom: `1px solid ${DARK_BORDER}33`,
                                        }}>
                                            <span style={{
                                                padding: "2px 8px", borderRadius: 6, fontWeight: 700, fontSize: 11,
                                                color: snap.changePercent >= 0 ? GREEN : RED,
                                                background: snap.changePercent >= 0 ? `${GREEN}12` : `${RED}12`,
                                            }}>
                                                {snap.changePercent >= 0 ? "+" : ""}{snap.changePercent?.toFixed(2)}%
                                            </span>
                                        </td>
                                        <td onClick={() => onSelectTicker?.(snap.ticker)} style={{ padding: "10px 8px", textAlign: "right", color: TEXT_MUTED, borderBottom: `1px solid ${DARK_BORDER}33` }}>
                                            {(snap.volume / 1e6).toFixed(1)}M
                                        </td>
                                        <td onClick={() => onSelectTicker?.(snap.ticker)} style={{ padding: "10px 8px", textAlign: "right", color: TEXT_MUTED, borderBottom: `1px solid ${DARK_BORDER}33` }}>
                                            ${snap.high?.toFixed(2)}
                                        </td>
                                        <td onClick={() => onSelectTicker?.(snap.ticker)} style={{ padding: "10px 8px", textAlign: "right", color: TEXT_MUTED, borderBottom: `1px solid ${DARK_BORDER}33` }}>
                                            ${snap.low?.toFixed(2)}
                                        </td>
                                        <td style={{ padding: "10px 4px", textAlign: "center", borderBottom: `1px solid ${DARK_BORDER}33` }}>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); removeTicker(snap.ticker); }}
                                                style={{
                                                    background: "transparent", border: "none", cursor: "pointer",
                                                    color: TEXT_SECONDARY, padding: 2, lineHeight: 1, opacity: 0.5,
                                                    transition: "opacity 0.15s",
                                                }}
                                                onMouseOver={(e) => e.currentTarget.style.opacity = "1"}
                                                onMouseOut={(e) => e.currentTarget.style.opacity = "0.5"}
                                                title="Remove from watchlist"
                                            >
                                                <X size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Data Source Note */}
            <div style={{
                fontFamily: monoFont, fontSize: 10, color: TEXT_SECONDARY,
                textAlign: "center", opacity: 0.6, padding: 8,
            }}>
                {snapshots?.[0]?._mock && "📊 Using simulated data — connect Polygon.io API for live quotes"}
            </div>
        </div>
    );
}
