// ─── TICKER DETAIL VIEW ───
// Price chart, key stats, options preview, and "Simulate This Ticker" CTA

import { useState, useMemo } from "react";
import {
    ArrowLeft, TrendingUp, BarChart3, DollarSign,
    Activity, Layers, Play, Star, ExternalLink,
} from "lucide-react";
import PriceChart from "../components/PriceChart";
import OptionsChainTable from "../components/OptionsChainTable";
import LivePriceTicker from "../components/LivePriceTicker";
import MarketStatusBadge from "../components/MarketStatusBadge";
import { useStockSnapshot, useTickerDetails, useOptionsChain, useMarketStatus } from "../services/marketDataHooks";
import {
    GOLD, GOLD_LIGHT, GREEN, RED, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED,
    DARK_BG, DARK_CARD, DARK_SURFACE, DARK_BORDER, AMBER, BLUE, PURPLE, VIOLET,
    monoFont, sansFont, cardStyle,
} from "../constants";

export default function TickerDetailView({ ticker, onBack, onSimulate }) {
    const { data: snapshot, loading: snapLoading } = useStockSnapshot(ticker);
    const { data: details, loading: detailsLoading } = useTickerDetails(ticker);
    const { data: optionsData } = useOptionsChain(ticker);
    const { status } = useMarketStatus(60000);
    const [showFullChain, setShowFullChain] = useState(false);

    // Key stats
    const stats = useMemo(() => {
        if (!snapshot && !details) return [];
        return [
            { label: "Open", value: snapshot ? `$${snapshot.open?.toFixed(2)}` : "—", icon: "📈" },
            { label: "Prev Close", value: snapshot ? `$${snapshot.prevClose?.toFixed(2)}` : "—", icon: "📊" },
            { label: "Day High", value: snapshot ? `$${snapshot.high?.toFixed(2)}` : "—", icon: "🔺" },
            { label: "Day Low", value: snapshot ? `$${snapshot.low?.toFixed(2)}` : "—", icon: "🔻" },
            { label: "Volume", value: snapshot ? `${(snapshot.volume / 1e6).toFixed(1)}M` : "—", icon: "📉" },
            { label: "VWAP", value: snapshot ? `$${snapshot.vwap?.toFixed(2)}` : "—", icon: "⚖️" },
            { label: "Market Cap", value: details?.marketCap ? `$${(details.marketCap / 1e12).toFixed(2)}T` : "—", icon: "🏛️" },
            { label: "Sector", value: details?.sicDescription || "—", icon: "🏷️" },
        ];
    }, [snapshot, details]);

    // Options summary
    const optionsSummary = useMemo(() => {
        if (!optionsData?.contracts?.length) return null;
        const puts = optionsData.contracts.filter((c) => c.contractType === "put");
        const calls = optionsData.contracts.filter((c) => c.contractType === "call");
        const avgIV = optionsData.contracts.reduce((sum, c) => sum + c.impliedVolatility, 0) / optionsData.contracts.length;
        const atmPuts = puts.filter((c) => Math.abs(c.strikePrice - (snapshot?.price || 0)) < (snapshot?.price * 0.02));
        const bestPutPremium = atmPuts.length > 0 ? Math.max(...atmPuts.map((c) => c.midpoint || c.bid)) : 0;

        return {
            putCount: puts.length,
            callCount: calls.length,
            avgIV: (avgIV * 100).toFixed(1),
            putCallRatio: calls.length > 0 ? (puts.length / calls.length).toFixed(2) : "—",
            bestPutPremium: bestPutPremium.toFixed(2),
            expirations: [...new Set(optionsData.contracts.map((c) => c.expirationDate))].length,
        };
    }, [optionsData, snapshot]);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Navigation */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                <button
                    onClick={onBack}
                    style={{
                        display: "flex", alignItems: "center", gap: 6,
                        background: "transparent", border: `1px solid ${DARK_BORDER}`,
                        color: TEXT_SECONDARY, fontFamily: monoFont, fontSize: 12,
                        padding: "6px 14px", borderRadius: 8, cursor: "pointer",
                        transition: "all 0.2s",
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.color = GOLD; }}
                    onMouseOut={(e) => { e.currentTarget.style.borderColor = DARK_BORDER; e.currentTarget.style.color = TEXT_SECONDARY; }}
                >
                    <ArrowLeft size={14} /> Back to Market
                </button>
                <MarketStatusBadge status={status?.market || "closed"} />
            </div>

            {/* Ticker Header */}
            <div style={{ ...cardStyle, padding: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
                    <div>
                        <h1 style={{ fontFamily: sansFont, fontSize: 28, fontWeight: 800, color: TEXT_PRIMARY, margin: 0 }}>
                            {ticker}
                        </h1>
                        <p style={{ fontFamily: sansFont, fontSize: 14, color: TEXT_SECONDARY, margin: "4px 0 0 0" }}>
                            {details?.name || "Loading..."}
                            {details?.primaryExchange && (
                                <span style={{ color: TEXT_MUTED, marginLeft: 8, fontSize: 11 }}>
                                    · {details.primaryExchange}
                                </span>
                            )}
                        </p>
                        <div style={{ marginTop: 12 }}>
                            <LivePriceTicker ticker={ticker} size="xl" />
                        </div>
                    </div>

                    {/* Simulate CTA */}
                    <button
                        onClick={() => onSimulate?.(ticker, snapshot?.price)}
                        style={{
                            display: "flex", alignItems: "center", gap: 8,
                            padding: "12px 24px", borderRadius: 12,
                            background: `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT})`,
                            border: "none", cursor: "pointer",
                            fontFamily: sansFont, fontSize: 14, fontWeight: 700,
                            color: "#0a0a1a",
                            boxShadow: `0 4px 15px ${GOLD}40`,
                            transition: "transform 0.2s, box-shadow 0.2s",
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 6px 20px ${GOLD}60`; }}
                        onMouseOut={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = `0 4px 15px ${GOLD}40`; }}
                    >
                        <Play size={16} fill="#0a0a1a" />
                        Simulate Wheel
                    </button>
                </div>
            </div>

            {/* Price Chart */}
            <PriceChart ticker={ticker} defaultRange="3M" height={320} />

            {/* Key Stats Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
                {stats.map((stat) => (
                    <div key={stat.label} style={{
                        ...cardStyle, padding: 14,
                        display: "flex", alignItems: "center", gap: 10,
                    }}>
                        <span style={{ fontSize: 18 }}>{stat.icon}</span>
                        <div>
                            <div style={{ fontFamily: monoFont, fontSize: 10, color: TEXT_SECONDARY, letterSpacing: 0.5 }}>
                                {stat.label}
                            </div>
                            <div style={{ fontFamily: monoFont, fontSize: 15, fontWeight: 700, color: TEXT_PRIMARY, marginTop: 2 }}>
                                {stat.value}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Options Summary */}
            {optionsSummary && (
                <div style={{ ...cardStyle, padding: 20 }}>
                    <h3 style={{ fontFamily: sansFont, fontSize: 16, fontWeight: 700, color: GOLD, margin: "0 0 14px 0" }}>
                        <Layers size={16} style={{ marginRight: 6, verticalAlign: "middle" }} />
                        Options Overview
                    </h3>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 12 }}>
                        {[
                            { label: "Avg IV", value: `${optionsSummary.avgIV}%`, color: PURPLE },
                            { label: "Put/Call Ratio", value: optionsSummary.putCallRatio, color: AMBER },
                            { label: "ATM Put Premium", value: `$${optionsSummary.bestPutPremium}`, color: GREEN },
                            { label: "Expirations", value: optionsSummary.expirations, color: BLUE },
                            { label: "Puts Available", value: optionsSummary.putCount, color: RED },
                            { label: "Calls Available", value: optionsSummary.callCount, color: GREEN },
                        ].map((item) => (
                            <div key={item.label} style={{
                                padding: "10px 12px", borderRadius: 10,
                                background: `${item.color}08`,
                                border: `1px solid ${item.color}20`,
                            }}>
                                <div style={{ fontFamily: monoFont, fontSize: 10, color: TEXT_SECONDARY }}>
                                    {item.label}
                                </div>
                                <div style={{ fontFamily: monoFont, fontSize: 18, fontWeight: 700, color: item.color, marginTop: 4 }}>
                                    {item.value}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Options Chain Preview */}
            {optionsData?.contracts?.length > 0 && (
                <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                        <h3 style={{ fontFamily: sansFont, fontSize: 16, fontWeight: 700, color: GOLD, margin: 0 }}>
                            Options Chain
                        </h3>
                        <button
                            onClick={() => setShowFullChain(!showFullChain)}
                            style={{
                                background: "transparent", border: `1px solid ${GOLD}44`,
                                color: GOLD, fontFamily: monoFont, fontSize: 11,
                                padding: "5px 12px", borderRadius: 8, cursor: "pointer",
                            }}
                        >
                            {showFullChain ? "Show Compact" : "Show Full Chain"}
                        </button>
                    </div>
                    <OptionsChainTable
                        contracts={optionsData.contracts}
                        underlyingPrice={snapshot?.price}
                        compact={!showFullChain}
                        onSelectContract={(c) => {
                            onSimulate?.(ticker, snapshot?.price, {
                                strike: c.strikePrice,
                                expDate: c.expirationDate,
                                premium: c.midpoint || c.bid,
                                iv: c.impliedVolatility,
                                contractType: c.contractType,
                            });
                        }}
                    />
                </div>
            )}

            {/* Company Description */}
            {details?.description && (
                <div style={{ ...cardStyle, padding: 20 }}>
                    <h3 style={{ fontFamily: sansFont, fontSize: 14, fontWeight: 700, color: TEXT_SECONDARY, margin: "0 0 8px 0" }}>
                        About {details.name || ticker}
                    </h3>
                    <p style={{
                        fontFamily: sansFont, fontSize: 13, lineHeight: 1.6,
                        color: TEXT_MUTED, margin: 0,
                    }}>
                        {details.description.slice(0, 400)}
                        {details.description.length > 400 && "..."}
                    </p>
                </div>
            )}

            {/* Mock Data Notice */}
            {snapshot?._mock && (
                <div style={{
                    fontFamily: monoFont, fontSize: 10, color: TEXT_SECONDARY,
                    textAlign: "center", opacity: 0.5, padding: 8,
                }}>
                    📊 Simulated data — connect Polygon.io for live market quotes
                </div>
            )}
        </div>
    );
}
