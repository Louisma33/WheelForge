// ─── DESIGN TOKENS ───
export const GOLD = "#C9A84C";
export const GOLD_LIGHT = "#e8d5a0";
export const DARK_BG = "#0a0a1a";
export const DARK_CARD = "#1a1a2e";
export const DARK_SURFACE = "#16213e";
export const DARK_BORDER = "#1e293b";
export const TEXT_PRIMARY = "#f0ece2";
export const TEXT_SECONDARY = "#8892a4";
export const TEXT_MUTED = "#d0ccc0";
export const GREEN = "#4ade80";
export const RED = "#f87171";
export const PURPLE = "#6366f1";
export const AMBER = "#f59e0b";
export const VIOLET = "#8b5cf6";
export const BLUE = "#60a5fa";
export const LAVENDER = "#a78bfa";

// ─── SHARED STYLES ───
export const cardStyle = {
    background: `linear-gradient(135deg, ${DARK_CARD} 0%, ${DARK_SURFACE} 100%)`,
    border: `1px solid rgba(201,168,76,0.15)`,
    borderRadius: 16,
};

export const monoFont = "'JetBrains Mono', monospace";
export const sansFont = "'Outfit', sans-serif";

export const tooltipStyle = {
    backgroundColor: DARK_SURFACE,
    border: `1px solid rgba(201,168,76,0.3)`,
    borderRadius: 10,
    fontSize: 12,
    fontFamily: monoFont,
    color: TEXT_PRIMARY,
};

// ─── ONBOARDING QUESTIONS ───
export const ONBOARDING = [
    {
        id: 1,
        question: "What's your experience level with options trading?",
        options: [
            "Complete beginner",
            "I know the basics",
            "Intermediate trader",
            "Advanced / Professional",
        ],
    },
    {
        id: 2,
        question: "How long have you been investing overall?",
        options: ["Less than 1 year", "1-3 years", "3-5 years", "5+ years"],
    },
    {
        id: 3,
        question: "What's your primary goal with the wheel strategy?",
        options: [
            "Generate monthly income",
            "Grow my portfolio long-term",
            "Learn options trading",
            "Supplement my existing strategy",
        ],
    },
    {
        id: 4,
        question: "How much capital are you planning to allocate?",
        options: [
            "Under $10,000",
            "$10,000 – $50,000",
            "$50,000 – $100,000",
            "Over $100,000",
        ],
    },
    {
        id: 5,
        question: "What's your risk tolerance?",
        options: [
            "Conservative – protect capital first",
            "Moderate – balanced growth & safety",
            "Aggressive – maximize returns",
            "Very aggressive – high risk, high reward",
        ],
    },
    {
        id: 6,
        question: "Which sectors interest you most?",
        options: [
            "Tech (AAPL, MSFT, NVDA)",
            "Broad market (SPY, QQQ)",
            "Growth stocks (TSLA, AMD)",
            "Mixed / No preference",
        ],
    },
    {
        id: 7,
        question: "How often do you want to manage trades?",
        options: [
            "Weekly – active management",
            "Bi-weekly",
            "Monthly – hands-off",
            "Flexible / Depends",
        ],
    },
    {
        id: 8,
        question: "How would you handle a 20% drop in your assigned stock?",
        options: [
            "Sell immediately to cut losses",
            "Hold and keep selling calls",
            "Buy more shares (average down)",
            "Not sure – need guidance",
        ],
    },
    {
        id: 9,
        question: "What's your income target from premiums?",
        options: ["1-2% monthly", "2-4% monthly", "4%+ monthly", "Not sure yet"],
    },
    {
        id: 10,
        question: "How do you prefer to learn?",
        options: [
            "Step-by-step explanations",
            "Real examples & case studies",
            "Just show me what to do",
            "Deep technical analysis",
        ],
    },
];
