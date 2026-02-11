// ─── OPTIONS CHAIN VIEW ───
// Full options chain browser with filtering, Greeks, and wheel simulation integration

import { useState, useMemo } from "react";
import { ArrowLeft, Layers, Filter, Zap, TrendingUp } from "lucide-react";
import OptionsChainTable from "../components/OptionsChainTable";
import LivePriceTicker from "../components/LivePriceTicker";
import { useOptionsChain, useStockSnapshot, useOptionsExpirations } from "../services/marketDataHooks";
import { TICKER_CONFIGS, TICKERS } from "../engine";
import {
    GOLD, GOLD_LIGHT, GREEN, RED, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED,
    DARK_BG, DARK_CARD, DARK_SURFACE, DARK_BORDER, AMBER, BLUE, PURPLE, VIOLET,
    monoFont, sansFont, cardStyle,
} from "../constants";

export default function OptionsChainView({ initialTicker = "SPY", onSimulate, onBack }) {
    const [ticker, setTicker] = useState(initialTicker);
    const [searchQuery, setSearchQuery] = useState("");

    const { data: snapshot } = useStockSnapshot(ticker);
    const { data: optionsData, loading } = useOptionsChain(ticker);

    // Quick ticker selector
    const availableTickers = useMemo(() => {
        const q = searchQuery.toUpperCase();
        if (!q) return TICKERS;
        return TICKERS.filter((t) => t.includes(q) || TICKER_CONFIGS[t]?.name?.toUpperCase().includes(q));
    }, [searchQuery]);

    // Best wheel candidates from the chain
    const wheelCandidates = useMemo(() => {
        if (!optionsData?.contracts?.length || !snapshot?.price) return [];

        const puts = optionsData.contracts.filter(
            (c) => c.contractType === "put" && c.strikePrice < snapshot.price
        );

        // Score by: high premium relative to risk, reasonable delta, good IV
        return puts
            .filter((c) => c.delta > -0.4 && c.delta < -0.1 && c.bid > 0)
            .map((c) => ({
                ...c,
                otmPercent: ((snapshot.price - c.strikePrice) / snapshot.price * 100).toFixed(1),
                annualizedReturn: (c.bid / c.strikePrice * 365 /
                    Math.max(1, Math.round((new Date(c.expirationDate) - new Date()) / 86400000)) * 100).toFixed(1),
                dte: Math.max(1, Math.round((new Date(c.expirationDate) - new Date()) / 86400000)),
            }))
            .sort((a, b) => parseFloat(b.annualizedReturn) - parseFloat(a.annualizedReturn))
            .slice(0, 5);
    }, [optionsData, snapshot]);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                <div>
                    <h2 style={{ fontFamily: sansFont, fontSize: 22, fontWeight: 700, color: TEXT_PRIMARY, margin: 0 }}>
                        <Layers size={20} style={{ marginRight: 8, color: GOLD, verticalAlign: "middle" }} />
                        Options Chain
                    </h2>
                    <p style={{ fontFamily: monoFont, fontSize: 11, color: TEXT_SECONDARY, margin: "4px 0 0 0" }}>
                        Browse strikes, expirations, Greeks, and premiums
                    </p>
                </div>
                {onBack && (
                    <button
                        onClick={onBack}
                        style={{
                            display: "flex", alignItems: "center", gap: 6,
                            background: "transparent", border: `1px solid ${DARK_BORDER}`,
                            color: TEXT_SECONDARY, fontFamily: monoFont, fontSize: 12,
                            padding: "6px 14px", borderRadius: 8, cursor: "pointer",
                        }}
                    >
                        <ArrowLeft size={14} /> Back
                    </button>
                )}
            </div>

            {/* Ticker Selector */}
            <div style={{ ...cardStyle, padding: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {TICKERS.map((t) => (
                            <button
                                key={t}
                                onClick={() => setTicker(t)}
                                style={{
                                    padding: "6px 14px", borderRadius: 8,
                                    fontFamily: monoFont, fontSize: 12, fontWeight: 700,
                                    cursor: "pointer", transition: "all 0.2s",
                                    background: t === ticker ? `${GOLD}22` : `${DARK_SURFACE}`,
                                    color: t === ticker ? GOLD : TEXT_SECONDARY,
                                    border: `1px solid ${t === ticker ? `${GOLD}44` : "transparent"}`,
                                }}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                    <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ fontFamily: monoFont, fontSize: 14, fontWeight: 700, color: TEXT_PRIMARY }}>
                            {ticker}
                        </span>
                        <LivePriceTicker ticker={ticker} size="md" />
                    </div>
                </div>
            </div>

            {/* Wheel Candidates */}
            {wheelCandidates.length > 0 && (
                <div style={{ ...cardStyle, padding: 16 }}>
                    <h3 style={{ fontFamily: sansFont, fontSize: 14, fontWeight: 700, color: GOLD, margin: "0 0 12px 0" }}>
                        <Zap size={14} style={{ marginRight: 6, verticalAlign: "middle" }} />
                        Top Wheel Candidates (Cash-Secured Puts)
                    </h3>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 }}>
                        {wheelCandidates.map((c, i) => (
                            <div
                                key={c.contractTicker || i}
                                onClick={() => onSimulate?.(ticker, snapshot?.price, {
                                    strike: c.strikePrice,
                                    expDate: c.expirationDate,
                                    premium: c.bid,
                                    iv: c.impliedVolatility,
                                    contractType: "put",
                                })}
                                style={{
                                    padding: 14, borderRadius: 12, cursor: "pointer",
                                    background: `linear-gradient(135deg, ${DARK_SURFACE}, ${DARK_CARD})`,
                                    border: `1px solid ${i === 0 ? `${GOLD}44` : `${DARK_BORDER}`}`,
                                    transition: "all 0.2s",
                                }}
                                onMouseOver={(e) => { e.currentTarget.style.borderColor = `${GOLD}66`; e.currentTarget.style.transform = "translateY(-2px)"; }}
                                onMouseOut={(e) => { e.currentTarget.style.borderColor = i === 0 ? `${GOLD}44` : DARK_BORDER; e.currentTarget.style.transform = "none"; }}
                            >
                                {i === 0 && (
                                    <div style={{ fontFamily: monoFont, fontSize: 9, color: GOLD, fontWeight: 700, letterSpacing: 1, marginBottom: 6 }}>
                                        ⭐ BEST VALUE
                                    </div>
                                )}
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <span style={{ fontFamily: monoFont, fontSize: 15, fontWeight: 700, color: TEXT_PRIMARY }}>
                                        ${c.strikePrice.toFixed(2)}
                                    </span>
                                    <span style={{
                                        fontFamily: monoFont, fontSize: 11, fontWeight: 700, color: GREEN,
                                        padding: "2px 6px", borderRadius: 4, background: `${GREEN}15`,
                                    }}>
                                        {c.annualizedReturn}% ann.
                                    </span>
                                </div>
                                <div style={{ fontFamily: monoFont, fontSize: 10, color: TEXT_SECONDARY, marginTop: 6, display: "flex", gap: 10 }}>
                                    <span>Bid: ${c.bid.toFixed(2)}</span>
                                    <span>Δ {c.delta.toFixed(3)}</span>
                                    <span>{c.otmPercent}% OTM</span>
                                    <span>{c.dte}d</span>
                                </div>
                                <div style={{ fontFamily: monoFont, fontSize: 10, color: TEXT_MUTED, marginTop: 4 }}>
                                    IV: {(c.impliedVolatility * 100).toFixed(1)}% • Vol: {c.volume.toLocaleString()} • OI: {c.openInterest.toLocaleString()}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Full Options Chain */}
            {loading ? (
                <div style={{ ...cardStyle, padding: 60, textAlign: "center" }}>
                    <span style={{ fontFamily: monoFont, fontSize: 13, color: TEXT_SECONDARY }}>Loading options chain...</span>
                </div>
            ) : optionsData?.contracts?.length > 0 ? (
                <OptionsChainTable
                    contracts={optionsData.contracts}
                    underlyingPrice={snapshot?.price}
                    onSelectContract={(c) => onSimulate?.(ticker, snapshot?.price, {
                        strike: c.strikePrice,
                        expDate: c.expirationDate,
                        premium: c.midpoint || c.bid,
                        iv: c.impliedVolatility,
                        contractType: c.contractType,
                    })}
                />
            ) : (
                <div style={{ ...cardStyle, padding: 60, textAlign: "center" }}>
                    <span style={{ fontFamily: monoFont, fontSize: 13, color: TEXT_SECONDARY }}>No options data available for {ticker}</span>
                </div>
            )}

            {/* Data Source Notice */}
            {optionsData?._mock && (
                <div style={{
                    fontFamily: monoFont, fontSize: 10, color: TEXT_SECONDARY,
                    textAlign: "center", opacity: 0.5, padding: 8,
                }}>
                    📊 Simulated options data — connect Polygon.io for live chains
                </div>
            )}
        </div>
    );
}
