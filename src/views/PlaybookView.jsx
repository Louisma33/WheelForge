import { useState, useCallback } from "react";
import {
    GOLD, GOLD_LIGHT, cardStyle, monoFont, sansFont,
    TEXT_SECONDARY, GREEN, RED, AMBER,
} from "../constants";
import { STRATEGIES, recommendStrategies } from "../engine/strategyPlaybook";

// ─── STRATEGY PLAYBOOK VIEW ───
export default function PlaybookView({ answers, onApplyStrategy, currentParams }) {
    const [selectedId, setSelectedId] = useState(null);
    const [comparing, setComparing] = useState(false);

    // Sort strategies by fit if user has answers
    const rankedStrategies = answers && Object.keys(answers).length >= 5
        ? recommendStrategies(answers)
        : STRATEGIES;

    const selected = rankedStrategies.find((s) => s.id === selectedId);

    const handleApply = useCallback((strategy) => {
        if (onApplyStrategy) {
            onApplyStrategy(strategy);
        }
    }, [onApplyStrategy]);

    const riskDots = (level) => {
        return Array.from({ length: 5 }, (_, i) => (
            <span
                key={i}
                style={{
                    display: "inline-block",
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: i < level
                        ? level <= 2 ? GREEN : level <= 3 ? AMBER : RED
                        : "rgba(255,255,255,0.08)",
                    marginRight: 2,
                }}
            />
        ));
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "12px 0" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: `linear-gradient(135deg, ${GOLD}22, ${GOLD}44)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 16,
                }}>
                    📋
                </div>
                <div>
                    <div style={{ fontFamily: monoFont, fontSize: 12, fontWeight: 700, color: GOLD, letterSpacing: 1 }}>
                        STRATEGY PLAYBOOK
                    </div>
                    <div style={{ fontSize: 10, color: TEXT_SECONDARY, fontFamily: monoFont }}>
                        {answers && Object.keys(answers).length >= 5
                            ? "Ranked by your profile fit"
                            : "Pre-built wheel strategies"}
                    </div>
                </div>
            </div>

            {/* Strategy Cards */}
            {rankedStrategies.map((strategy, idx) => {
                const isSelected = selectedId === strategy.id;
                const isCurrent = currentParams &&
                    currentParams.otmPct === strategy.params.otmPct / 100 &&
                    currentParams.daysToExpiry === strategy.params.daysToExpiry;

                return (
                    <div key={strategy.id} style={{ animation: `slideUp 0.3s ease ${idx * 0.05}s both` }}>
                        {/* Card */}
                        <div
                            onClick={() => setSelectedId(isSelected ? null : strategy.id)}
                            style={{
                                ...cardStyle,
                                padding: isSelected ? "18px 16px 0" : "18px 16px",
                                cursor: "pointer",
                                borderColor: isSelected ? `${strategy.color}44` : isCurrent ? `${GOLD}44` : cardStyle.borderColor,
                                transition: "all 0.3s ease",
                                position: "relative",
                                overflow: "hidden",
                            }}
                        >
                            {/* Fit Score Badge */}
                            {strategy.fitScore !== undefined && strategy.fitScore > 0 && (
                                <div style={{
                                    position: "absolute", top: 10, right: 12,
                                    padding: "3px 8px", borderRadius: 6,
                                    background: strategy.fitScore >= 70 ? `${GREEN}15` : `${AMBER}15`,
                                    border: `1px solid ${strategy.fitScore >= 70 ? GREEN : AMBER}33`,
                                    fontFamily: monoFont, fontSize: 9, fontWeight: 700,
                                    color: strategy.fitScore >= 70 ? GREEN : AMBER,
                                }}>
                                    {strategy.fitScore}% FIT
                                </div>
                            )}

                            {/* Current Badge */}
                            {isCurrent && (
                                <div style={{
                                    position: "absolute", top: 10, right: 12,
                                    padding: "3px 8px", borderRadius: 6,
                                    background: `${GOLD}15`, border: `1px solid ${GOLD}33`,
                                    fontFamily: monoFont, fontSize: 9, fontWeight: 700, color: GOLD,
                                }}>
                                    ACTIVE
                                </div>
                            )}

                            {/* Header Row */}
                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                                <div style={{
                                    width: 40, height: 40, borderRadius: 10,
                                    background: `${strategy.color}12`,
                                    border: `1px solid ${strategy.color}33`,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontSize: 20,
                                    flexShrink: 0,
                                }}>
                                    {strategy.emoji}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{
                                        fontFamily: sansFont, fontSize: 14, fontWeight: 700,
                                        color: strategy.color,
                                    }}>
                                        {strategy.name}
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                                        {riskDots(strategy.riskLevel)}
                                        <span style={{ fontFamily: monoFont, fontSize: 9, color: TEXT_SECONDARY }}>
                                            {strategy.ticker} · {strategy.params.daysToExpiry}DTE · {strategy.params.otmPct}% OTM
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            <div style={{
                                fontFamily: monoFont, fontSize: 11, color: TEXT_SECONDARY,
                                lineHeight: 1.6, marginBottom: isSelected ? 0 : 0,
                            }}>
                                {strategy.description}
                            </div>

                            {/* ─── Expanded Details ─── */}
                            {isSelected && (
                                <div style={{
                                    marginTop: 14, paddingTop: 14,
                                    borderTop: `1px solid ${strategy.color}22`,
                                    animation: "slideUp 0.2s ease",
                                }}>
                                    {/* Target Metrics */}
                                    <div style={{
                                        fontFamily: monoFont, fontSize: 10, color: TEXT_SECONDARY,
                                        marginBottom: 8, letterSpacing: 0.5,
                                    }}>
                                        TARGET METRICS
                                    </div>
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, marginBottom: 14 }}>
                                        {[
                                            { label: "Monthly Return", value: strategy.targets.monthlyReturn, color: GREEN },
                                            { label: "Annual Return", value: strategy.targets.annualReturn, color: strategy.color },
                                            { label: "Max Drawdown", value: strategy.targets.maxDrawdown, color: AMBER },
                                            { label: "Assignment Freq", value: strategy.targets.assignmentFreq, color: TEXT_SECONDARY },
                                        ].map((m, i) => (
                                            <div key={i} style={{
                                                padding: "8px 10px", borderRadius: 8,
                                                background: "rgba(255,255,255,0.02)",
                                                border: "1px solid rgba(255,255,255,0.06)",
                                            }}>
                                                <div style={{ fontFamily: monoFont, fontSize: 9, color: TEXT_SECONDARY }}>{m.label}</div>
                                                <div style={{ fontFamily: monoFont, fontSize: 12, fontWeight: 600, color: m.color, marginTop: 2 }}>
                                                    {m.value}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Suitability */}
                                    <div style={{
                                        padding: "10px 14px", borderRadius: 10, marginBottom: 14,
                                        background: `${strategy.color}08`,
                                        border: `1px solid ${strategy.color}18`,
                                    }}>
                                        <div style={{ fontFamily: monoFont, fontSize: 9, color: TEXT_SECONDARY, marginBottom: 4, letterSpacing: 0.5 }}>
                                            BEST FOR
                                        </div>
                                        <div style={{ fontFamily: monoFont, fontSize: 11, color: strategy.color }}>
                                            {strategy.suitability}
                                        </div>
                                    </div>

                                    {/* Tips */}
                                    <div style={{ fontFamily: monoFont, fontSize: 10, color: TEXT_SECONDARY, marginBottom: 8, letterSpacing: 0.5 }}>
                                        PRO TIPS
                                    </div>
                                    {strategy.tips.map((tip, i) => (
                                        <div key={i} style={{
                                            display: "flex", alignItems: "flex-start", gap: 8,
                                            padding: "6px 0",
                                        }}>
                                            <span style={{ color: GOLD, fontSize: 10, flexShrink: 0, marginTop: 1 }}>▸</span>
                                            <span style={{ fontFamily: monoFont, fontSize: 10, color: TEXT_SECONDARY, lineHeight: 1.6 }}>
                                                {tip}
                                            </span>
                                        </div>
                                    ))}

                                    {/* Parameters Preview + Apply Button */}
                                    <div style={{
                                        display: "flex", alignItems: "center", gap: 10,
                                        marginTop: 14, padding: "14px 0 16px",
                                        borderTop: `1px solid ${strategy.color}18`,
                                    }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontFamily: monoFont, fontSize: 9, color: TEXT_SECONDARY, marginBottom: 4 }}>
                                                PARAMETERS
                                            </div>
                                            <div style={{ fontFamily: monoFont, fontSize: 10, color: TEXT_SECONDARY }}>
                                                {strategy.ticker} · ${strategy.params.initialCash.toLocaleString()} · {strategy.params.otmPct}% OTM · {strategy.params.daysToExpiry}DTE · {strategy.params.contracts}x
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleApply(strategy);
                                            }}
                                            style={{
                                                padding: "10px 20px",
                                                borderRadius: 10,
                                                border: "none",
                                                background: `linear-gradient(135deg, ${strategy.color}, ${strategy.color}bb)`,
                                                color: "#0a0a1a",
                                                fontFamily: monoFont,
                                                fontSize: 11,
                                                fontWeight: 700,
                                                cursor: "pointer",
                                                letterSpacing: 0.5,
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            ⚡ APPLY
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}

            {/* Footer */}
            <div style={{
                padding: 14, borderRadius: 12,
                background: "rgba(201,168,76,0.04)",
                border: "1px solid rgba(201,168,76,0.1)",
            }}>
                <div style={{ fontFamily: monoFont, fontSize: 10, color: GOLD, fontWeight: 600, marginBottom: 4 }}>
                    💡 HOW TO USE THE PLAYBOOK
                </div>
                <div style={{ fontFamily: monoFont, fontSize: 10, color: TEXT_SECONDARY, lineHeight: 1.7 }}>
                    Tap a strategy to see its full details. Hit <strong style={{ color: GOLD }}>APPLY</strong> to load those parameters into your simulator.
                    Run the simulation to see how each strategy performs.
                    {answers && Object.keys(answers).length >= 5
                        ? " Strategies are ranked by your profile fit — but feel free to experiment!"
                        : " Complete onboarding for personalized strategy rankings."}
                </div>
            </div>
        </div>
    );
}
