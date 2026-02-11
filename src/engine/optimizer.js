import { generatePriceData } from "./priceData";
import { simulateWheel } from "./wheelSimulator";

// ─── STRATEGY OPTIMIZER ───
// Finds the optimal OTM% and DTE combination for a given ticker

/**
 * Run a grid search across OTM% and DTE combinations
 * @returns {Array} Sorted results from best to worst wheel return
 */
export const optimizeStrategy = (ticker, initialCash, contracts = 1, riskFreeRate = 0.05) => {
    const otmRange = [0.02, 0.03, 0.04, 0.05, 0.06, 0.07, 0.08, 0.10];
    const dteRange = [3, 5, 7, 10, 14, 21, 30, 45];
    const results = [];

    // Run 3 Monte Carlo paths per combination for stability
    const RUNS = 3;

    for (const otm of otmRange) {
        for (const dte of dteRange) {
            let totalWheelReturn = 0;
            let totalBhReturn = 0;
            let totalPremium = 0;
            let totalPutAssign = 0;
            let totalCallAssign = 0;
            let totalTrades = 0;

            for (let run = 0; run < RUNS; run++) {
                const priceData = generatePriceData(ticker, 252);
                const params = {
                    initialCash,
                    otmPct: otm,
                    daysToExpiry: dte,
                    riskFreeRate,
                    contracts,
                };
                const sim = simulateWheel(priceData, params);
                totalWheelReturn += sim.wheelReturn;
                totalBhReturn += sim.bhReturn;
                totalPremium += sim.totalPremium;
                totalPutAssign += sim.putsAssigned;
                totalCallAssign += sim.callsAssigned;
                totalTrades += sim.putsSold + sim.callsSold;
            }

            results.push({
                otmPct: otm,
                otmPctDisplay: `${(otm * 100).toFixed(0)}%`,
                dte,
                wheelReturn: parseFloat((totalWheelReturn / RUNS).toFixed(2)),
                bhReturn: parseFloat((totalBhReturn / RUNS).toFixed(2)),
                alpha: parseFloat(((totalWheelReturn - totalBhReturn) / RUNS).toFixed(2)),
                avgPremium: parseFloat((totalPremium / RUNS).toFixed(2)),
                avgPutAssign: parseFloat((totalPutAssign / RUNS).toFixed(1)),
                avgCallAssign: parseFloat((totalCallAssign / RUNS).toFixed(1)),
                avgTrades: parseFloat((totalTrades / RUNS).toFixed(1)),
                premiumPerTrade: parseFloat(
                    (totalPremium / Math.max(totalTrades, 1)).toFixed(2)
                ),
                riskScore: parseFloat(
                    (
                        ((totalPutAssign + totalCallAssign) / Math.max(totalTrades, 1)) *
                        100
                    ).toFixed(1)
                ),
            });
        }
    }

    // Sort by wheel return descending
    results.sort((a, b) => b.wheelReturn - a.wheelReturn);
    return results;
};

/**
 * Run multi-ticker comparison for the same strategy
 */
export const compareMultiTicker = (tickers, params) => {
    const results = [];
    const RUNS = 3;

    for (const ticker of tickers) {
        let totalWheelReturn = 0;
        let totalBhReturn = 0;
        let totalPremium = 0;
        let totalPutAssign = 0;
        let totalCallAssign = 0;
        let totalPuts = 0;
        let totalCalls = 0;

        for (let run = 0; run < RUNS; run++) {
            const priceData = generatePriceData(ticker, 252);
            const sim = simulateWheel(priceData, params);
            totalWheelReturn += sim.wheelReturn;
            totalBhReturn += sim.bhReturn;
            totalPremium += sim.totalPremium;
            totalPutAssign += sim.putsAssigned;
            totalCallAssign += sim.callsAssigned;
            totalPuts += sim.putsSold;
            totalCalls += sim.callsSold;
        }

        results.push({
            ticker,
            wheelReturn: parseFloat((totalWheelReturn / RUNS).toFixed(2)),
            bhReturn: parseFloat((totalBhReturn / RUNS).toFixed(2)),
            alpha: parseFloat(((totalWheelReturn - totalBhReturn) / RUNS).toFixed(2)),
            totalPremium: parseFloat((totalPremium / RUNS).toFixed(2)),
            putAssignRate: parseFloat(
                ((totalPutAssign / Math.max(totalPuts, 1)) * 100).toFixed(1)
            ),
            callAssignRate: parseFloat(
                ((totalCallAssign / Math.max(totalCalls, 1)) * 100).toFixed(1)
            ),
            totalTrades: parseFloat(((totalPuts + totalCalls) / RUNS).toFixed(0)),
        });
    }

    results.sort((a, b) => b.wheelReturn - a.wheelReturn);
    return results;
};
