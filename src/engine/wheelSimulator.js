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

// ─── HISTORICAL WHEEL BACKTESTER ───
// Runs the wheel on actual Polygon OHLCV data — true historical backtest
export const simulateWheelHistorical = async (ticker, params) => {
    const { fetchHistoricalPrices, calculateHistoricalVolatility } = await import("./priceData");

    const histData = await fetchHistoricalPrices(ticker, params.simDays || 252);
    if (!histData?.data?.length || histData.data.length < 20) {
        throw new Error(`Insufficient historical data for ${ticker}`);
    }

    // Use real volatility from the historical data
    const realVol = calculateHistoricalVolatility(histData.data);
    const priceDataWithRealVol = {
        ...histData,
        volatility: realVol,
    };

    // Run the standard wheel simulator on real data
    const result = simulateWheel(priceDataWithRealVol, params);

    // ── Enhanced metrics for historical backtest ──
    const { history, trades, comparison } = result;

    // Max drawdown
    let peak = 0, maxDrawdown = 0;
    for (const h of history) {
        if (h.value > peak) peak = h.value;
        const dd = (peak - h.value) / peak;
        if (dd > maxDrawdown) maxDrawdown = dd;
    }

    // Win rate (trades where premium collected > potential loss)
    const sellTrades = trades.filter((t) => t.type.startsWith("SELL"));
    const assignTrades = trades.filter((t) => t.type.includes("ASSIGNED"));
    const winRate = sellTrades.length > 0
        ? ((sellTrades.length - assignTrades.length) / sellTrades.length) * 100
        : 0;

    // Sharpe ratio (simplified — using daily returns)
    let sharpe = 0;
    if (history.length > 1) {
        const dailyReturns = [];
        for (let i = 1; i < history.length; i++) {
            dailyReturns.push((history[i].value - history[i - 1].value) / history[i - 1].value);
        }
        const avgReturn = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
        const stdDev = Math.sqrt(
            dailyReturns.reduce((sum, r) => sum + (r - avgReturn) ** 2, 0) / (dailyReturns.length - 1)
        );
        const riskFreeDaily = (params.riskFreeRate || 0.05) / 252;
        sharpe = stdDev > 0 ? ((avgReturn - riskFreeDaily) / stdDev) * Math.sqrt(252) : 0;
    }

    // Premium yield (total premium / initial cash, annualized)
    const years = histData.data.length / 252;
    const premiumYieldAnnual = years > 0
        ? (result.totalPremium / params.initialCash / years) * 100
        : 0;

    return {
        ...result,
        // Enhanced backtest metrics
        maxDrawdown: maxDrawdown * 100, // as percentage
        sharpeRatio: parseFloat(sharpe.toFixed(3)),
        winRate: parseFloat(winRate.toFixed(1)),
        premiumYieldAnnual: parseFloat(premiumYieldAnnual.toFixed(2)),
        realVolatility: parseFloat((realVol * 100).toFixed(2)),
        tradingDays: histData.data.length,
        // Data source info
        dataSource: histData._live ? "historical" : "simulated",
        _live: histData._live,
        _mock: histData._mock,
    };
};
