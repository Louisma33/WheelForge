import {
    AreaChart, Area, PieChart, Pie, Cell, CartesianGrid,
    XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, ReferenceLine,
} from "recharts";
import { DollarSign, Activity } from "lucide-react";
import StatCard from "../components/StatCard";
import {
    GOLD, cardStyle, monoFont, tooltipStyle,
    TEXT_PRIMARY, TEXT_SECONDARY, GREEN, PURPLE, RED,
} from "../constants";
import { fmt, fmtPct } from "../utils";

const PortfolioView = ({ results, priceData, ticker, initialCash }) => {
    if (!results) return null;

    const stockValue =
        results.currentShares *
        (priceData?.data[priceData.data.length - 1]?.close || 0);

    const pieData = [
        { name: "Cash", value: Math.max(0, results.currentCash) },
        { name: ticker, value: stockValue },
    ].filter((d) => d.value > 0);

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                gap: 14,
                animation: "slideUp 0.4s ease",
            }}
        >
            {/* Allocation Pie */}
            <div style={{ ...cardStyle, padding: 22 }}>
                <div
                    style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: GOLD,
                        marginBottom: 14,
                        fontFamily: monoFont,
                    }}
                >
                    ALLOCATION
                </div>
                <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                        <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={85}
                            paddingAngle={4}
                            dataKey="value"
                        >
                            <Cell fill={GOLD} />
                            <Cell fill={PURPLE} />
                        </Pie>
                        <Tooltip
                            contentStyle={tooltipStyle}
                            formatter={(v) => `$${v.toLocaleString()}`}
                        />
                        <Legend
                            formatter={(v) => (
                                <span
                                    style={{
                                        color: TEXT_SECONDARY,
                                        fontSize: 11,
                                        fontFamily: monoFont,
                                    }}
                                >
                                    {v}
                                </span>
                            )}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            {/* Cash & Shares */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <StatCard
                    icon={DollarSign}
                    label="Cash"
                    value={fmt(results.currentCash)}
                    color={GREEN}
                />
                <StatCard
                    icon={Activity}
                    label="Shares"
                    value={results.currentShares}
                    color={PURPLE}
                />
            </div>

            {/* Portfolio Value Chart */}
            <div style={{ ...cardStyle, padding: "18px 10px 10px" }}>
                <div
                    style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: GOLD,
                        marginBottom: 14,
                        paddingLeft: 8,
                        fontFamily: monoFont,
                    }}
                >
                    PORTFOLIO VALUE
                </div>
                <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={results.history}>
                        <defs>
                            <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={GOLD} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={GOLD} stopOpacity={0} />
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
                            dataKey="value"
                            stroke={GOLD}
                            fill="url(#pg)"
                            strokeWidth={2}
                            dot={false}
                        />
                        <ReferenceLine
                            y={initialCash}
                            stroke="#f8717144"
                            strokeDasharray="5 5"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Return Breakdown */}
            <div style={{ ...cardStyle, padding: 18 }}>
                <div
                    style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: GOLD,
                        marginBottom: 14,
                        fontFamily: monoFont,
                    }}
                >
                    RETURN BREAKDOWN
                </div>
                {[
                    { label: "Initial Capital", value: fmt(initialCash), color: TEXT_SECONDARY },
                    {
                        label: "Premium Collected",
                        value: `+${fmt(results.totalPremium)}`,
                        color: GREEN,
                    },
                    {
                        label: "Stock P&L",
                        value: fmt(
                            results.finalValue - initialCash - results.totalPremium
                        ),
                        color:
                            results.finalValue - initialCash - results.totalPremium >= 0
                                ? GREEN
                                : RED,
                    },
                    { label: "Final Value", value: fmt(results.finalValue), color: GOLD },
                    {
                        label: "Total Return",
                        value: fmtPct(results.wheelReturn),
                        color: results.wheelReturn >= 0 ? GREEN : RED,
                    },
                ].map((r, i) => (
                    <div
                        key={i}
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            padding: "9px 0",
                            borderBottom: i < 4 ? "1px solid #1e293b" : "none",
                            fontWeight: i >= 3 ? 700 : 400,
                        }}
                    >
                        <span
                            style={{
                                fontSize: 12,
                                color: TEXT_SECONDARY,
                                fontFamily: monoFont,
                            }}
                        >
                            {r.label}
                        </span>
                        <span
                            style={{
                                fontSize: 13,
                                color: r.color,
                                fontFamily: monoFont,
                            }}
                        >
                            {r.value}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PortfolioView;
