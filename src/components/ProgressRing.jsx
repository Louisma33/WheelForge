import { GOLD, TEXT_PRIMARY, monoFont, TEXT_SECONDARY } from "../constants";

const ProgressRing = ({ pct, size = 80, stroke = 6, color = GOLD, label }) => {
    const r = (size - stroke) / 2;
    const circ = 2 * Math.PI * r;
    const clampedPct = Math.max(0, Math.min(100, pct));

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                position: "relative",
            }}
        >
            <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    fill="none"
                    stroke="#1a1a2e"
                    strokeWidth={stroke}
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    fill="none"
                    stroke={color}
                    strokeWidth={stroke}
                    strokeDasharray={circ}
                    strokeDashoffset={circ - (clampedPct / 100) * circ}
                    strokeLinecap="round"
                    style={{ transition: "stroke-dashoffset 1s ease" }}
                />
            </svg>
            <span
                style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: TEXT_PRIMARY,
                    fontFamily: monoFont,
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -70%)",
                }}
            >
                {clampedPct.toFixed(1)}%
            </span>
            <span
                style={{
                    fontSize: 10,
                    color: TEXT_SECONDARY,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    marginTop: 4,
                }}
            >
                {label}
            </span>
        </div>
    );
};

export default ProgressRing;
