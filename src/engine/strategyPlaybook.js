// ─── STRATEGY PLAYBOOK ───
// Pre-built wheel strategy configurations for different objectives

export const STRATEGIES = [
    {
        id: "conservative-income",
        name: "Conservative Income",
        emoji: "🛡️",
        description: "Low-risk income generation with deep OTM puts on stable ETFs. Prioritizes capital preservation with steady premium collection.",
        suitability: "Beginners, retirees, capital-first mindset",
        riskLevel: 1,
        ticker: "SPY",
        params: {
            otmPct: 7,
            daysToExpiry: 30,
            contracts: 1,
            initialCash: 50000,
        },
        targets: {
            monthlyReturn: "0.8–1.5%",
            annualReturn: "10–18%",
            maxDrawdown: "< 8%",
            assignmentFreq: "Rare (< 15%)",
        },
        tips: [
            "Sell puts on red days when IV spikes",
            "Target 30-45 DTE for time decay sweet spot",
            "Roll down and out if strike is threatened",
        ],
        color: "#4ade80",
    },
    {
        id: "balanced-growth",
        name: "Balanced Growth",
        emoji: "⚖️",
        description: "Moderate risk with a blend of premium income and capital appreciation. Works well with large-cap tech stocks.",
        suitability: "Intermediate traders, 1-3 year horizon",
        riskLevel: 2,
        ticker: "AAPL",
        params: {
            otmPct: 5,
            daysToExpiry: 14,
            contracts: 1,
            initialCash: 50000,
        },
        targets: {
            monthlyReturn: "1.5–3%",
            annualReturn: "18–36%",
            maxDrawdown: "< 15%",
            assignmentFreq: "Moderate (20–30%)",
        },
        tips: [
            "Use bi-weekly expirations for faster capital rotation",
            "Adjust OTM % based on earnings and volatility events",
            "Keep 20% cash reserve for assignment buying power",
        ],
        color: "#60a5fa",
    },
    {
        id: "aggressive-premium",
        name: "Aggressive Premium",
        emoji: "🔥",
        description: "Maximum premium extraction from high-IV stocks. Higher assignment risk but significantly more income potential.",
        suitability: "Experienced traders comfortable with assignments",
        riskLevel: 4,
        ticker: "TSLA",
        params: {
            otmPct: 3,
            daysToExpiry: 7,
            contracts: 1,
            initialCash: 75000,
        },
        targets: {
            monthlyReturn: "3–6%",
            annualReturn: "36–72%",
            maxDrawdown: "< 25%",
            assignmentFreq: "Frequent (40–60%)",
        },
        tips: [
            "Weekly DTE maximizes theta decay but watch gamma risk",
            "Be prepared to hold shares — have a covered call plan ready",
            "Size positions conservatively (never > 30% of portfolio per ticker)",
        ],
        color: "#f97316",
    },
    {
        id: "theta-harvest",
        name: "Theta Harvest",
        emoji: "⏳",
        description: "Optimized for time decay extraction. Medium OTM with accelerated DTE to capture the steepest part of the theta curve.",
        suitability: "Data-driven traders, theta gang",
        riskLevel: 3,
        ticker: "MSFT",
        params: {
            otmPct: 4,
            daysToExpiry: 10,
            contracts: 2,
            initialCash: 100000,
        },
        targets: {
            monthlyReturn: "2–4%",
            annualReturn: "24–48%",
            maxDrawdown: "< 18%",
            assignmentFreq: "Moderate (25–35%)",
        },
        tips: [
            "10 DTE captures the steepest theta decay curve",
            "Monitor gamma carefully — positions move fast under 10 DTE",
            "Pair with earnings calendar to avoid assignment surprises",
        ],
        color: "#a78bfa",
    },
    {
        id: "blue-chip-safe",
        name: "Blue Chip Safe Haven",
        emoji: "🏦",
        description: "Ultra-conservative strategy using only blue-chip tech with deep OTM strikes. Designed for large accounts seeking stability.",
        suitability: "Large accounts ($100K+), wealth preservation",
        riskLevel: 1,
        ticker: "MSFT",
        params: {
            otmPct: 8,
            daysToExpiry: 45,
            contracts: 1,
            initialCash: 100000,
        },
        targets: {
            monthlyReturn: "0.5–1.2%",
            annualReturn: "6–14%",
            maxDrawdown: "< 6%",
            assignmentFreq: "Very Rare (< 10%)",
        },
        tips: [
            "45 DTE gives maximum flexibility to roll or close early",
            "Great for IRA accounts where capital preservation matters",
            "Close at 50% profit to free up capital faster",
        ],
        color: "#22d3ee",
    },
    {
        id: "momentum-capture",
        name: "Momentum Capture",
        emoji: "🚀",
        description: "Designed for high-momentum stocks with elevated IV. Captures large premiums during volatile moves. High risk, high reward.",
        suitability: "Advanced traders, momentum players",
        riskLevel: 5,
        ticker: "NVDA",
        params: {
            otmPct: 2,
            daysToExpiry: 5,
            contracts: 1,
            initialCash: 50000,
        },
        targets: {
            monthlyReturn: "4–8%+",
            annualReturn: "48%+",
            maxDrawdown: "< 35%",
            assignmentFreq: "Very Frequent (50–70%)",
        },
        tips: [
            "Only enter when IV rank is above 50%",
            "Use 5 DTE for maximum gamma and premium juice",
            "Have strict stop-loss rules: exit if underlying drops 5%+ below strike",
        ],
        color: "#ef4444",
    },
];

