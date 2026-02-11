import { useState, useCallback } from "react";
import {
    BarChart, Bar, CartesianGrid, XAxis, YAxis,
    Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import {
    Cpu, RefreshCw, Download, TrendingUp, AlertTriangle,
} from "lucide-react";
import {
    GOLD, cardStyle, monoFont, tooltipStyle,
    TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED,
    GREEN, RED, PURPLE, AMBER, VIOLET, BLUE,
} from "../constants";
import { TICKERS, TICKER_CONFIGS, optimizeStrategy, compareMultiTicker } from "../engine";
import { fmt, fmtPct } from "../utils";
import { exportOptimizerCSV } from "../utils/exportUtils";

const OptimizerView = ({ ticker, initialCash, contracts, riskFreeRate, otmPct, daysToExpiry }) => {
    const [optimizerResults, setOptimizerResults] = useState(null);
    const [comparisonResults, setComparisonResults] = useState(null);
    const [optimizing, setOptimizing] = useState(false);
    const [comparing, setComparing] = useState(false);
    const [activeSubTab, setActiveSubTab] = useState("optimizer");

    const runOptimizer = useCallback(() => {
        setOptimizing(true);
        setTimeout(() => {
            const results = optimizeStrategy(ticker, initialCash, contracts, riskFreeRate);
            setOptimizerResults(results);
            setOptimizing(false);
        }, 100);
    }, [ticker, initialCash, contracts, riskFreeRate]);

    const runComparison = useCallback(() => {
        setComparing(true);
        setTimeout(() => {
            const results = compareMultiTicker(TICKERS, {
                initialCash,
                otmPct: otmPct / 100,
                daysToExpiry,
                riskFreeRate,
                contracts,
            });
            setComparisonResults(results);
            setComparing(false);
        }, 100);
    }, [initialCash, otmPct, daysToExpiry, riskFreeRate, contracts]);

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                gap: 14,
                animation: "slideUp 0.4s ease",
            }}
        >
            {/* Sub-tabs */}
            <div style={{ display: "flex", gap: 8 }}>
                {[
                    { key: "optimizer", label: "⚙️ Optimizer" },
                    { key: "compare", label: "📊 Multi-Ticker" },
                ].map((t) => (
                    <button
                        key={t.key}
                        onClick={() => setActiveSubTab(t.key)}
                        style={{
                            flex: 1,
                            padding: "12px 16px",
                            borderRadius: 12,
                            border:
                                activeSubTab === t.key
                                    ? `2px solid ${GOLD}`
                                    : "1px solid rgba(201,168,76,0.15)",
                            background:
                                activeSubTab === t.key
                                    ? `${GOLD}15`
                                    : cardStyle.background,
                            color: activeSubTab === t.key ? TEXT_PRIMARY : TEXT_SECONDARY,
                            cursor: "pointer",
                            fontSize: 13,
                            fontWeight: activeSubTab === t.key ? 700 : 400,
                            fontFamily: monoFont,
                            transition: "all 0.2s ease",
                        }}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* ═══ OPTIMIZER TAB ═══ */}
            {activeSubTab === "optimizer" && (
                <>
                    {/* Run Button */}
                    <button
                        onClick={runOptimizer}
                        disabled={optimizing}
                        style={{
                            ...cardStyle,
                            padding: 16,
                            border: `1px solid ${GOLD}40`,
                            cursor: optimizing ? "wait" : "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            width: "100%",
                            textAlign: "left",
                            transition: "all 0.2s ease",
                        }}
                    >
                        <div
                            style={{
                                background: `${GOLD}20`,
                                borderRadius: 10,
                                padding: 10,
                                display: "flex",
                            }}
                        >
                            {optimizing ? (
                                <RefreshCw
                                    size={20}
                                    color={GOLD}
                                    style={{ animation: "pulse 1s infinite" }}
                                />
                            ) : (
                                <Cpu size={20} color={GOLD} />
                            )}
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: TEXT_PRIMARY }}>
                                {optimizing
                                    ? "Optimizing... (testing 192 combinations)"
                                    : `Optimize ${ticker} Strategy`}
                            </div>
                            <div style={{ fontSize: 11, color: TEXT_SECONDARY }}>
                                Grid search across OTM% × DTE with Monte Carlo averaging
                            </div>
                        </div>
                    </button>

                    {/* Results */}
                    {optimizerResults && (
                        <>
                            {/* Top Results Bar Chart */}
                            <div style={{ ...cardStyle, padding: "18px 10px 10px" }}>
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        paddingLeft: 8,
                                        paddingRight: 8,
                                        marginBottom: 12,
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: 11,
                                            fontWeight: 700,
                                            color: GOLD,
                                            fontFamily: monoFont,
                                            letterSpacing: 1,
                                        }}
                                    >
                                        TOP 10 COMBOS — {ticker}
                                    </div>
                                    <button
                                        onClick={() => exportOptimizerCSV(optimizerResults, ticker)}
                                        style={{
                                            background: "transparent",
                                            border: `1px solid ${GOLD}30`,
                                            borderRadius: 8,
                                            padding: "5px 10px",
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 4,
                                            fontSize: 10,
                                            color: GOLD,
                                            fontFamily: monoFont,
                                        }}
                                    >
                                        <Download size={10} /> CSV
                                    </button>
                                </div>
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={optimizerResults.slice(0, 10)}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                        <XAxis
                                            dataKey={(d) => `${d.otmPctDisplay}/${d.dte}d`}
                                            tick={{ fill: TEXT_SECONDARY, fontSize: 8 }}
                                            angle={-30}
                                            textAnchor="end"
                                            height={40}
                                        />
                                        <YAxis
                                            tick={{ fill: TEXT_SECONDARY, fontSize: 9 }}
                                            tickFormatter={(v) => `${v}%`}
                                        />
                                        <Tooltip
                                            contentStyle={tooltipStyle}
                                            formatter={(v, name) => [
                                                `${v.toFixed(2)}%`,
                                                name === "wheelReturn" ? "Wheel" : "B&H",
                                            ]}
                                        />
                                        <Bar dataKey="wheelReturn" name="wheelReturn" radius={[3, 3, 0, 0]}>
                                            {optimizerResults.slice(0, 10).map((entry, i) => (
                                                <Cell
                                                    key={i}
                                                    fill={
                                                        i === 0 ? GOLD : i < 3 ? GREEN : PURPLE
                                                    }
                                                    fillOpacity={1 - i * 0.07}
                                                />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Best Result Highlight */}
                            <div
                                style={{
                                    ...cardStyle,
                                    padding: 18,
                                    border: `1px solid ${GOLD}30`,
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: 11,
                                        fontWeight: 700,
                                        color: GOLD,
                                        marginBottom: 14,
                                        fontFamily: monoFont,
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 6,
                                    }}
                                >
                                    🏆 OPTIMAL STRATEGY
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        flexWrap: "wrap",
                                        gap: 16,
                                        justifyContent: "space-around",
                                    }}
                                >
                                    {[
                                        { label: "OTM%", value: optimizerResults[0].otmPctDisplay, color: GOLD },
                                        { label: "DTE", value: `${optimizerResults[0].dte}d`, color: GREEN },
                                        { label: "Return", value: fmtPct(optimizerResults[0].wheelReturn), color: optimizerResults[0].wheelReturn >= 0 ? GREEN : RED },
                                        { label: "Alpha", value: fmtPct(optimizerResults[0].alpha), color: optimizerResults[0].alpha >= 0 ? GREEN : RED },
                                        { label: "Premium", value: fmt(optimizerResults[0].avgPremium), color: AMBER },
                                        { label: "Risk", value: `${optimizerResults[0].riskScore}%`, color: optimizerResults[0].riskScore > 50 ? RED : GREEN },
                                    ].map((item, i) => (
                                        <div key={i} style={{ textAlign: "center" }}>
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

                            {/* Full Results Table */}
                            <div style={{ ...cardStyle, padding: 14, overflowX: "auto" }}>
                                <div
                                    style={{
                                        fontSize: 11,
                                        fontWeight: 700,
                                        color: GOLD,
                                        marginBottom: 14,
                                        fontFamily: monoFont,
                                    }}
                                >
                                    ALL RESULTS ({optimizerResults.length})
                                </div>
                                <div style={{ minWidth: 520 }}>
                                    <div
                                        style={{
                                            display: "grid",
                                            gridTemplateColumns: "55px 45px 70px 60px 60px 70px 55px",
                                            gap: 6,
                                            padding: "6px 0",
                                            borderBottom: `1px solid ${GOLD}30`,
                                            fontSize: 8,
                                            color: TEXT_SECONDARY,
                                            textTransform: "uppercase",
                                            letterSpacing: 1,
                                            fontFamily: monoFont,
                                        }}
                                    >
                                        <span>OTM%</span>
                                        <span>DTE</span>
                                        <span>Return</span>
                                        <span>Alpha</span>
                                        <span>Premium</span>
                                        <span>Trades</span>
                                        <span>Risk</span>
                                    </div>
                                    {optimizerResults.slice(0, 20).map((r, i) => (
                                        <div
                                            key={i}
                                            style={{
                                                display: "grid",
                                                gridTemplateColumns: "55px 45px 70px 60px 60px 70px 55px",
                                                gap: 6,
                                                padding: "8px 0",
                                                borderBottom: "1px solid #1e293b",
                                                fontSize: 11,
                                                fontFamily: monoFont,
                                                background: i === 0 ? `${GOLD}08` : "transparent",
                                                transition: "background 0.2s ease",
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = `${GOLD}06`;
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = i === 0 ? `${GOLD}08` : "transparent";
                                            }}
                                        >
                                            <span style={{ color: TEXT_PRIMARY, fontWeight: i === 0 ? 700 : 400 }}>
                                                {r.otmPctDisplay}
                                            </span>
                                            <span style={{ color: TEXT_PRIMARY }}>{r.dte}</span>
                                            <span
                                                style={{
                                                    color: r.wheelReturn >= 0 ? GREEN : RED,
                                                    fontWeight: 600,
                                                }}
                                            >
                                                {fmtPct(r.wheelReturn)}
                                            </span>
                                            <span style={{ color: r.alpha >= 0 ? GREEN : RED }}>
                                                {fmtPct(r.alpha)}
                                            </span>
                                            <span style={{ color: AMBER }}>{fmt(r.avgPremium)}</span>
                                            <span style={{ color: TEXT_SECONDARY }}>{r.avgTrades}</span>
                                            <span
                                                style={{
                                                    color: r.riskScore > 50 ? RED : r.riskScore > 30 ? AMBER : GREEN,
                                                }}
                                            >
                                                {r.riskScore}%
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </>
            )}

            {/* ═══ MULTI-TICKER TAB ═══ */}
            {activeSubTab === "compare" && (
                <>
                    {/* Run Button */}
                    <button
                        onClick={runComparison}
                        disabled={comparing}
                        style={{
                            ...cardStyle,
                            padding: 16,
                            border: `1px solid ${PURPLE}40`,
                            cursor: comparing ? "wait" : "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            width: "100%",
                            textAlign: "left",
                            transition: "all 0.2s ease",
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
                            {comparing ? (
                                <RefreshCw
                                    size={20}
                                    color={PURPLE}
                                    style={{ animation: "pulse 1s infinite" }}
                                />
                            ) : (
                                <TrendingUp size={20} color={PURPLE} />
                            )}
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: TEXT_PRIMARY }}>
                                {comparing
                                    ? `Comparing ${TICKERS.length} tickers...`
                                    : "Compare All Tickers"}
                            </div>
                            <div style={{ fontSize: 11, color: TEXT_SECONDARY }}>
                                Same strategy ({(otmPct)}% OTM, {daysToExpiry} DTE) across all tickers
                            </div>
                        </div>
                    </button>

                    {/* Comparison Results */}
                    {comparisonResults && (
                        <>
                            {/* Bar Chart */}
                            <div style={{ ...cardStyle, padding: "18px 10px 10px" }}>
                                <div
                                    style={{
                                        fontSize: 11,
                                        fontWeight: 700,
                                        color: GOLD,
                                        marginBottom: 12,
                                        paddingLeft: 8,
                                        fontFamily: monoFont,
                                        letterSpacing: 1,
                                    }}
                                >
                                    WHEEL RETURN BY TICKER
                                </div>
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={comparisonResults}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                        <XAxis
                                            dataKey="ticker"
                                            tick={{ fill: TEXT_SECONDARY, fontSize: 10, fontWeight: 600 }}
                                        />
                                        <YAxis
                                            tick={{ fill: TEXT_SECONDARY, fontSize: 9 }}
                                            tickFormatter={(v) => `${v}%`}
                                        />
                                        <Tooltip
                                            contentStyle={tooltipStyle}
                                            formatter={(v, name) => [
                                                `${v.toFixed(2)}%`,
                                                name === "wheelReturn" ? "Wheel" : "B&H",
                                            ]}
                                        />
                                        <Bar dataKey="wheelReturn" name="wheelReturn" radius={[3, 3, 0, 0]}>
                                            {comparisonResults.map((entry, i) => (
                                                <Cell
                                                    key={i}
                                                    fill={entry.wheelReturn >= 0 ? GREEN : RED}
                                                    fillOpacity={1 - i * 0.06}
                                                />
                                            ))}
                                        </Bar>
                                        <Bar
                                            dataKey="bhReturn"
                                            name="bhReturn"
                                            radius={[3, 3, 0, 0]}
                                            fill={PURPLE}
                                            fillOpacity={0.4}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Ticker Cards */}
                            {comparisonResults.map((r, i) => (
                                <div
                                    key={r.ticker}
                                    style={{
                                        ...cardStyle,
                                        padding: 16,
                                        border: i === 0 ? `1px solid ${GOLD}30` : cardStyle.border,
                                        transition: "all 0.2s ease",
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = "translateY(-1px)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = "translateY(0)";
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            marginBottom: 10,
                                        }}
                                    >
                                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                            {i === 0 && (
                                                <span style={{ fontSize: 16 }}>🥇</span>
                                            )}
                                            {i === 1 && (
                                                <span style={{ fontSize: 16 }}>🥈</span>
                                            )}
                                            {i === 2 && (
                                                <span style={{ fontSize: 16 }}>🥉</span>
                                            )}
                                            <div>
                                                <div
                                                    style={{
                                                        fontSize: 16,
                                                        fontWeight: 700,
                                                        color: TEXT_PRIMARY,
                                                        fontFamily: monoFont,
                                                    }}
                                                >
                                                    {r.ticker}
                                                </div>
                                                <div style={{ fontSize: 10, color: TEXT_SECONDARY }}>
                                                    {TICKER_CONFIGS[r.ticker]?.name || r.ticker} ·{" "}
                                                    {TICKER_CONFIGS[r.ticker]?.sector || ""}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: "right" }}>
                                            <div
                                                style={{
                                                    fontSize: 18,
                                                    fontWeight: 700,
                                                    color: r.wheelReturn >= 0 ? GREEN : RED,
                                                    fontFamily: monoFont,
                                                }}
                                            >
                                                {fmtPct(r.wheelReturn)}
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: 10,
                                                    color: r.alpha >= 0 ? GREEN : RED,
                                                    fontFamily: monoFont,
                                                }}
                                            >
                                                α {fmtPct(r.alpha)}
                                            </div>
                                        </div>
                                    </div>

                                    <div
                                        style={{
                                            display: "flex",
                                            gap: 12,
                                            fontSize: 10,
                                            color: TEXT_SECONDARY,
                                            fontFamily: monoFont,
                                            flexWrap: "wrap",
                                        }}
                                    >
                                        <span>B&H: {fmtPct(r.bhReturn)}</span>
                                        <span>Premium: {fmt(r.totalPremium)}</span>
                                        <span>Put Assign: {r.putAssignRate}%</span>
                                        <span>Call Assign: {r.callAssignRate}%</span>
                                        <span>{r.totalTrades} trades</span>
                                    </div>
                                </div>
                            ))}
                        </>
                    )}
                </>
            )}
        </div>
    );
};

export default OptimizerView;
