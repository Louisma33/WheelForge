import { GOLD, monoFont } from "../constants";

const Tab = ({ active, label, icon: Icon, onClick, badge }) => (
    <button
        onClick={onClick}
        style={{
            background: active
                ? `linear-gradient(135deg, ${GOLD}, #a88832)`
                : "transparent",
            color: active ? "#0a0a1a" : "#8892a4",
            border: active ? "none" : "1px solid rgba(201,168,76,0.2)",
            borderRadius: 12,
            padding: "10px 16px",
            fontSize: 13,
            fontWeight: active ? 700 : 500,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontFamily: monoFont,
            transition: "all 0.3s ease",
            whiteSpace: "nowrap",
            position: "relative",
        }}
    >
        <Icon size={14} />
        {label}
        {badge && (
            <span
                style={{
                    position: "absolute",
                    top: -4,
                    right: -4,
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    background: "#4ade80",
                }}
            />
        )}
    </button>
);

export default Tab;
