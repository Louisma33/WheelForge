import { blackScholes } from "./blackScholes";

// ─── WHEEL STRATEGY SIMULATOR ───
export const simulateWheel = (priceData, params) => {
    const { initialCash, otmPct, daysToExpiry, riskFreeRate, contracts } = params;
    const vol = priceData.volatility;
    const prices = priceData.data;
    let cash = initialCash,
        shares = 0,
        totalPremium = 0;
    let putsSold = 0,
        callsSold = 0,
        putsAssigned = 0,
        callsAssigned = 0;
    const history = [],
        trades = [];

    let i = 0;
    while (i < prices.length) {
        const S = prices[i].close,
            date = prices[i].date;

        if (shares === 0) {
            // ── Sell Cash-Secured Put ──
            const K = S * (1 - otmPct),
                T = daysToExpiry / 365;
            const premium =
                blackScholes(S, K, T, riskFreeRate, vol, "put") * 100 * contracts;
            cash += premium;
            totalPremium += premium;
            putsSold++;
            trades.push({
                date,
                type: "SELL PUT",
                strike: K.toFixed(2),
                premium: premium.toFixed(2),
                price: S.toFixed(2),
            });

            const ei = Math.min(i + daysToExpiry, prices.length - 1);
            if (ei >= prices.length) break;

            if (prices[ei].close < K) {
                shares = 100 * contracts;
                cash -= K * shares;
                putsAssigned++;
                trades.push({
                    date: prices[ei].date,
                    type: "PUT ASSIGNED",
                    strike: K.toFixed(2),
                    premium: "—",
                    price: prices[ei].close.toFixed(2),
                });
            }
            i = ei;
        } else {
            // ── Sell Covered Call ──
            const K = S * (1 + otmPct),
                T = daysToExpiry / 365;
            const premium =
                blackScholes(S, K, T, riskFreeRate, vol, "call") * 100 * contracts;
            cash += premium;
            totalPremium += premium;
            callsSold++;
            trades.push({
                date,
                type: "SELL CALL",
                strike: K.toFixed(2),
                premium: premium.toFixed(2),
                price: S.toFixed(2),
            });

            const ei = Math.min(i + daysToExpiry, prices.length - 1);
            if (ei >= prices.length) break;

            if (prices[ei].close > K) {
                cash += K * shares;
                shares = 0;
                callsAssigned++;
                trades.push({
                    date: prices[ei].date,
                    type: "CALL ASSIGNED",
                    strike: K.toFixed(2),
                    premium: "—",
                    price: prices[ei].close.toFixed(2),
                });
            }
            i = ei;
        }

        history.push({
            date: prices[i].date,
            value: parseFloat((cash + shares * prices[i].close).toFixed(2)),
            cash: parseFloat(cash.toFixed(2)),
            shares,
        });
    }

    const finalValue = cash + shares * prices[prices.length - 1].close;
    const bhShares = initialCash / prices[0].close;
    const bhFinal = bhShares * prices[prices.length - 1].close;

    const comparison = prices
        .map((p) => ({
            date: p.date,
            wheel: history.find((h) => h.date === p.date)?.value || null,
            buyHold: parseFloat((bhShares * p.close).toFixed(2)),
        }))
        .filter((d) => d.wheel !== null);

    return {
        finalValue,
        bhFinal,
        wheelReturn: ((finalValue - initialCash) / initialCash) * 100,
        bhReturn: ((bhFinal - initialCash) / initialCash) * 100,
        totalPremium,
        putsSold,
        callsSold,
        putsAssigned,
        callsAssigned,
        history,
        trades,
        comparison,
        currentShares: shares,
        currentCash: cash,
    };
};
