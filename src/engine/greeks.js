import { normalCDF } from "./blackScholes";

// ─── OPTIONS GREEKS CALCULATOR ───
// All Greeks derived from Black-Scholes model

const normalPDF = (x) => Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);

/**
 * Calculate all Greeks for a given option
 * @param {number} S - Current stock price
 * @param {number} K - Strike price
 * @param {number} T - Time to expiry (years)
 * @param {number} r - Risk-free rate
 * @param {number} sigma - Volatility
 * @param {string} type - "call" or "put"
 * @returns {Object} Greeks: delta, gamma, theta, vega, rho
 */
export const calculateGreeks = (S, K, T, r, sigma, type = "put") => {
    if (T <= 0 || sigma <= 0) {
        return { delta: 0, gamma: 0, theta: 0, vega: 0, rho: 0 };
    }

    const sqrtT = Math.sqrt(T);
    const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * sqrtT);
    const d2 = d1 - sigma * sqrtT;

    const nd1 = normalCDF(d1);
    const nd2 = normalCDF(d2);
    const nNd1 = normalCDF(-d1);
    const nNd2 = normalCDF(-d2);
    const pd1 = normalPDF(d1);
    const expRT = Math.exp(-r * T);

    let delta, theta, rho;

    if (type === "call") {
        delta = nd1;
        theta =
            (-S * pd1 * sigma) / (2 * sqrtT) -
            r * K * expRT * nd2;
        rho = K * T * expRT * nd2 / 100;
    } else {
        delta = nd1 - 1;
        theta =
            (-S * pd1 * sigma) / (2 * sqrtT) +
            r * K * expRT * nNd2;
        rho = -K * T * expRT * nNd2 / 100;
    }

    // Gamma and Vega are the same for calls and puts
    const gamma = pd1 / (S * sigma * sqrtT);
    const vega = S * pd1 * sqrtT / 100; // per 1% move in vol

    // Convert theta to daily
    const thetaDaily = theta / 365;

    return {
        delta: parseFloat(delta.toFixed(4)),
        gamma: parseFloat(gamma.toFixed(6)),
        theta: parseFloat(thetaDaily.toFixed(4)),
        thetaAnnual: parseFloat(theta.toFixed(4)),
        vega: parseFloat(vega.toFixed(4)),
        rho: parseFloat(rho.toFixed(4)),
        d1: parseFloat(d1.toFixed(4)),
        d2: parseFloat(d2.toFixed(4)),
    };
};

/**
 * Calculate Greeks for both put and call at current wheel position
 */
export const getWheelGreeks = (currentPrice, otmPct, daysToExpiry, riskFreeRate, vol) => {
    const T = daysToExpiry / 365;
    const putStrike = currentPrice * (1 - otmPct);
    const callStrike = currentPrice * (1 + otmPct);

    const putGreeks = calculateGreeks(currentPrice, putStrike, T, riskFreeRate, vol, "put");
    const callGreeks = calculateGreeks(currentPrice, callStrike, T, riskFreeRate, vol, "call");

    return {
        put: { ...putGreeks, strike: putStrike },
        call: { ...callGreeks, strike: callStrike },
        currentPrice,
        vol,
        daysToExpiry,
    };
};

/**
 * Generate P&L scenarios across a range of prices
 */
export const generatePnLScenarios = (currentPrice, strike, premium, type, contracts = 1) => {
    const scenarios = [];
    const range = currentPrice * 0.3; // ±30% range
    const steps = 50;
    const step = (range * 2) / steps;

    for (let i = 0; i <= steps; i++) {
        const price = currentPrice - range + i * step;
        let pnl;

        if (type === "put") {
            // Short put P&L: premium collected - max(strike - price, 0) * 100
            const intrinsic = Math.max(strike - price, 0);
            pnl = (premium - intrinsic * 100) * contracts;
        } else {
            // Short call P&L (with stock): premium + (price - costBasis) * 100
            // Simplified: premium - max(price - strike, 0) * 100
            const intrinsic = Math.max(price - strike, 0);
            pnl = (premium - intrinsic * 100) * contracts;
        }

        scenarios.push({
            price: parseFloat(price.toFixed(2)),
            pnl: parseFloat(pnl.toFixed(2)),
            breakeven: type === "put"
                ? parseFloat((strike - premium / (100 * contracts)).toFixed(2))
                : parseFloat((strike + premium / (100 * contracts)).toFixed(2)),
        });
    }

    return scenarios;
};
