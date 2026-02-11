// ─── FORMATTING UTILITIES ───
export const fmt = (n) =>
    n >= 1e6
        ? `$${(n / 1e6).toFixed(2)}M`
        : n >= 1000
            ? `$${(n / 1000).toFixed(1)}K`
            : `$${n.toFixed(2)}`;

export const fmtPct = (n) => `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;

// ─── CLAUDE API HELPER ───
export const callClaude = async (systemPrompt, userMessage) => {
    try {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "claude-sonnet-4-20250514",
                max_tokens: 1000,
                system: systemPrompt,
                messages: [{ role: "user", content: userMessage }],
            }),
        });
        const data = await res.json();
        return (
            data.content?.map((b) => b.text || "").join("\n") ||
            "I couldn't generate a response. Please try again."
        );
    } catch (e) {
        return "Connection error. Please try again.";
    }
};

// ─── LOCAL STORAGE HELPERS ───
const STORAGE_PREFIX = "wheelforge_";

export const saveToStorage = (key, value) => {
    try {
        localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value));
        return true;
    } catch {
        return false;
    }
};

export const loadFromStorage = (key, fallback = null) => {
    try {
        const item = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
        return item ? JSON.parse(item) : fallback;
    } catch {
        return fallback;
    }
};

export const clearStorage = (key) => {
    try {
        if (key) {
            localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
        } else {
            Object.keys(localStorage)
                .filter((k) => k.startsWith(STORAGE_PREFIX))
                .forEach((k) => localStorage.removeItem(k));
        }
    } catch {
        // silently fail
    }
};

// ─── SIMULATION HISTORY ───
export const saveSimulation = (simulation) => {
    const history = loadFromStorage("simulations", []);
    const entry = {
        ...simulation,
        id: Date.now(),
        timestamp: new Date().toISOString(),
    };
    history.unshift(entry);
    // Keep last 50 simulations
    if (history.length > 50) history.length = 50;
    saveToStorage("simulations", history);
    return entry;
};

export const getSimulationHistory = () => loadFromStorage("simulations", []);