// ─── STRATEGY RECOMMENDATIONS ───
// Returns ranked strategies based on user profile answers
export const recommendStrategies = (answers) => {
    if (!answers || Object.keys(answers).length < 5) return STRATEGIES;

    const scored = STRATEGIES.map((s) => {
        let fit = 0;

        // Risk tolerance match
        const risk = answers[5] || "";
        if (risk.includes("Conservative") && s.riskLevel <= 2) fit += 30;
        else if (risk.includes("Moderate") && s.riskLevel >= 2 && s.riskLevel <= 3) fit += 30;
        else if (risk.includes("Aggressive") && s.riskLevel >= 3 && s.riskLevel <= 4) fit += 30;
        else if (risk.includes("Very aggressive") && s.riskLevel >= 4) fit += 30;

        // Capital alignment
        const capital = answers[4] || "";
        if (capital.includes("Under $10,000") && s.params.initialCash <= 50000) fit += 15;
        else if (capital.includes("$10,000 – $50,000") && s.params.initialCash <= 75000) fit += 15;
        else if (capital.includes("$50,000 – $100,000")) fit += 15;
        else if (capital.includes("Over $100,000") && s.params.initialCash >= 100000) fit += 15;

        // Experience level
        const exp = answers[1] || "";
        if (exp.includes("beginner") && s.riskLevel <= 2) fit += 20;
        else if (exp.includes("basics") && s.riskLevel <= 3) fit += 20;
        else if (exp.includes("Intermediate") && s.riskLevel <= 4) fit += 20;
        else if (exp.includes("Advanced") || exp.includes("Professional")) fit += 20;

        // Trading frequency match
        const freq = answers[7] || "";
        if (freq.includes("Weekly") && s.params.daysToExpiry <= 10) fit += 15;
        else if (freq.includes("Bi-weekly") && s.params.daysToExpiry >= 10 && s.params.daysToExpiry <= 21) fit += 15;
        else if (freq.includes("Monthly") && s.params.daysToExpiry >= 21) fit += 15;

        // Goal alignment
        const goal = answers[3] || "";
        if (goal.includes("income") && s.riskLevel <= 3) fit += 10;
        else if (goal.includes("Grow") && s.riskLevel >= 2 && s.riskLevel <= 4) fit += 10;
        else if (goal.includes("Learn") && s.riskLevel <= 2) fit += 10;

        return { ...s, fitScore: fit };
    });

    return scored.sort((a, b) => b.fitScore - a.fitScore);
};

export const getStrategyById = (id) => STRATEGIES.find((s) => s.id === id);
