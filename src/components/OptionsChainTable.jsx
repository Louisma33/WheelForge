// ─── OPTIONS CHAIN TABLE ───
import { useState, useMemo } from "react";
import {
    GOLD, GOLD_LIGHT, GREEN, RED, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_MUTED,
    DARK_CARD, DARK_SURFACE, DARK_BORDER, AMBER, BLUE,
    monoFont, sansFont, cardStyle,
} from "../constants";

export default function OptionsChainTable({ contracts = [], underlyingPrice, onSelectContract, compact = false }) {
    const [contractType, setContractType] = useState("put");
    const [sortBy, setSortBy] = useState("strikePrice");
    const [sortDir, setSortDir] = useState("asc");

    // Group by expiration
    const expirations = useMemo(() => {
        const dates = [...new Set(contracts.map((c) => c.expirationDate))].sort();
        return dates;
    }, [contracts]);

    const [selectedExp, setSelectedExp] = useState(expirations[0] || "");

    // Filter and sort
    const filteredContracts = useMemo(() => {
        let filtered = contracts.filter(
            (c) => c.contractType === contractType && c.expirationDate === (selectedExp || expirations[0])
        );
        filtered.sort((a, b) => {
            const aVal = a[sortBy], bVal = b[sortBy];
            return sortDir === "asc" ? aVal - bVal : bVal - aVal;
        });
        return filtered;
    }, [contracts, contractType, selectedExp, expirations, sortBy, sortDir]);

    const daysToExp = useMemo(() => {
        if (!selectedExp) return 0;
        return Math.max(0, Math.round((new Date(selectedExp) - new Date()) / 86400000));
    }, [selectedExp]);

    const toggleSort = (col) => {
        if (sortBy === col) setSortDir((d) => d === "asc" ? "desc" : "asc");
        else { setSortBy(col); setSortDir("asc"); }
    };

    const SortArrow = ({ col }) => sortBy === col ? (sortDir === "asc" ? " ↑" : " ↓") : "";

    const columns = compact
        ? [
            { key: "strikePrice", label: "Strike", fmt: (v) => `$${v.toFixed(2)}` },
            { key: "bid", label: "Bid", fmt: (v) => `$${v.toFixed(2)}` },
            { key: "ask", label: "Ask", fmt: (v) => `$${v.toFixed(2)}` },
            { key: "delta", label: "Delta", fmt: (v) => v.toFixed(3) },
            { key: "impliedVolatility", label: "IV", fmt: (v) => `${(v * 100).toFixed(1)}%` },
        ]
        : [
            { key: "strikePrice", label: "Strike", fmt: (v) => `$${v.toFixed(2)}` },
            { key: "bid", label: "Bid", fmt: (v) => `$${v.toFixed(2)}` },
            { key: "ask", label: "Ask", fmt: (v) => `$${v.toFixed(2)}` },
            { key: "lastPrice", label: "Last", fmt: (v) => `$${v.toFixed(2)}` },
            { key: "delta", label: "Delta", fmt: (v) => v.toFixed(3) },
            { key: "gamma", label: "Gamma", fmt: (v) => v.toFixed(4) },
            { key: "theta", label: "Theta", fmt: (v) => v.toFixed(3) },
            { key: "vega", label: "Vega", fmt: (v) => v.toFixed(3) },
            { key: "impliedVolatility", label: "IV", fmt: (v) => `${(v * 100).toFixed(1)}%` },
            { key: "volume", label: "Vol", fmt: (v) => v.toLocaleString() },
            { key: "openInterest", label: "OI", fmt: (v) => v.toLocaleString() },
        ];

    return (
        <div style={{ ...cardStyle, padding: 16, overflow: "hidden" }}>
            {/* Header Controls */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
                {/* Put / Call Toggle */}
                <div style={{ display: "flex", borderRadius: 10, overflow: "hidden", border: `1px solid ${DARK_BORDER}` }}>
                    {["put", "call"].map((type) => (
                        <button
                            key={type}
                            onClick={() => setContractType(type)}
                            style={{
                                padding: "7px 18px", border: "none", cursor: "pointer",
                                fontFamily: monoFont, fontSize: 12, fontWeight: 700,
                                textTransform: "uppercase", letterSpacing: 1,
                                background: contractType === type
                                    ? (type === "put" ? `${RED}22` : `${GREEN}22`)
                                    : "transparent",
                                color: contractType === type
                                    ? (type === "put" ? RED : GREEN)
                                    : TEXT_SECONDARY,
                                transition: "all 0.2s",
                            }}
                        >
                            {type}s
                        </button>
                    ))}
                </div>

                {/* Expiration Selector */}
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {expirations.slice(0, 6).map((exp) => (
                        <button
                            key={exp}
                            onClick={() => setSelectedExp(exp)}
                            style={{
                                padding: "5px 10px", borderRadius: 8,
                                fontFamily: monoFont, fontSize: 10, fontWeight: 600,
                                cursor: "pointer", transition: "all 0.2s",
                                background: exp === (selectedExp || expirations[0]) ? `${GOLD}22` : "transparent",
                                color: exp === (selectedExp || expirations[0]) ? GOLD : TEXT_SECONDARY,
                                border: `1px solid ${exp === (selectedExp || expirations[0]) ? `${GOLD}44` : "transparent"}`,
                            }}
                        >
                            {new Date(exp + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            <span style={{ opacity: 0.6, marginLeft: 3 }}>
                                ({Math.max(0, Math.round((new Date(exp) - new Date()) / 86400000))}d)
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* DTE Info */}
            <div style={{ marginBottom: 10, fontFamily: monoFont, fontSize: 11, color: TEXT_SECONDARY }}>
                {filteredContracts.length} {contractType}s • {daysToExp} DTE • Underlying: ${underlyingPrice?.toFixed(2) || "—"}
            </div>

            {/* Table */}
            <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: monoFont, fontSize: 12 }}>
                    <thead>
                        <tr>
                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    onClick={() => toggleSort(col.key)}
                                    style={{
                                        padding: "8px 6px", textAlign: "right", cursor: "pointer",
                                        color: GOLD_LIGHT, fontWeight: 600, fontSize: 10,
                                        borderBottom: `1px solid ${DARK_BORDER}`,
                                        whiteSpace: "nowrap", userSelect: "none",
                                        letterSpacing: 0.8,
                                    }}
                                >
                                    {col.label}<SortArrow col={col.key} />
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredContracts.map((c, i) => {
                            const isATM = underlyingPrice && Math.abs(c.strikePrice - underlyingPrice) < (underlyingPrice * 0.01);
                            const isITM = contractType === "put"
                                ? c.strikePrice > underlyingPrice
                                : c.strikePrice < underlyingPrice;

                            return (
                                <tr
                                    key={c.contractTicker || i}
                                    onClick={() => onSelectContract?.(c)}
                                    style={{
                                        cursor: onSelectContract ? "pointer" : "default",
                                        background: isATM
                                            ? `${GOLD}0d`
                                            : isITM ? `${BLUE}08` : "transparent",
                                        transition: "background 0.15s",
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.background = `${GOLD}15`}
                                    onMouseOut={(e) => e.currentTarget.style.background = isATM ? `${GOLD}0d` : isITM ? `${BLUE}08` : "transparent"}
                                >
                                    {columns.map((col) => (
                                        <td
                                            key={col.key}
                                            style={{
                                                padding: "7px 6px", textAlign: "right",
                                                borderBottom: `1px solid ${DARK_BORDER}33`,
                                                color: col.key === "strikePrice"
                                                    ? (isATM ? GOLD : TEXT_PRIMARY)
                                                    : TEXT_MUTED,
                                                fontWeight: col.key === "strikePrice" ? 700 : 400,
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {col.fmt(c[col.key])}
                                            {col.key === "strikePrice" && isATM && (
                                                <span style={{ color: GOLD, fontSize: 9, marginLeft: 4, opacity: 0.7 }}>ATM</span>
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {filteredContracts.length === 0 && (
                <div style={{ padding: 30, textAlign: "center", color: TEXT_SECONDARY, fontFamily: monoFont, fontSize: 12 }}>
                    No contracts available for this selection
                </div>
            )}
        </div>
    );
}
