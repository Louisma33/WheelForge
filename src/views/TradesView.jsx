import {
    GOLD, cardStyle, monoFont, TEXT_SECONDARY, TEXT_PRIMARY,
    AMBER, VIOLET, RED, GREEN,
} from "../constants";

const TradesView = ({ results }) => {
    if (!results) return null;

    return (
        <div style={{ animation: "slideUp 0.4s ease" }}>
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
                    TRADE LOG ({results.trades.length})
                </div>
                <div style={{ minWidth: 480 }}>
                    {/* Header */}
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "80px 100px 75px 75px 75px",
                            gap: 6,
                            padding: "6px 0",
                            borderBottom: "1px solid rgba(201,168,76,0.2)",
                            fontSize: 9,
                            color: TEXT_SECONDARY,
                            textTransform: "uppercase",
                            letterSpacing: 1,
                            fontFamily: monoFont,
                        }}
                    >
                        <span>Date</span>
                        <span>Action</span>
                        <span>Strike</span>
                        <span>Premium</span>
                        <span>Price</span>
                    </div>

                    {/* Trade Rows */}
                    {results.trades.map((t, i) => (
                        <div
                            key={i}
                            style={{
                                display: "grid",
                                gridTemplateColumns: "80px 100px 75px 75px 75px",
                                gap: 6,
                                padding: "9px 0",
                                borderBottom: "1px solid #1e293b",
                                fontSize: 11,
                                fontFamily: monoFont,
                                transition: "background 0.2s ease",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = "rgba(201,168,76,0.03)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = "transparent";
                            }}
                        >
                            <span style={{ color: TEXT_SECONDARY }}>{t.date.slice(5)}</span>
                            <span
                                style={{
                                    color: t.type.includes("ASSIGNED")
                                        ? RED
                                        : t.type.includes("PUT")
                                            ? AMBER
                                            : VIOLET,
                                    fontWeight: 600,
                                }}
                            >
                                {t.type}
                            </span>
                            <span style={{ color: TEXT_PRIMARY }}>${t.strike}</span>
                            <span
                                style={{
                                    color: t.premium === "—" ? TEXT_SECONDARY : GREEN,
                                }}
                            >
                                {t.premium === "—"
                                    ? "—"
                                    : `$${parseFloat(t.premium).toFixed(0)}`}
                            </span>
                            <span style={{ color: TEXT_PRIMARY }}>${t.price}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TradesView;
