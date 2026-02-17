// ─── RISK ANALYTICS ENGINE ───
// Advanced risk metrics for wheel strategy simulations

// ─── VALUE AT RISK (VaR) ───
// Parametric VaR using historical simulation returns
export const calculateVaR = (history, confidence = 0.95) => {
    if (!history || history.length < 5) return { vaR: 0, cVaR: 0 };

    const returns = [];
    for (let i = 1; i < history.length; i++) {
        if (history[i].value > 0 && history[i - 1].value > 0) {
            returns.push((history[i].value - history[i - 1].value) / history[i - 1].value);
        }
    }
    if (returns.length < 2) return { vaR: 0, cVaR: 0 };

    // Sort returns ascending (worst first)
    const sorted = [...returns].sort((a, b) => a - b);
    const idx = Math.floor((1 - confidence) * sorted.length);
    const vaR = -sorted[idx]; // Positive number = loss

    // Conditional VaR (Expected Shortfall) — average of losses worse than VaR
    const tail = sorted.slice(0, idx + 1);
    const cVaR = tail.length > 0 ? -(tail.reduce((a, b) => a + b, 0) / tail.length) : vaR;

    return {
        vaR: parseFloat((vaR * 100).toFixed(2)),
        cVaR: parseFloat((cVaR * 100).toFixed(2)),
        worstDay: parseFloat((sorted[0] * 100).toFixed(2)),
        bestDay: parseFloat((sorted[sorted.length - 1] * 100).toFixed(2)),
    };
};

// ─── SORTINO RATIO ───
// Like Sharpe but only penalizes downside volatility
export const calculateSortino = (history, riskFreeRate = 0.05) => {
    if (!history || history.length < 5) return 0;

    const returns = [];
    for (let i = 1; i < history.length; i++) {
        if (history[i].value > 0 && history[i - 1].value > 0) {
            returns.push((history[i].value - history[i - 1].value) / history[i - 1].value);
        }
    }
    if (returns.length < 2) return 0;

    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const riskFreeDaily = riskFreeRate / 252;

    // Downside deviation — only negative returns contribute
    const downsideReturns = returns.filter((r) => r < riskFreeDaily);
    if (downsideReturns.length === 0) return 10; // No downside = great

    const downsideVariance =
        downsideReturns.reduce((sum, r) => sum + (r - riskFreeDaily) ** 2, 0) /
        downsideReturns.length;
    const downsideDev = Math.sqrt(downsideVariance);

    return downsideDev > 0
        ? parseFloat((((avgReturn - riskFreeDaily) / downsideDev) * Math.sqrt(252)).toFixed(3))
        : 0;
};

// ─── KELLY CRITERION ───
// Optimal position sizing based on win rate and payoff ratio
export const calculateKelly = (trades) => {
    if (!trades || trades.length < 2) return { kelly: 0, halfKelly: 0 };

    const sells = trades.filter((t) => t.type.startsWith("SELL"));
    const assigns = trades.filter((t) => t.type.includes("ASSIGNED"));
    if (sells.length === 0) return { kelly: 0, halfKelly: 0 };

    const winRate = (sells.length - assigns.length) / sells.length;
    const lossRate = 1 - winRate;

    // Average premium (win) vs average assignment loss
    const avgPremium = sells.reduce((sum, t) => {
        const p = parseFloat(t.premium);
        return sum + (isNaN(p) ? 0 : p);
    }, 0) / sells.length;

    // Estimate average loss on assignment (premium collected - stock depreciation)
    // Using a rough heuristic: average strike price × OTM %
    const avgStrike = sells.reduce((sum, t) => sum + parseFloat(t.strike || 0), 0) / sells.length;
    const avgLoss = avgStrike * 0.03 * 100; // ~3% typical assignment loss per contract

    if (avgLoss <= 0 || lossRate <= 0) return { kelly: winRate * 100, halfKelly: (winRate * 50) };

    const payoffRatio = avgPremium / avgLoss;
    const kelly = winRate - lossRate / payoffRatio;

    return {
        kelly: parseFloat((Math.max(0, kelly) * 100).toFixed(1)),
        halfKelly: parseFloat((Math.max(0, kelly / 2) * 100).toFixed(1)),
        winRate: parseFloat((winRate * 100).toFixed(1)),
        payoffRatio: parseFloat(payoffRatio.toFixed(2)),
    };
};

// ─── DRAWDOWN ANALYSIS ───
export const analyzeDrawdowns = (history) => {
    if (!history || history.length < 2) {
        return {
            maxDrawdown: 0,
            maxDrawdownDuration: 0,
            currentDrawdown: 0,
            drawdownPeriods: [],
        };
    }

    let peak = history[0].value;
    let maxDD = 0;
    let maxDDDuration = 0;
    let currentDDStart = null;
    let currentDDDuration = 0;
    const drawdownPeriods = [];

    for (let i = 0; i < history.length; i++) {
        const val = history[i].value;
        if (val > peak) {
            peak = val;
            if (currentDDStart !== null) {
                drawdownPeriods.push({
                    start: currentDDStart,
                    end: history[i].date,
                    duration: currentDDDuration,
                    depth: maxDD,
                });
                currentDDStart = null;
                currentDDDuration = 0;
            }
        } else {
            const dd = (peak - val) / peak;
            if (dd > 0 && currentDDStart === null) {
                currentDDStart = history[i].date;
            }
            currentDDDuration++;
            if (dd > maxDD) maxDD = dd;
            if (currentDDDuration > maxDDDuration) maxDDDuration = currentDDDuration;
        }
    }

    const currentDrawdown = peak > 0 ? (peak - history[history.length - 1].value) / peak : 0;

    return {
        maxDrawdown: parseFloat((maxDD * 100).toFixed(2)),
        maxDrawdownDuration: maxDDDuration,
        currentDrawdown: parseFloat((currentDrawdown * 100).toFixed(2)),
        drawdownPeriods: drawdownPeriods.slice(-5), // Last 5 drawdowns
        recoveryRate: drawdownPeriods.length > 0
            ? parseFloat((drawdownPeriods.filter((d) => d.duration < 30).length / drawdownPeriods.length * 100).toFixed(0))
            : 100,
    };
};

