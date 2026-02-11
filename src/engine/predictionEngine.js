import { blackScholes, normalCDF } from "./blackScholes";

// ─── PREDICTION ENGINE ───
// Combines linear regression + Monte Carlo simulation
export const predictOutcome = (priceData, params) => {
    const prices = priceData.data,
        vol = priceData.volatility,
        n = prices.length;
    const currentPrice = prices[n - 1].close;

    // Linear regression for trend prediction
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    for (let i = 0; i < n; i++) {
        sumX += i;
        sumY += prices[i].close;
        sumXY += i * prices[i].close;
        sumX2 += i * i;
    }
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const predictedPrice =
        slope * (n + params.daysToExpiry) + (sumY - slope * sumX) / n;

    // Strike prices
    const putStrike = currentPrice * (1 - params.otmPct),
        callStrike = currentPrice * (1 + params.otmPct);
    const T = params.daysToExpiry / 365;

    // Assignment probabilities using Black-Scholes
    const putAssignProb = normalCDF(
        (Math.log(putStrike / currentPrice) -
            (params.riskFreeRate - 0.5 * vol * vol) * T) /
        (vol * Math.sqrt(T))
    );
    const callAssignProb =
        1 -
        normalCDF(
            (Math.log(callStrike / currentPrice) -
                (params.riskFreeRate - 0.5 * vol * vol) * T) /
            (vol * Math.sqrt(T))
        );

    // Premium estimates
    const putPremium =
        blackScholes(currentPrice, putStrike, T, params.riskFreeRate, vol, "put") *
        100 *
        params.contracts;
    const callPremium =
        blackScholes(currentPrice, callStrike, T, params.riskFreeRate, vol, "call") *
        100 *
        params.contracts;

    // Monte Carlo simulation (1000 paths)
    const scenarios = [],
        dt = 1 / 252;
    for (let s = 0; s < 1000; s++) {
        let p = currentPrice;
        for (let d = 0; d < params.daysToExpiry; d++) {
            const r =
                Math.sqrt(-2 * Math.log(Math.random())) *
                Math.cos(2 * Math.PI * Math.random());
            p *= Math.exp(
                (priceData.drift - 0.5 * vol * vol) * dt +
                vol * Math.sqrt(dt) * r
            );
        }
        scenarios.push(parseFloat(p.toFixed(2)));
    }
    scenarios.sort((a, b) => a - b);

    // Distribution buckets for histogram
    const min = scenarios[0],
        max = scenarios[scenarios.length - 1],
        bs = (max - min) / 20;
    const distribution = Array.from({ length: 20 }, (_, b) => {
        const lo = min + b * bs;
        return {
            range: `$${lo.toFixed(0)}`,
            count: scenarios.filter((s) => s >= lo && s < lo + bs).length,
            lo,
            hi: lo + bs,
        };
    });

    return {
        currentPrice,
        predictedPrice,
        putStrike,
        callStrike,
        putAssignProb,
        callAssignProb,
        putPremium,
        callPremium,
        scenarios,
        distribution,
        p10: scenarios[100],
        p25: scenarios[250],
        p50: scenarios[500],
        p75: scenarios[750],
        p90: scenarios[900],
    };
};
