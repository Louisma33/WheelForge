import { Clock, TrendingUp, TrendingDown, Trash2 } from "lucide-react";
import {
    GOLD, cardStyle, monoFont, TEXT_PRIMARY, TEXT_SECONDARY,
    GREEN, RED,
} from "../constants";
import { fmt, fmtPct, getSimulationHistory, clearStorage } from "../utils";
import { useState, useEffect } from "react";

const HistoryView = ({ onLoad }) => {
    const [history, setHistory] = useState([]);

    useEffect(() => {
        setHistory(getSimulationHistory());
    }, []);

    const clearHistory = () => {
        clearStorage("simulations");
        setHistory([]);
    };

    if (history.length === 0) {
        return (
            <div
                style={{
                    ...cardStyle,
                    padding: 40,
                    textAlign: "center",
                    animation: "slideUp 0.4s ease",
                }}
            >
                <Clock size={32} color={GOLD} style={{ opacity: 0.5, marginBottom: 12 }} />
                <div style={{ fontSize: 15, fontWeight: 600, color: TEXT_PRIMARY, marginBottom: 6 }}>
                    No simulation history yet
                </div>
                <div style={{ fontSize: 12, color: TEXT_SECONDARY, fontFamily: monoFont }}>
                    Run your first simulation to start tracking results
                </div>
            </div>
        );
    }

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                animation: "slideUp 0.4s ease",
            }}
        >
            {/* Header */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
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
                    SIMULATION HISTORY ({history.length})
                </div>
                <button
                    onClick={clearHistory}
                    style={{
                        background: "transparent",
                        border: "1px solid rgba(248,113,113,0.3)",
                        borderRadius: 8,
                        padding: "6px 10px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        fontSize: 10,
                        color: RED,
                        fontFamily: monoFont,
                    }}
                >
                    <Trash2 size={10} /> Clear
                </button>
            </div>

            {/* History Cards */}
            {history.map((sim, i) => (
                <div
                    key={sim.id || i}
                    style={{
                        ...cardStyle,
                        padding: 16,
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = `${GOLD}40`;
                        e.currentTarget.style.transform = "translateY(-1px)";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "rgba(201,168,76,0.15)";
                        e.currentTarget.style.transform = "translateY(0)";
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: 8,
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div
                                style={{
                                    background: sim.wheelReturn >= 0 ? `${GREEN}20` : `${RED}20`,
                                    borderRadius: 8,
                                    padding: 6,
                                    display: "flex",
                                }}
                            >
                                {sim.wheelReturn >= 0 ? (
                                    <TrendingUp size={14} color={GREEN} />
                                ) : (
                                    <TrendingDown size={14} color={RED} />
                                )}
                            </div>
                            <div>
                                <div
                                    style={{
                                        fontSize: 14,
                                        fontWeight: 700,
                                        color: TEXT_PRIMARY,
                                        fontFamily: monoFont,
                                    }}
                                >
                                    {sim.ticker}
                                </div>
                                <div style={{ fontSize: 10, color: TEXT_SECONDARY, fontFamily: monoFont }}>
                                    {new Date(sim.timestamp).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </div>
                            </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                            <div
                                style={{
                                    fontSize: 14,
                                    fontWeight: 700,
                                    color: sim.wheelReturn >= 0 ? GREEN : RED,
                                    fontFamily: monoFont,
                                }}
                            >
                                {fmtPct(sim.wheelReturn)}
                            </div>
                            <div style={{ fontSize: 10, color: TEXT_SECONDARY, fontFamily: monoFont }}>
                                {fmt(sim.totalPremium)} premium
                            </div>
                        </div>
                    </div>

                    <div
                        style={{
                            display: "flex",
                            gap: 16,
                            fontSize: 10,
                            color: TEXT_SECONDARY,
                            fontFamily: monoFont,
                        }}
                    >
                        <span>OTM: {(sim.otmPct * 100).toFixed(0)}%</span>
                        <span>DTE: {sim.daysToExpiry}</span>
                        <span>Capital: {fmt(sim.initialCash)}</span>
                        <span>
                            {sim.putsSold + sim.callsSold} trades
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default HistoryView;
