// ─── INTERACTIVE PRICE CHART ───
import { useState, useMemo } from "react";
import {
    ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
    Tooltip, CartesianGrid, ReferenceLine,
} from "recharts";
import { useStockHistory } from "../services/marketDataHooks";
import {
    GOLD, GOLD_LIGHT, GREEN, RED, TEXT_PRIMARY, TEXT_SECONDARY,
    DARK_BG, DARK_CARD, DARK_SURFACE, DARK_BORDER,
    monoFont, sansFont, tooltipStyle, cardStyle,
} from "../constants";

const RANGE_OPTIONS = ["1W", "1M", "3M", "1Y", "5Y"];

export default function PriceChart({ ticker, defaultRange = "3M", height = 300, showRangeSelector = true }) {
    const [range, setRange] = useState(defaultRange);
    const { data, loading, error } = useStockHistory(ticker, range);

    const chartData = useMemo(() => {
        if (!data?.data?.length) return [];
        return data.data.map((d) => ({
            date: d.date,
            close: d.close,
            volume: d.volume,
        }));
    }, [data]);

    const isPositive = useMemo(() => {
        if (chartData.length < 2) return true;
        return chartData[chartData.length - 1].close >= chartData[0].close;
    }, [chartData]);

    const priceChange = useMemo(() => {
        if (chartData.length < 2) return { value: 0, percent: 0 };
        const first = chartData[0].close;
        const last = chartData[chartData.length - 1].close;
        return {
            value: last - first,
            percent: ((last - first) / first) * 100,
        };
    }, [chartData]);

    const lineColor = isPositive ? GREEN : RED;
    const gradientId = `priceGrad-${ticker}-${range}`;

    if (!ticker) return null;

    return (
        <div style={{ ...cardStyle, padding: 20 }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                    <span style={{ fontFamily: sansFont, fontSize: 14, color: TEXT_SECONDARY }}>
                        {ticker} — {range} Performance
                    </span>
                    {chartData.length > 0 && (
                        <div style={{ marginTop: 4 }}>
                            <span style={{
                                fontFamily: monoFont, fontSize: 22, fontWeight: 700, color: TEXT_PRIMARY,
                            }}>
                                ${chartData[chartData.length - 1]?.close?.toFixed(2)}
                            </span>
                            <span style={{
                                fontFamily: monoFont, fontSize: 13, fontWeight: 600, marginLeft: 10,
                                color: lineColor,
                            }}>
                                {priceChange.value >= 0 ? "+" : ""}{priceChange.value.toFixed(2)}{" "}
                                ({priceChange.percent >= 0 ? "+" : ""}{priceChange.percent.toFixed(2)}%)
                            </span>
                        </div>
                    )}
                </div>

                {showRangeSelector && (
                    <div style={{ display: "flex", gap: 4 }}>
                        {RANGE_OPTIONS.map((r) => (
                            <button
                                key={r}
                                onClick={() => setRange(r)}
                                style={{
                                    padding: "5px 10px", borderRadius: 8, border: "none",
                                    fontFamily: monoFont, fontSize: 11, fontWeight: 600,
                                    cursor: "pointer", transition: "all 0.2s",
                                    background: r === range ? `${GOLD}22` : "transparent",
                                    color: r === range ? GOLD : TEXT_SECONDARY,
                                    border: `1px solid ${r === range ? `${GOLD}44` : "transparent"}`,
                                }}
                            >
                                {r}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Chart */}
            {loading ? (
                <div style={{
                    height, display: "flex", alignItems: "center", justifyContent: "center",
                    color: TEXT_SECONDARY, fontFamily: monoFont, fontSize: 13,
                }}>
                    <span style={{ animation: "pulse 1.5s ease-in-out infinite" }}>Loading chart data...</span>
                </div>
            ) : error ? (
                <div style={{
                    height, display: "flex", alignItems: "center", justifyContent: "center",
                    color: RED, fontFamily: monoFont, fontSize: 13,
                }}>
                    Failed to load chart data
                </div>
            ) : (
                <ResponsiveContainer width="100%" height={height}>
                    <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                        <defs>
                            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={lineColor} stopOpacity={0.25} />
                                <stop offset="95%" stopColor={lineColor} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={`${DARK_BORDER}`} strokeOpacity={0.5} />
                        <XAxis
                            dataKey="date"
                            stroke={TEXT_SECONDARY}
                            tick={{ fontSize: 10, fontFamily: monoFont, fill: TEXT_SECONDARY }}
                            tickFormatter={(d) => {
                                const date = new Date(d);
                                if (range === "1W" || range === "1M") return `${date.getMonth() + 1}/${date.getDate()}`;
                                return `${date.getMonth() + 1}/${date.getFullYear().toString().slice(2)}`;
                            }}
                            minTickGap={40}
                        />
                        <YAxis
                            domain={["auto", "auto"]}
                            stroke={TEXT_SECONDARY}
                            tick={{ fontSize: 10, fontFamily: monoFont, fill: TEXT_SECONDARY }}
                            tickFormatter={(v) => `$${v.toFixed(0)}`}
                            width={55}
                        />
                        <Tooltip
                            contentStyle={{ ...tooltipStyle, padding: 10 }}
                            labelFormatter={(d) => new Date(d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                            formatter={(v) => [`$${v.toFixed(2)}`, "Close"]}
                        />
                        <Area
                            type="monotone"
                            dataKey="close"
                            stroke={lineColor}
                            strokeWidth={2}
                            fill={`url(#${gradientId})`}
                            dot={false}
                            animationDuration={800}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            )}
        </div>
    );
}
