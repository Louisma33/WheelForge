import {
    AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip,
    ResponsiveContainer,
} from "recharts";
import {
    DollarSign, TrendingUp, Shield, Target, Brain,
    RefreshCw, Sparkles,
} from "lucide-react";
import StatCard from "../components/StatCard";
import {
    GOLD, GOLD_LIGHT, cardStyle, monoFont, tooltipStyle,
    TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED, GREEN, PURPLE, AMBER, VIOLET,
} from "../constants";
import { fmt, fmtPct } from "../utils";

const DashboardView = ({
    results,
    predictions,
    aiAnalysis,
    analysisLoading,
    getAiAnalysis,
    aiRecs,
    recsLoading,
    getAiRecs,
}) => {
    if (!results) return null;

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                gap: 14,
                animation: "slideUp 0.4s ease",
            }}
        >
            {/* Key Metrics */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <StatCard
                    icon={DollarSign}
                    label="Wheel"
                    value={fmt(results.finalValue)}
                    sub={fmtPct(results.wheelReturn)}
                    trend={results.wheelReturn >= 0 ? "up" : "down"}
                />
                <StatCard
                    icon={TrendingUp}
                    label="Buy&Hold"
                    value={fmt(results.bhFinal)}
                    sub={fmtPct(results.bhReturn)}
                    trend={results.bhReturn >= 0 ? "up" : "down"}
                    color={PURPLE}
                />
                <StatCard
                    icon={Shield}
                    label="Premium"
                    value={fmt(results.totalPremium)}
                    sub={`${results.putsSold + results.callsSold} trades`}
                    trend="up"
                    color={GREEN}
                />
            </div>

            {/* Performance Comparison Chart */}
            <div style={{ ...cardStyle, padding: "18px 10px 10px" }}>
                <div
                    style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: GOLD,
                        marginBottom: 14,
                        paddingLeft: 8,
                        fontFamily: monoFont,
                        letterSpacing: 1,
                    }}
                >
                    WHEEL vs BUY & HOLD
                </div>
                <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={results.comparison}>
                        <defs>
                            <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={GOLD} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={GOLD} stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={PURPLE} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={PURPLE} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis
                            dataKey="date"
                            tick={{ fill: TEXT_SECONDARY, fontSize: 9 }}
                            tickFormatter={(d) => d.slice(5)}
                            interval="preserveStartEnd"
                        />
                        <YAxis
                            tick={{ fill: TEXT_SECONDARY, fontSize: 9 }}
                            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
                        />
                        <Tooltip
                            contentStyle={tooltipStyle}
                            formatter={(v) => [`$${v.toLocaleString()}`, ""]}
                        />
                        <Area
                            type="monotone"
                            dataKey="wheel"
                            stroke={GOLD}
                            fill="url(#wg)"
                            strokeWidth={2}
                            dot={false}
                            name="Wheel"
                        />
                        <Area
                            type="monotone"
                            dataKey="buyHold"
                            stroke={PURPLE}
                            fill="url(#bg)"
                            strokeWidth={2}
                            dot={false}
                            name="Buy&Hold"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* AI Analysis Button */}
            <button
                onClick={getAiAnalysis}
                disabled={analysisLoading}
                style={{
                    ...cardStyle,
                    padding: 16,
                    border: `1px solid rgba(201,168,76,0.3)`,
                    cursor: "pointer",
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
                    <Brain size={20} color={GOLD} />
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: TEXT_PRIMARY }}>
                        {analysisLoading ? "Analyzing..." : "Get AI Analysis"}
                    </div>
                    <div style={{ fontSize: 11, color: TEXT_SECONDARY }}>
                        Claude explains your results in plain English
                    </div>
                </div>
                {analysisLoading ? (
                    <RefreshCw
                        size={16}
                        color={GOLD}
                        style={{ animation: "pulse 1s infinite" }}
                    />
                ) : (
                    <Sparkles size={16} color={GOLD} />
                )}
            </button>

            {aiAnalysis && (
                <div
                    style={{
                        ...cardStyle,
                        padding: 20,
                        animation: "slideUp 0.3s ease",
                    }}
                >
                    <div
                        style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: GOLD,
                            marginBottom: 12,
                            fontFamily: monoFont,
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                        }}
                    >
                        <Brain size={14} /> AI ANALYSIS
                    </div>
                    <div
                        style={{
                            fontSize: 14,
                            color: TEXT_MUTED,
                            lineHeight: 1.7,
                            whiteSpace: "pre-wrap",
                        }}
                    >
                        {aiAnalysis}
                    </div>
                </div>
            )}

            {/* AI Recommendations Button */}
            <button
                onClick={getAiRecs}
                disabled={recsLoading}
                style={{
                    ...cardStyle,
                    padding: 16,
                    border: `1px solid rgba(74,222,128,0.3)`,
                    cursor: "pointer",
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
                        background: "rgba(74,222,128,0.1)",
                        borderRadius: 10,
                        padding: 10,
                        display: "flex",
                    }}
                >
                    <Target size={20} color={GREEN} />
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: TEXT_PRIMARY }}>
                        {recsLoading ? "Generating..." : "Get Trade Recommendations"}
                    </div>
                    <div style={{ fontSize: 11, color: TEXT_SECONDARY }}>
                        Personalized next moves from Claude
                    </div>
                </div>
                {recsLoading ? (
                    <RefreshCw
                        size={16}
                        color={GREEN}
                        style={{ animation: "pulse 1s infinite" }}
                    />
                ) : (
                    <Sparkles size={16} color={GREEN} />
                )}
            </button>

            {aiRecs && (
                <div
                    style={{
                        ...cardStyle,
                        padding: 20,
                        border: "1px solid rgba(74,222,128,0.15)",
                        animation: "slideUp 0.3s ease",
                    }}
                >
                    <div
                        style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: GREEN,
                            marginBottom: 12,
                            fontFamily: monoFont,
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                        }}
                    >
                        <Target size={14} /> RECOMMENDATIONS
                    </div>
                    <div
                        style={{
                            fontSize: 14,
                            color: TEXT_MUTED,
                            lineHeight: 1.7,
                            whiteSpace: "pre-wrap",
                        }}
                    >
                        {aiRecs}
                    </div>
                </div>
            )}

            {/* Put/Call Stats */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <StatCard
                    icon={Target}
                    label="Puts"
                    value={results.putsSold}
                    sub={`${results.putsAssigned} assigned`}
                    color={AMBER}
                />
                <StatCard
                    icon={Target}
                    label="Calls"
                    value={results.callsSold}
                    sub={`${results.callsAssigned} assigned`}
                    color={VIOLET}
                />
            </div>
        </div>
    );
};

export default DashboardView;
