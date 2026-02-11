import { useState, useMemo, useEffect, useCallback } from "react";
import {
    AreaChart, Area, CartesianGrid, XAxis, YAxis,
    Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { Activity, TrendingUp, Zap, RefreshCw, BarChart2 } from "lucide-react";
import {
    GOLD, cardStyle, monoFont, tooltipStyle,
    TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED,
    GREEN, RED, PURPLE, AMBER, VIOLET, BLUE,
} from "../constants";
import { getWheelGreeks, generatePnLScenarios, blackScholes, fetchLiveGreeksComparison } from "../engine";

const GREEK_INFO = {
    delta: {
        label: "Delta (Δ)",
        desc: "Price sensitivity — how much the option price changes per $1 move in the stock",
        color: GOLD,
    },
    gamma: {
        label: "Gamma (Γ)",
        desc: "Delta's rate of change — acceleration of option price movement",
        color: PURPLE,
    },
    theta: {
        label: "Theta (Θ)",
        desc: "Time decay — how much value the option loses per day",
        color: GREEN,
    },
    vega: {
        label: "Vega (ν)",
        desc: "Volatility sensitivity — price change per 1% vol move",
        color: AMBER,
    },
    rho: {
        label: "Rho (ρ)",
        desc: "Interest rate sensitivity — price change per 1% rate move",
        color: BLUE,
    },
};

const GreekBar = ({ label, value, maxVal, color, desc }) => {
    const absVal = Math.abs(value);
    const pct = maxVal > 0 ? (absVal / maxVal) * 100 : 0;

    return (
        <div style={{ marginBottom: 16 }}>
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 4,
                }}
            >
                <span style={{ fontSize: 12, fontWeight: 600, color: TEXT_PRIMARY }}>
                    {label}
                </span>
                <span
                    style={{
                        fontSize: 14,
                        fontWeight: 700,
                        fontFamily: monoFont,
                        color: value >= 0 ? color : RED,
                    }}
                >
                    {value >= 0 ? "+" : ""}
                    {value.toFixed(4)}
                </span>
            </div>
            <div
                style={{
                    height: 6,
                    background: "#1a1a2e",
                    borderRadius: 3,
                    overflow: "hidden",
                }}
            >
                <div
                    style={{
                        height: "100%",
                        width: `${Math.min(pct, 100)}%`,
                        background: `linear-gradient(90deg, ${color}, ${color}88)`,
                        borderRadius: 3,
                        transition: "width 0.6s ease",
                    }}
                />
            </div>
            <div
                style={{
                    fontSize: 10,
                    color: TEXT_SECONDARY,
                    marginTop: 3,
                    fontFamily: monoFont,
                }}
            >
                {desc}
            </div>
        </div>
    );
};

