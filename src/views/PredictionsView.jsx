import {
    BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip,
    ResponsiveContainer,
} from "recharts";
import { DollarSign, TrendingUp, Shield } from "lucide-react";
import StatCard from "../components/StatCard";
import ProgressRing from "../components/ProgressRing";
import {
    GOLD, cardStyle, monoFont, tooltipStyle,
    TEXT_SECONDARY, PURPLE, AMBER, VIOLET, GREEN, BLUE, LAVENDER, RED,
} from "../constants";
import { fmtPct, fmt } from "../utils";

const PredictionsView = ({ predictions, daysToExpiry }) => {
    if (!predictions) return null;

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                gap: 14,
                animation: "slideUp 0.4s ease",
            }}
        >
            {/* Price Stats */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <StatCard
                    icon={DollarSign}
                    label="Current"
                    value={`$${predictions.currentPrice.toFixed(2)}`}
                />
                <StatCard
                    icon={TrendingUp}
                    label="Predicted"
                    value={`$${predictions.predictedPrice.toFixed(2)}`}
                    sub={fmtPct(
                        ((predictions.predictedPrice - predictions.currentPrice) /
                            predictions.currentPrice) *
                        100
                    )}
                    trend={
                        predictions.predictedPrice >= predictions.currentPrice
                            ? "up"
                            : "down"
                    }
                    color={PURPLE}
                />
            </div>

            {/* Assignment Probability */}
            <div style={{ ...cardStyle, padding: 22 }}>
                <div
                    style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: GOLD,
                        marginBottom: 18,
                        fontFamily: monoFont,
                        letterSpacing: 1,
                    }}
                >
                    ASSIGNMENT PROBABILITY
                </div>
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-around",
                        flexWrap: "wrap",
                        gap: 16,
                    }}
                >
                    <ProgressRing
                        pct={predictions.putAssignProb * 100}
                        color={AMBER}
                        label="Put Assign"
                    />
                    <ProgressRing
                        pct={predictions.callAssignProb * 100}
                        color={VIOLET}
                        label="Call Assign"
                    />
                    <ProgressRing
                        pct={(1 - predictions.putAssignProb) * 100}
                        color={GREEN}
                        label="Expires OTM"
                    />
                </div>
            </div>

            {/* Premium Estimates */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <StatCard
                    icon={Shield}
                    label="Put Prem"
                    value={fmt(predictions.putPremium)}
                    color={AMBER}
                />
                <StatCard
                    icon={Shield}
                    label="Call Prem"
                    value={fmt(predictions.callPremium)}
                    color={VIOLET}
                />
            </div>

            {/* Monte Carlo Distribution */}
            <div style={{ ...cardStyle, padding: "18px 10px 10px" }}>
                <div
                    style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: GOLD,
                        marginBottom: 4,
                        paddingLeft: 8,
                        fontFamily: monoFont,
                    }}
                >
                    MONTE CARLO: {daysToExpiry}-DAY
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
                    1,000 simulated paths
                </div>
                <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={predictions.distribution}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis
                            dataKey="range"
                            tick={{ fill: TEXT_SECONDARY, fontSize: 8 }}
                            angle={-45}
                            textAnchor="end"
                            height={45}
                            interval={2}
                        />
                        <YAxis tick={{ fill: TEXT_SECONDARY, fontSize: 9 }} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Bar
                            dataKey="count"
                            fill={GOLD}
                            radius={[3, 3, 0, 0]}
                            name="Scenarios"
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Confidence Intervals */}
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
                    CONFIDENCE INTERVALS
                </div>
                {[
                    { label: "P10 (Bear)", value: predictions.p10, color: RED },
                    { label: "P25", value: predictions.p25, color: AMBER },
                    { label: "P50 (Median)", value: predictions.p50, color: GREEN },
                    { label: "P75", value: predictions.p75, color: BLUE },
                    { label: "P90 (Bull)", value: predictions.p90, color: LAVENDER },
                ].map((p, i) => (
                    <div
                        key={i}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "7px 0",
                            borderBottom: i < 4 ? "1px solid #1e293b" : "none",
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div
                                style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: 4,
                                    background: p.color,
                                }}
                            />
                            <span
                                style={{
                                    fontSize: 12,
                                    color: TEXT_SECONDARY,
                                    fontFamily: monoFont,
                                }}
                            >
                                {p.label}
                            </span>
                        </div>
                        <span
                            style={{
                                fontSize: 13,
                                fontWeight: 700,
                                color: p.color,
                                fontFamily: monoFont,
                            }}
                        >
                            ${p.value.toFixed(2)}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PredictionsView;