// ─── MAX CONSECUTIVE LOSSES ───
export const calculateStreaks = (trades) => {
    if (!trades || trades.length < 1) {
        return { maxConsecLosses: 0, maxConsecWins: 0, currentStreak: 0 };
    }

    let consec = 0;
    let maxLoss = 0;
    let maxWin = 0;
    let current = 0;
    let lastType = null;

    for (const t of trades) {
        if (t.type.includes("ASSIGNED")) {
            if (lastType === "loss") {
                consec++;
            } else {
                if (lastType === "win" && consec > maxWin) maxWin = consec;
                consec = 1;
            }
            lastType = "loss";
            if (consec > maxLoss) maxLoss = consec;
            current = -consec;
        } else if (t.type.startsWith("SELL")) {
            if (lastType === "win") {
                consec++;
            } else {
                if (lastType === "loss" && consec > maxLoss) maxLoss = consec;
                consec = 1;
            }
            lastType = "win";
            if (consec > maxWin) maxWin = consec;
            current = consec;
        }
    }

    return {
        maxConsecLosses: maxLoss,
        maxConsecWins: maxWin,
        currentStreak: current,
    };
};

// ─── RISK SCORE ───
// Composite risk score 1–100 (lower = safer)
export const calculateRiskScore = (results, history, trades) => {
    if (!results || !history || history.length < 5) return { score: 50, label: "Unknown", factors: [] };

    const factors = [];
    let score = 0;

    // 1. Max Drawdown (0–30 points)
    const dd = analyzeDrawdowns(history);
    const ddScore = Math.min(30, dd.maxDrawdown * 1.5);
    score += ddScore;
    factors.push({ name: "Max Drawdown", value: `${dd.maxDrawdown.toFixed(1)}%`, impact: ddScore.toFixed(0) });

    // 2. Assignment Rate (0–25 points)
    const totalSells = results.putsSold + results.callsSold;
    const totalAssigns = results.putsAssigned + results.callsAssigned;
    const assignRate = totalSells > 0 ? (totalAssigns / totalSells) * 100 : 0;
    const assignScore = Math.min(25, assignRate * 0.5);
    score += assignScore;
    factors.push({ name: "Assignment Rate", value: `${assignRate.toFixed(0)}%`, impact: assignScore.toFixed(0) });

    // 3. VaR (0–20 points)
    const var95 = calculateVaR(history, 0.95);
    const varScore = Math.min(20, var95.vaR * 4);
    score += varScore;
    factors.push({ name: "Daily VaR (95%)", value: `${var95.vaR.toFixed(2)}%`, impact: varScore.toFixed(0) });

    // 4. Consecutive Losses (0–15 points)
    const streaks = calculateStreaks(trades);
    const streakScore = Math.min(15, streaks.maxConsecLosses * 5);
    score += streakScore;
    factors.push({ name: "Max Consec Losses", value: streaks.maxConsecLosses, impact: streakScore.toFixed(0) });

    // 5. Return Volatility (0–10 points)
    const returns = [];
    for (let i = 1; i < history.length; i++) {
        if (history[i].value > 0 && history[i - 1].value > 0) {
            returns.push((history[i].value - history[i - 1].value) / history[i - 1].value);
        }
    }
    const retStd = returns.length > 1
        ? Math.sqrt(returns.reduce((s, r) => s + (r - returns.reduce((a, b) => a + b, 0) / returns.length) ** 2, 0) / (returns.length - 1))
        : 0;
    const volScore = Math.min(10, retStd * 500);
    score += volScore;
    factors.push({ name: "Return Volatility", value: `${(retStd * 100).toFixed(2)}%`, impact: volScore.toFixed(0) });

    score = Math.round(Math.min(100, Math.max(0, score)));

    const label =
        score <= 20 ? "Very Low" :
            score <= 40 ? "Low" :
                score <= 55 ? "Moderate" :
                    score <= 75 ? "High" : "Very High";

    const color =
        score <= 20 ? "#4ade80" :
            score <= 40 ? "#22c55e" :
                score <= 55 ? "#f59e0b" :
                    score <= 75 ? "#f97316" : "#ef4444";

    return { score, label, color, factors };
};

// ─── FULL RISK REPORT ───
export const generateRiskReport = (results, riskFreeRate = 0.05) => {
    if (!results) return null;

    const { history, trades } = results;

    return {
        vaR: calculateVaR(history, 0.95),
        sortino: calculateSortino(history, riskFreeRate),
        kelly: calculateKelly(trades),
        drawdowns: analyzeDrawdowns(history),
        streaks: calculateStreaks(trades),
        riskScore: calculateRiskScore(results, history, trades),
    };
};
