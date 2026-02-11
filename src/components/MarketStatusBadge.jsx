// ─── MARKET STATUS BADGE ───
import { GOLD, GREEN, RED, AMBER, TEXT_SECONDARY, DARK_CARD, monoFont } from "../constants";

const STATUS_CONFIG = {
    open: { color: GREEN, label: "MARKET OPEN", icon: "🟢", glow: "rgba(74,222,128,0.3)" },
    "pre-market": { color: AMBER, label: "PRE-MARKET", icon: "🟡", glow: "rgba(245,158,11,0.3)" },
    "after-hours": { color: AMBER, label: "AFTER HOURS", icon: "🟠", glow: "rgba(245,158,11,0.3)" },
    closed: { color: RED, label: "MARKET CLOSED", icon: "🔴", glow: "rgba(248,113,113,0.2)" },
};

export default function MarketStatusBadge({ status, style = {} }) {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.closed;
    return (
        <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "6px 14px", borderRadius: 20,
            background: `linear-gradient(135deg, ${DARK_CARD}, rgba(0,0,0,0.4))`,
            border: `1px solid ${cfg.color}40`,
            boxShadow: `0 0 12px ${cfg.glow}`,
            fontFamily: monoFont, fontSize: 11, fontWeight: 600,
            letterSpacing: 1.2, color: cfg.color,
            ...style,
        }}>
            <span style={{ fontSize: 8 }}>{cfg.icon}</span>
            {cfg.label}
        </div>
    );
}
