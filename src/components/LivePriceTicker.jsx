// ─── LIVE PRICE TICKER COMPONENT ───
import { useLivePrice } from "../services/marketDataHooks";
import { GOLD, GREEN, RED, TEXT_PRIMARY, TEXT_SECONDARY, monoFont } from "../constants";

export default function LivePriceTicker({ ticker, showChange = true, size = "md", style = {} }) {
    const { price, change, changePercent, loading } = useLivePrice(ticker, 60000);

    const sizes = {
        sm: { price: 14, change: 10, gap: 4 },
        md: { price: 20, change: 12, gap: 6 },
        lg: { price: 28, change: 14, gap: 8 },
        xl: { price: 36, change: 16, gap: 10 },
    };
    const s = sizes[size] || sizes.md;

    if (loading && !price) {
        return (
            <span style={{
                fontFamily: monoFont, fontSize: s.price, color: TEXT_SECONDARY,
                ...style,
            }}>
                —
            </span>
        );
    }

    const isPositive = change >= 0;
    const changeColor = isPositive ? GREEN : RED;

    return (
        <span style={{ display: "inline-flex", alignItems: "baseline", gap: s.gap, ...style }}>
            <span style={{
                fontFamily: monoFont, fontSize: s.price, fontWeight: 700,
                color: TEXT_PRIMARY,
            }}>
                ${price?.toFixed(2)}
            </span>
            {showChange && change !== null && (
                <span style={{
                    fontFamily: monoFont, fontSize: s.change, fontWeight: 600,
                    color: changeColor,
                }}>
                    {isPositive ? "+" : ""}{change?.toFixed(2)} ({isPositive ? "+" : ""}{changePercent?.toFixed(2)}%)
                </span>
            )}
        </span>
    );
}
