import { useState, useMemo } from "react";
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, RadialBarChart, RadialBar,
} from "recharts";
import {
    GOLD, GOLD_LIGHT, cardStyle, monoFont, sansFont,
    TEXT_SECONDARY, GREEN, RED, AMBER, PURPLE, BLUE,
} from "../constants";
import { generateRiskReport } from "../engine/riskAnalytics";
import StatCard from "../components/StatCard";

// ─── RISK ANALYTICS VIEW ───
export default function RiskAnalyticsView({ results, ticker, riskFreeRate = 0.05 }) {
    const [activeSection, setActiveSection] = useState("overview");

    const report = useMemo(() => {
        if (!results) return null;
        return generateRiskReport(results, riskFreeRate);
    }, [results, riskFreeRate]);

    if (!results || !report) {
        return (
            <div style={{ ...cardStyle, padding: 40, textAlign: "center", margin: "12px 0" }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🛡️</div>
                <div style={{ color: TEXT_SECONDARY, fontFamily: monoFont, fontSize: 13 }}>
                    Run a simulation to see risk analytics
                </div>
            </div>
        );
    }

    const { vaR, sortino, kelly, drawdowns, streaks, riskScore } = report;

    const sectionTabs = [
        { id: "overview", label: "Overview" },
        { id: "var", label: "VaR" },
        { id: "position", label: "Position" },
        { id: "drawdown", label: "Drawdowns" },
    ];

    // ─── Risk Score Gauge ───
    const gaugeData = [
        { name: "Risk", value: riskScore.score, fill: riskScore.color },
    ];

    // ─── VaR Distribution Chart ───
    const varData = [
        { name: "Best Day", value: vaR.bestDay, fill: GREEN },
        { name: "VaR (95%)", value: -vaR.vaR, fill: AMBER },
        { name: "CVaR", value: -vaR.cVaR, fill: RED },
        { name: "Worst Day", value: vaR.worstDay, fill: "#991b1b" },
    ];

    // ─── Risk Factor Breakdown ───
    const factorData = riskScore.factors.map((f) => ({
        name: f.name,
        value: parseFloat(f.impact),
        fill: parseFloat(f.impact) > 15 ? RED : parseFloat(f.impact) > 8 ? AMBER : GREEN,
    }));

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "12px 0" }}>
            {/* Section Title */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: `linear-gradient(135deg, ${riskScore.color}22, ${riskScore.color}44)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 16,
                }}>
                    🛡️
                </div>
                <div>
                    <div style={{ fontFamily: monoFont, fontSize: 12, fontWeight: 700, color: GOLD, letterSpacing: 1 }}>
                        RISK ANALYTICS
                    </div>
                    <div style={{ fontSize: 10, color: TEXT_SECONDARY, fontFamily: monoFont }}>
                        {ticker} · {results.trades?.length || 0} trades analyzed
                    </div>
                </div>
            </div>

            {/* Sub-tabs */}
            <div style={{ display: "flex", gap: 6, overflowX: "auto" }}>
                {sectionTabs.map((t) => (
                    <button
                        key={t.id}
                        onClick={() => setActiveSection(t.id)}
                        style={{
                            padding: "6px 14px",
                            borderRadius: 8,
                            border: activeSection === t.id ? `1px solid ${GOLD}66` : "1px solid rgba(255,255,255,0.06)",
                            background: activeSection === t.id ? `${GOLD}15` : "rgba(255,255,255,0.03)",
                            color: activeSection === t.id ? GOLD : TEXT_SECONDARY,
                            fontFamily: monoFont,
                            fontSize: 11,
                            fontWeight: activeSection === t.id ? 700 : 400,
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                        }}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* ─── OVERVIEW ─── */}
            {activeSection === "overview" && (
                <>
                    {/* Risk Score Gauge */}
                    <div style={{ ...cardStyle, padding: 20, textAlign: "center" }}>
                        <div style={{ fontFamily: monoFont, fontSize: 11, color: TEXT_SECONDARY, marginBottom: 10, letterSpacing: 1 }}>
                            COMPOSITE RISK SCORE
                        </div>
                        <div style={{ width: "100%", maxWidth: 200, margin: "0 auto" }}>
                            <ResponsiveContainer width="100%" height={160}>
                                <RadialBarChart
                                    innerRadius="60%"
                                    outerRadius="100%"
                                    data={gaugeData}
                                    startAngle={180}
                                    endAngle={0}
                                    barSize={14}
                                >
                                    <RadialBar
                                        background={{ fill: "rgba(255,255,255,0.04)" }}
                                        dataKey="value"
                                        cornerRadius={7}
                                    />
                                </RadialBarChart>
                            </ResponsiveContainer>
                        </div>
                        <div style={{ marginTop: -30 }}>
                            <div style={{ fontSize: 36, fontWeight: 800, fontFamily: sansFont, color: riskScore.color }}>
                                {riskScore.score}
                            </div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: riskScore.color, fontFamily: monoFont, letterSpacing: 0.5 }}>
                                {riskScore.label} Risk
                            </div>
                        </div>
                    </div>

                    {/* Key Metrics Grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
                        <StatCard
                            label="Max Drawdown"
                            value={`-${drawdowns.maxDrawdown.toFixed(1)}%`}
                            icon="📉"
                            color={drawdowns.maxDrawdown > 15 ? RED : drawdowns.maxDrawdown > 8 ? AMBER : GREEN}
                        />
                        <StatCard
                            label="Daily VaR (95%)"
                            value={`-${vaR.vaR.toFixed(2)}%`}
                            icon="⚠️"
                            color={vaR.vaR > 3 ? RED : vaR.vaR > 1.5 ? AMBER : GREEN}
                        />
                        <StatCard
                            label="Sortino Ratio"
                            value={sortino.toFixed(2)}
                            icon="📊"
                            color={sortino > 2 ? GREEN : sortino > 1 ? AMBER : RED}
                        />
                        <StatCard
                            label="Win Rate"
                            value={`${kelly.winRate || 0}%`}
                            icon="🎯"
                            color={(kelly.winRate || 0) > 70 ? GREEN : (kelly.winRate || 0) > 50 ? AMBER : RED}
                        />
                    </div>

                    {/* Risk Factors Breakdown */}
                    <div style={{ ...cardStyle, padding: 16 }}>
                        <div style={{ fontFamily: monoFont, fontSize: 11, color: TEXT_SECONDARY, marginBottom: 12, letterSpacing: 1 }}>
                            RISK FACTOR BREAKDOWN
                        </div>
                        <ResponsiveContainer width="100%" height={180}>
                            <BarChart data={factorData} layout="vertical">
                                <XAxis type="number" domain={[0, 30]} tick={{ fill: TEXT_SECONDARY, fontSize: 10, fontFamily: monoFont }} />
                                <YAxis type="category" dataKey="name" width={110} tick={{ fill: TEXT_SECONDARY, fontSize: 10, fontFamily: monoFont }} />
                                <Tooltip
                                    contentStyle={{ background: "#1a1a2e", border: `1px solid ${GOLD}44`, borderRadius: 8, fontFamily: monoFont, fontSize: 11 }}
                                    formatter={(val) => [`${val} pts`, "Impact"]}
                                />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={16}>
                                    {factorData.map((entry, i) => (
                                        <Cell key={i} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </>
            )}

            {/* ─── VAR SECTION ─── */}
            {activeSection === "var" && (
                <>
                    <div style={{ ...cardStyle, padding: 20 }}>
                        <div style={{ fontFamily: monoFont, fontSize: 11, color: TEXT_SECONDARY, marginBottom: 12, letterSpacing: 1 }}>
                            VALUE AT RISK — DAILY DISTRIBUTION
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginBottom: 16 }}>
                            {[
                                { label: "VaR (95%)", value: `-${vaR.vaR}%`, desc: "Max daily loss, 95% confidence", color: AMBER },
                                { label: "CVaR (ES)", value: `-${vaR.cVaR}%`, desc: "Avg loss beyond VaR threshold", color: RED },
                                { label: "Best Day", value: `+${vaR.bestDay}%`, desc: "Largest single-day gain", color: GREEN },
                                { label: "Worst Day", value: `${vaR.worstDay}%`, desc: "Largest single-day loss", color: "#991b1b" },
                            ].map((m, i) => (
                                <div key={i} style={{
                                    padding: 12, borderRadius: 10,
                                    background: `${m.color}08`,
                                    border: `1px solid ${m.color}22`,
                                }}>
                                    <div style={{ fontSize: 10, color: TEXT_SECONDARY, fontFamily: monoFont, letterSpacing: 0.5 }}>{m.label}</div>
                                    <div style={{ fontSize: 18, fontWeight: 700, color: m.color, fontFamily: sansFont, marginTop: 4 }}>{m.value}</div>
                                    <div style={{ fontSize: 9, color: TEXT_SECONDARY, fontFamily: monoFont, marginTop: 4 }}>{m.desc}</div>
                                </div>
                            ))}
                        </div>

                        <ResponsiveContainer width="100%" height={180}>
                            <BarChart data={varData}>
                                <XAxis dataKey="name" tick={{ fill: TEXT_SECONDARY, fontSize: 10, fontFamily: monoFont }} />
                                <YAxis tick={{ fill: TEXT_SECONDARY, fontSize: 10, fontFamily: monoFont }} tickFormatter={(v) => `${v}%`} />
                                <Tooltip
                                    contentStyle={{ background: "#1a1a2e", border: `1px solid ${GOLD}44`, borderRadius: 8, fontFamily: monoFont, fontSize: 11 }}
                                    formatter={(val) => [`${val.toFixed(2)}%`, "Return"]}
                                />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={32}>
                                    {varData.map((entry, i) => (
                                        <Cell key={i} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>

                        <div style={{
                            marginTop: 14, padding: 12, borderRadius: 10,
                            background: "rgba(201,168,76,0.05)", border: "1px solid rgba(201,168,76,0.15)",
                        }}>
                            <div style={{ fontFamily: monoFont, fontSize: 10, color: GOLD, fontWeight: 600, marginBottom: 6 }}>
                                💡 WHAT THIS MEANS
                            </div>
                            <div style={{ fontFamily: monoFont, fontSize: 10, color: TEXT_SECONDARY, lineHeight: 1.7 }}>
                                With 95% confidence, your daily portfolio loss will not exceed <strong style={{ color: AMBER }}>{vaR.vaR}%</strong>.
                                In the worst 5% of days, average loss is <strong style={{ color: RED }}>{vaR.cVaR}%</strong> (CVaR).
                                {vaR.vaR < 1.5
                                    ? " Your risk exposure is well-contained."
                                    : vaR.vaR < 3
                                        ? " Moderate risk — consider tightening OTM% or extending DTE."
                                        : " High risk — consider reducing position size or using deeper OTM strikes."}
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* ─── POSITION SIZING ─── */}
            {activeSection === "position" && (
                <>
                    <div style={{ ...cardStyle, padding: 20 }}>
                        <div style={{ fontFamily: monoFont, fontSize: 11, color: TEXT_SECONDARY, marginBottom: 12, letterSpacing: 1 }}>
                            KELLY CRITERION — OPTIMAL POSITION SIZE
                        </div>

                        <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 20 }}>
                            <div style={{ flex: 1, textAlign: "center" }}>
                                <div style={{ fontSize: 36, fontWeight: 800, fontFamily: sansFont, color: PURPLE }}>
                                    {kelly.kelly || 0}%
                                </div>
                                <div style={{ fontSize: 10, color: TEXT_SECONDARY, fontFamily: monoFont }}>Full Kelly</div>
                            </div>
                            <div style={{
                                width: 1, height: 40, background: "rgba(255,255,255,0.1)",
                            }} />
                            <div style={{ flex: 1, textAlign: "center" }}>
                                <div style={{ fontSize: 36, fontWeight: 800, fontFamily: sansFont, color: BLUE }}>
                                    {kelly.halfKelly || 0}%
                                </div>
                                <div style={{ fontSize: 10, color: TEXT_SECONDARY, fontFamily: monoFont }}>Half Kelly ★</div>
                            </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginBottom: 16 }}>
                            <div style={{ padding: 12, borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                                <div style={{ fontSize: 10, color: TEXT_SECONDARY, fontFamily: monoFont }}>Win Rate</div>
                                <div style={{ fontSize: 18, fontWeight: 700, color: GREEN, fontFamily: sansFont, marginTop: 4 }}>{kelly.winRate || 0}%</div>
                            </div>
                            <div style={{ padding: 12, borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                                <div style={{ fontSize: 10, color: TEXT_SECONDARY, fontFamily: monoFont }}>Payoff Ratio</div>
                                <div style={{ fontSize: 18, fontWeight: 700, color: AMBER, fontFamily: sansFont, marginTop: 4 }}>{kelly.payoffRatio || 0}x</div>
                            </div>
                        </div>

                        <div style={{
                            padding: 12, borderRadius: 10,
                            background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.15)",
                        }}>
                            <div style={{ fontFamily: monoFont, fontSize: 10, color: PURPLE, fontWeight: 600, marginBottom: 6 }}>
                                💡 HALF KELLY (RECOMMENDED)
                            </div>
                            <div style={{ fontFamily: monoFont, fontSize: 10, color: TEXT_SECONDARY, lineHeight: 1.7 }}>
                                Allocate <strong style={{ color: BLUE }}>{kelly.halfKelly || 0}%</strong> of your portfolio per trade.
                                Full Kelly maximizes growth but has high variance — half Kelly reduces volatility by ~50% while keeping ~75% of the growth rate.
                                {kelly.halfKelly > 25
                                    ? " Your edge is strong — but keep position sizes reasonable."
                                    : kelly.halfKelly > 10
                                        ? " Solid edge detected. Good position sizing."
                                        : " Edge is thin — consider smaller positions and tighter risk mgmt."}
                            </div>
                        </div>
                    </div>

                    {/* Streak Analysis */}
                    <div style={{ ...cardStyle, padding: 16 }}>
                        <div style={{ fontFamily: monoFont, fontSize: 11, color: TEXT_SECONDARY, marginBottom: 12, letterSpacing: 1 }}>
                            WIN/LOSS STREAKS
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                            <div style={{ textAlign: "center" }}>
                                <div style={{ fontSize: 24, fontWeight: 800, fontFamily: sansFont, color: GREEN }}>{streaks.maxConsecWins}</div>
                                <div style={{ fontSize: 9, color: TEXT_SECONDARY, fontFamily: monoFont }}>Max Win Streak</div>
                            </div>
                            <div style={{ textAlign: "center" }}>
                                <div style={{ fontSize: 24, fontWeight: 800, fontFamily: sansFont, color: RED }}>{streaks.maxConsecLosses}</div>
                                <div style={{ fontSize: 9, color: TEXT_SECONDARY, fontFamily: monoFont }}>Max Loss Streak</div>
                            </div>
                            <div style={{ textAlign: "center" }}>
                                <div style={{
                                    fontSize: 24, fontWeight: 800, fontFamily: sansFont,
                                    color: streaks.currentStreak > 0 ? GREEN : streaks.currentStreak < 0 ? RED : TEXT_SECONDARY,
                                }}>
                                    {streaks.currentStreak > 0 ? `+${streaks.currentStreak}` : streaks.currentStreak}
                                </div>
                                <div style={{ fontSize: 9, color: TEXT_SECONDARY, fontFamily: monoFont }}>Current Streak</div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* ─── DRAWDOWN ANALYSIS ─── */}
            {activeSection === "drawdown" && (
                <>
                    <div style={{ ...cardStyle, padding: 20 }}>
                        <div style={{ fontFamily: monoFont, fontSize: 11, color: TEXT_SECONDARY, marginBottom: 12, letterSpacing: 1 }}>
                            DRAWDOWN PROFILE
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginBottom: 16 }}>
                            <StatCard
                                label="Max Drawdown"
                                value={`-${drawdowns.maxDrawdown.toFixed(1)}%`}
                                icon="📉"
                                color={RED}
                            />
                            <StatCard
                                label="Current DD"
                                value={`-${drawdowns.currentDrawdown.toFixed(1)}%`}
                                icon="📍"
                                color={drawdowns.currentDrawdown > 0 ? AMBER : GREEN}
                            />
                            <StatCard
                                label="Max DD Duration"
                                value={`${drawdowns.maxDrawdownDuration}d`}
                                icon="⏱️"
                                color={drawdowns.maxDrawdownDuration > 30 ? RED : AMBER}
                            />
                            <StatCard
                                label="Recovery Rate"
                                value={`${drawdowns.recoveryRate}%`}
                                icon="🔄"
                                color={drawdowns.recoveryRate > 70 ? GREEN : AMBER}
                            />
                        </div>

                        {/* Drawdown History */}
                        {drawdowns.drawdownPeriods.length > 0 && (
                            <div>
                                <div style={{ fontFamily: monoFont, fontSize: 10, color: TEXT_SECONDARY, marginBottom: 8, letterSpacing: 0.5 }}>
                                    RECENT DRAWDOWN PERIODS
                                </div>
                                {drawdowns.drawdownPeriods.map((dd, i) => (
                                    <div key={i} style={{
                                        display: "flex", alignItems: "center", gap: 10,
                                        padding: "8px 12px", borderRadius: 8,
                                        marginBottom: 4,
                                        background: "rgba(248,113,113,0.04)",
                                        border: "1px solid rgba(248,113,113,0.1)",
                                    }}>
                                        <div style={{ fontSize: 14 }}>📉</div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontFamily: monoFont, fontSize: 10, color: RED }}>
                                                {dd.start} → {dd.end || "ongoing"}
                                            </div>
                                            <div style={{ fontFamily: monoFont, fontSize: 9, color: TEXT_SECONDARY }}>
                                                {dd.duration}d duration
                                            </div>
                                        </div>
                                        <div style={{ fontFamily: monoFont, fontSize: 12, fontWeight: 700, color: RED }}>
                                            -{(dd.depth * 100).toFixed(1)}%
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div style={{
                            marginTop: 14, padding: 12, borderRadius: 10,
                            background: "rgba(201,168,76,0.05)", border: "1px solid rgba(201,168,76,0.15)",
                        }}>
                            <div style={{ fontFamily: monoFont, fontSize: 10, color: GOLD, fontWeight: 600, marginBottom: 6 }}>
                                💡 DRAWDOWN INSIGHT
                            </div>
                            <div style={{ fontFamily: monoFont, fontSize: 10, color: TEXT_SECONDARY, lineHeight: 1.7 }}>
                                {drawdowns.maxDrawdown < 10
                                    ? "Excellent drawdown control. Your strategy demonstrates strong capital preservation."
                                    : drawdowns.maxDrawdown < 20
                                        ? "Manageable drawdown levels. Consider tightening stops during volatile periods."
                                        : "Significant drawdowns detected. Review position sizing and consider deeper OTM strikes or longer DTE."}
                                {drawdowns.recoveryRate > 70
                                    ? ` Recovery rate of ${drawdowns.recoveryRate}% is strong — most drawdowns resolve quickly.`
                                    : ` Recovery rate of ${drawdowns.recoveryRate}% suggests extended recovery periods. Plan for patience.`}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
