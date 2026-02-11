import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { GOLD, cardStyle, monoFont, TEXT_PRIMARY, TEXT_SECONDARY } from "../constants";

const StatCard = ({ icon: Icon, label, value, sub, color = GOLD, trend }) => (
    <div
        style={{
            ...cardStyle,
            padding: "18px 16px",
            flex: "1 1 140px",
            minWidth: 140,
            position: "relative",
            overflow: "hidden",
            transition: "transform 0.2s ease, box-shadow 0.2s ease",
        }}
        onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = `0 8px 24px rgba(${color === GOLD ? "201,168,76" : "99,102,241"
                },0.15)`;
        }}
        onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
        }}
    >
        {/* Subtle glow accent */}
        <div
            style={{
                position: "absolute",
                top: -20,
                right: -20,
                width: 60,
                height: 60,
                borderRadius: "50%",
                background: `${color}08`,
                filter: "blur(20px)",
            }}
        />
        <div
            style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 10,
            }}
        >
            <div
                style={{
                    background: `${color}18`,
                    borderRadius: 10,
                    padding: 8,
                    display: "flex",
                }}
            >
                <Icon size={16} color={color} />
            </div>
            <span
                style={{
                    fontSize: 11,
                    color: TEXT_SECONDARY,
                    textTransform: "uppercase",
                    letterSpacing: 1.2,
                    fontFamily: monoFont,
                }}
            >
                {label}
            </span>
        </div>
        <div
            style={{
                fontSize: 22,
                fontWeight: 700,
                color: TEXT_PRIMARY,
                fontFamily: monoFont,
            }}
        >
            {value}
        </div>
        {sub && (
            <div
                style={{
                    fontSize: 12,
                    color:
                        trend === "up" ? "#4ade80" : trend === "down" ? "#f87171" : TEXT_SECONDARY,
                    marginTop: 4,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                }}
            >
                {trend === "up" && <ArrowUpRight size={12} />}
                {trend === "down" && <ArrowDownRight size={12} />}
                {sub}
            </div>
        )}
    </div>
);

export default StatCard;