const GreeksView = ({ priceData, ticker, otmPct, daysToExpiry, riskFreeRate, contracts, useLiveData = false }) => {
    const [activeType, setActiveType] = useState("put");
    const [showComparison, setShowComparison] = useState(false);
    const [marketData, setMarketData] = useState(null);
    const [marketLoading, setMarketLoading] = useState(false);

    const greeks = useMemo(() => {
        if (!priceData || !priceData.data.length) return null;
        const currentPrice = priceData.data[priceData.data.length - 1].close;
        return getWheelGreeks(
            currentPrice,
            otmPct / 100,
            daysToExpiry,
            riskFreeRate,
            priceData.volatility
        );
    }, [priceData, otmPct, daysToExpiry, riskFreeRate]);

    const pnlData = useMemo(() => {
        if (!greeks) return [];
        const T = daysToExpiry / 365;
        const strike =
            activeType === "put" ? greeks.put.strike : greeks.call.strike;
        const premium =
            blackScholes(
                greeks.currentPrice,
                strike,
                T,
                riskFreeRate,
                greeks.vol,
                activeType
            ) * 100;
        return generatePnLScenarios(
            greeks.currentPrice,
            strike,
            premium,
            activeType,
            contracts
        );
    }, [greeks, activeType, daysToExpiry, riskFreeRate, contracts]);

    if (!greeks) {
        return (
            <div
                style={{
                    ...cardStyle,
                    padding: 40,
                    textAlign: "center",
                    animation: "slideUp 0.4s ease",
                }}
            >
                <Zap size={32} color={GOLD} style={{ opacity: 0.5, marginBottom: 12 }} />
                <div style={{ fontSize: 15, fontWeight: 600, color: TEXT_PRIMARY }}>
                    Run a simulation first to see Greeks
                </div>
            </div>
        );
    }

    const activeGreeks = activeType === "put" ? greeks.put : greeks.call;
    const maxGreekVal = Math.max(
        Math.abs(activeGreeks.delta),
        Math.abs(activeGreeks.gamma) * 100,
        Math.abs(activeGreeks.theta) * 10,
        Math.abs(activeGreeks.vega),
        Math.abs(activeGreeks.rho)
    );

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                gap: 14,
                animation: "slideUp 0.4s ease",
            }}
        >
            {/* Type Toggle */}
            <div style={{ display: "flex", gap: 8 }}>
                {["put", "call"].map((type) => (
                    <button
                        key={type}
                        onClick={() => setActiveType(type)}
                        style={{
                            flex: 1,
                            padding: "12px 16px",
                            borderRadius: 12,
                            border:
                                activeType === type
                                    ? `2px solid ${type === "put" ? AMBER : VIOLET}`
                                    : "1px solid rgba(201,168,76,0.15)",
                            background:
                                activeType === type
                                    ? `${type === "put" ? AMBER : VIOLET}15`
                                    : cardStyle.background,
                            color: activeType === type ? TEXT_PRIMARY : TEXT_SECONDARY,
                            cursor: "pointer",
                            fontSize: 13,
                            fontWeight: activeType === type ? 700 : 400,
                            fontFamily: monoFont,
                            transition: "all 0.2s ease",
                            textTransform: "uppercase",
                        }}
                    >
                        {type === "put" ? "📉 Cash-Secured Put" : "📈 Covered Call"}
                    </button>
                ))}
            </div>

            {/* Strike & Position Info */}
            <div style={{ ...cardStyle, padding: 18 }}>
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: 12,
                    }}
                >
                    {[
                        { label: "STOCK PRICE", value: `$${greeks.currentPrice.toFixed(2)}`, color: TEXT_PRIMARY },
                        { label: "STRIKE", value: `$${activeGreeks.strike.toFixed(2)}`, color: activeType === "put" ? AMBER : VIOLET },
                        { label: "VOLATILITY", value: `${(greeks.vol * 100).toFixed(0)}%`, color: PURPLE },
                        { label: "DTE", value: `${greeks.daysToExpiry}d`, color: GREEN },
                    ].map((item, i) => (
                        <div key={i} style={{ textAlign: "center", flex: "1 1 70px" }}>
                            <div
                                style={{
                                    fontSize: 9,
                                    color: TEXT_SECONDARY,
                                    fontFamily: monoFont,
                                    letterSpacing: 1,
                                    marginBottom: 4,
                                }}
                            >
                                {item.label}
                            </div>
                            <div
                                style={{
                                    fontSize: 18,
                                    fontWeight: 700,
                                    color: item.color,
                                    fontFamily: monoFont,
                                }}
                            >
                                {item.value}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Greeks Display */}
            <div style={{ ...cardStyle, padding: 20 }}>
                <div
                    style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: GOLD,
                        marginBottom: 18,
                        fontFamily: monoFont,
                        letterSpacing: 1,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                    }}
                >
                    <Activity size={14} />
                    {activeType.toUpperCase()} GREEKS
                </div>

                <GreekBar
                    label={GREEK_INFO.delta.label}
                    value={activeGreeks.delta}
                    maxVal={1}
                    color={GREEK_INFO.delta.color}
                    desc={GREEK_INFO.delta.desc}
                />
                <GreekBar
                    label={GREEK_INFO.gamma.label}
                    value={activeGreeks.gamma}
                    maxVal={maxGreekVal / 50}
                    color={GREEK_INFO.gamma.color}
                    desc={GREEK_INFO.gamma.desc}
                />
                <GreekBar
                    label={GREEK_INFO.theta.label}
                    value={activeGreeks.theta}
                    maxVal={Math.abs(activeGreeks.theta) * 2 || 1}
                    color={GREEK_INFO.theta.color}
                    desc={GREEK_INFO.theta.desc}
                />
                <GreekBar
                    label={GREEK_INFO.vega.label}
                    value={activeGreeks.vega}
                    maxVal={Math.abs(activeGreeks.vega) * 2 || 1}
                    color={GREEK_INFO.vega.color}
                    desc={GREEK_INFO.vega.desc}
                />
                <GreekBar
                    label={GREEK_INFO.rho.label}
                    value={activeGreeks.rho}
                    maxVal={Math.abs(activeGreeks.rho) * 2 || 0.1}
                    color={GREEK_INFO.rho.color}
                    desc={GREEK_INFO.rho.desc}
                />
            </div>

            {/* P&L Diagram */}
            <div style={{ ...cardStyle, padding: "18px 10px 10px" }}>
                <div
                    style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: GOLD,
                        marginBottom: 4,
                        paddingLeft: 8,
                        fontFamily: monoFont,
                        letterSpacing: 1,
                    }}
                >
                    P&L AT EXPIRATION
                </div>
                <div
                    style={{
                        fontSize: 9,
                        color: TEXT_SECONDARY,
                        marginBottom: 12,
                        paddingLeft: 8,
                        fontFamily: monoFont,
                    }}
                >
                    Short {activeType} · Strike ${activeGreeks.strike.toFixed(0)} ·{" "}
                    {contracts} contract{contracts > 1 ? "s" : ""}
                </div>
                <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={pnlData}>
                        <defs>
                            <linearGradient id="pnlGreen" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={GREEN} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={GREEN} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis
                            dataKey="price"
                            tick={{ fill: TEXT_SECONDARY, fontSize: 9 }}
                            tickFormatter={(v) => `$${v.toFixed(0)}`}
                            interval={9}
                        />
                        <YAxis
                            tick={{ fill: TEXT_SECONDARY, fontSize: 9 }}
                            tickFormatter={(v) =>
                                v >= 0 ? `+$${v.toFixed(0)}` : `-$${Math.abs(v).toFixed(0)}`
                            }
                        />
                        <Tooltip
                            contentStyle={tooltipStyle}
                            formatter={(v) => [
                                v >= 0 ? `+$${v.toFixed(2)}` : `-$${Math.abs(v).toFixed(2)}`,
                                "P&L",
                            ]}
                            labelFormatter={(l) => `Stock: $${l}`}
                        />
                        <ReferenceLine y={0} stroke={TEXT_SECONDARY} strokeDasharray="5 5" />
                        <ReferenceLine
                            x={activeGreeks.strike}
                            stroke={activeType === "put" ? AMBER : VIOLET}
                            strokeDasharray="5 5"
                            label={{
                                value: "Strike",
                                fill: TEXT_SECONDARY,
                                fontSize: 9,
                            }}
                        />
                        <Area
                            type="monotone"
                            dataKey="pnl"
                            stroke={GREEN}
                            fill="url(#pnlGreen)"
                            strokeWidth={2}
                            dot={false}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Key Insight */}
            <div
                style={{
                    ...cardStyle,
                    padding: 16,
                    border: `1px solid ${GREEN}20`,
                }}
            >
                <div
                    style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: GREEN,
                        marginBottom: 8,
                        fontFamily: monoFont,
                    }}
                >
                    💡 WHEEL INSIGHT
                </div>
                <div style={{ fontSize: 13, color: TEXT_MUTED, lineHeight: 1.6 }}>
                    {activeType === "put" ? (
                        <>
                            Your put has a{" "}
                            <strong style={{ color: GOLD }}>
                                {Math.abs(activeGreeks.delta * 100).toFixed(0)}%
                            </strong>{" "}
                            delta, meaning ~{Math.abs(activeGreeks.delta * 100).toFixed(0)}%
                            chance of assignment. Theta decay earns you{" "}
                            <strong style={{ color: GREEN }}>
                                ${Math.abs(activeGreeks.theta * 100 * contracts).toFixed(2)}
                            </strong>{" "}
                            per day just by waiting. {Math.abs(activeGreeks.delta) < 0.3
                                ? "Conservative position — lower premium but safer."
                                : Math.abs(activeGreeks.delta) > 0.4
                                    ? "Aggressive position — higher premium but more assignment risk."
                                    : "Balanced position — good risk/reward tradeoff."}
                        </>
                    ) : (
                        <>
                            Your call has a{" "}
                            <strong style={{ color: GOLD }}>
                                {(activeGreeks.delta * 100).toFixed(0)}%
                            </strong>{" "}
                            delta, meaning ~{(activeGreeks.delta * 100).toFixed(0)}%
                            chance of being called away. You're collecting{" "}
                            <strong style={{ color: GREEN }}>
                                ${Math.abs(activeGreeks.theta * 100 * contracts).toFixed(2)}
                            </strong>{" "}
                            per day in time decay.
                        </>
                    )}
                </div>
            </div>

            {/* Compare with Market Toggle */}
            {useLiveData && (
                <button
                    onClick={async () => {
                        if (!showComparison) {
                            setMarketLoading(true);
                            setShowComparison(true);
                            try {
                                const currentPrice = priceData.data[priceData.data.length - 1].close;
                                const result = await fetchLiveGreeksComparison(
                                    ticker, currentPrice, otmPct / 100, daysToExpiry, riskFreeRate
                                );
                                setMarketData(result);
                            } catch (err) {
                                console.error("Failed to fetch market Greeks:", err);
                            } finally {
                                setMarketLoading(false);
                            }
                        } else {
                            setShowComparison(false);
                        }
                    }}
                    disabled={marketLoading}
                    style={{
                        ...cardStyle,
                        padding: 16,
                        border: showComparison
                            ? `1px solid ${PURPLE}40`
                            : `1px solid rgba(201,168,76,0.2)`,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        width: "100%",
                        textAlign: "left",
                        transition: "all 0.2s ease",
                        background: showComparison
                            ? `${PURPLE}08`
                            : cardStyle.background,
                    }}
                >
                    <div
                        style={{
                            background: `${PURPLE}20`,
                            borderRadius: 10,
                            padding: 10,
                            display: "flex",
                        }}
                    >
                        {marketLoading ? (
                            <RefreshCw size={18} color={PURPLE} style={{ animation: "pulse 1s infinite" }} />
                        ) : (
                            <BarChart2 size={18} color={PURPLE} />
                        )}
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: TEXT_PRIMARY }}>
                            {marketLoading ? "Fetching market data..." : showComparison ? "Hide Market Comparison" : "Compare with Market"}
                        </div>
                        <div style={{ fontSize: 11, color: TEXT_SECONDARY }}>
                            Side-by-side: Calculated vs. Market Greeks
                        </div>
                    </div>
                </button>
            )}

            {/* Market Comparison Table */}
            {showComparison && marketData?.comparison && (
                <div style={{ ...cardStyle, padding: 20, animation: "slideUp 0.3s ease" }}>
                    <div
                        style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: PURPLE,
                            marginBottom: 16,
                            fontFamily: monoFont,
                            letterSpacing: 1,
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                        }}
                    >
                        <BarChart2 size={14} />
                        CALCULATED vs MARKET — {activeType.toUpperCase()}
                    </div>

                    {/* Contract Info */}
                    {marketData.market?.[activeType] && (
                        <div
                            style={{
                                display: "flex",
                                gap: 12,
                                marginBottom: 16,
                                flexWrap: "wrap",
                            }}
                        >
                            {[
                                { label: "STRIKE", value: `$${marketData.market[activeType].strike?.toFixed(0)}` },
                                { label: "BID", value: `$${marketData.market[activeType].bid?.toFixed(2)}` },
                                { label: "ASK", value: `$${marketData.market[activeType].ask?.toFixed(2)}` },
                                { label: "DTE", value: `${marketData.market[activeType].dte}d` },
                                { label: "MKT IV", value: `${(marketData.market[activeType].impliedVolatility * 100).toFixed(1)}%` },
                            ].map((item, i) => (
                                <div key={i} style={{ textAlign: "center", flex: "1 1 50px" }}>
                                    <div style={{ fontSize: 9, color: TEXT_SECONDARY, fontFamily: monoFont, letterSpacing: 1 }}>
                                        {item.label}
                                    </div>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: TEXT_PRIMARY, fontFamily: monoFont }}>
                                        {item.value}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Comparison Table */}
                    {marketData.comparison[activeType] && (
                        <div style={{ overflowX: "auto" }}>
                            <table
                                style={{
                                    width: "100%",
                                    borderCollapse: "separate",
                                    borderSpacing: "0 4px",
                                    fontFamily: monoFont,
                                    fontSize: 12,
                                }}
                            >
                                <thead>
                                    <tr style={{ color: GOLD, fontSize: 10, letterSpacing: 0.5 }}>
                                        <th style={{ textAlign: "left", padding: "6px 8px" }}>GREEK</th>
                                        <th style={{ textAlign: "right", padding: "6px 8px" }}>CALCULATED</th>
                                        <th style={{ textAlign: "right", padding: "6px 8px" }}>MARKET</th>
                                        <th style={{ textAlign: "right", padding: "6px 8px" }}>DIFF</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {["delta", "gamma", "theta", "vega"].map((greek) => {
                                        const comp = marketData.comparison[activeType][greek];
                                        if (!comp) return null;
                                        const diffColor =
                                            Math.abs(comp.diff) < 5 ? GREEN :
                                                Math.abs(comp.diff) < 15 ? AMBER : RED;
                                        return (
                                            <tr
                                                key={greek}
                                                style={{
                                                    background: "rgba(201,168,76,0.03)",
                                                    borderRadius: 6,
                                                }}
                                            >
                                                <td style={{ padding: "8px", color: GREEK_INFO[greek]?.color || TEXT_PRIMARY, fontWeight: 600 }}>
                                                    {GREEK_INFO[greek]?.label || greek}
                                                </td>
                                                <td style={{ padding: "8px", textAlign: "right", color: TEXT_PRIMARY }}>
                                                    {comp.calculated?.toFixed(4)}
                                                </td>
                                                <td style={{ padding: "8px", textAlign: "right", color: PURPLE }}>
                                                    {comp.market?.toFixed(4)}
                                                </td>
                                                <td style={{ padding: "8px", textAlign: "right", color: diffColor, fontWeight: 700 }}>
                                                    {comp.diff >= 0 ? "+" : ""}{comp.diff?.toFixed(1)}%
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {!marketData.comparison[activeType] && (
                        <div style={{ fontSize: 12, color: TEXT_SECONDARY, textAlign: "center", padding: 16 }}>
                            No matching {activeType} contract found in the market data.
                        </div>
                    )}

                    <div
                        style={{
                            marginTop: 12,
                            fontSize: 9,
                            color: TEXT_SECONDARY,
                            fontFamily: monoFont,
                            textAlign: "center",
                        }}
                    >
                        {marketData._mock ? "Simulated market data" : "Live market data"}
                        {" • "}
                        Diff shows % deviation of calculated from market
                    </div>
                </div>
            )}
        </div>
    );
};

export default GreeksView;
