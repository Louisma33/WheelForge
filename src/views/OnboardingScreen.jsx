import { Activity, Brain, ChevronLeft, ChevronRight, Sparkles, Check } from "lucide-react";
import { GOLD, GOLD_LIGHT, cardStyle, monoFont } from "../constants";

const OnboardingScreen = ({
    currentQ,
    setCurrentQ,
    answers,
    setAnswers,
    question,
    progress,
    profileLoading,
    completeOnboarding,
}) => {
    // ── Loading State ──
    if (profileLoading) {
        return (
            <div
                style={{
                    minHeight: "100vh",
                    background: "linear-gradient(180deg, #0a0a1a 0%, #0d1117 100%)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 24,
                    fontFamily: "'Outfit', sans-serif",
                }}
            >
                <Brain
                    size={48}
                    color={GOLD}
                    style={{ animation: "spin 2s linear infinite", marginBottom: 24 }}
                />
                <div
                    style={{ fontSize: 20, fontWeight: 700, color: "#f0ece2", marginBottom: 8 }}
                >
                    Forging Your Trading Profile...
                </div>
                <div
                    style={{
                        fontSize: 14,
                        color: "#8892a4",
                        fontFamily: monoFont,
                        animation: "pulse 1.5s infinite",
                    }}
                >
                    AI is hammering out your strategy blueprint
                </div>
            </div>
        );
    }

    const q = question;

    return (
        <div
            style={{
                minHeight: "100vh",
                background:
                    "linear-gradient(180deg, #0a0a1a 0%, #0d1117 50%, #0a0a1a 100%)",
                fontFamily: "'Outfit', sans-serif",
                padding: "0 0 40px 0",
            }}
        >
            {/* Header */}
            <div style={{ padding: "40px 24px 20px", textAlign: "center" }}>
                <div
                    style={{
                        display: "inline-flex",
                        width: 56,
                        height: 56,
                        background: `linear-gradient(135deg, ${GOLD}, #a88832)`,
                        borderRadius: 16,
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: `0 8px 32px rgba(201,168,76,0.3)`,
                        marginBottom: 16,
                    }}
                >
                    <Activity size={28} color="#0a0a1a" strokeWidth={2.5} />
                </div>
                <h1
                    style={{
                        fontSize: 28,
                        fontWeight: 800,
                        background: `linear-gradient(90deg, ${GOLD}, ${GOLD_LIGHT})`,
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        marginBottom: 6,
                    }}
                >
                    WHEELFORGE
                </h1>
                <p style={{ fontSize: 14, color: "#8892a4", fontFamily: monoFont }}>
                    Cycle. Collect. Conquer.
                </p>
            </div>

            {/* Tagline */}
            <div style={{ textAlign: "center", marginBottom: 8 }}>
                <p style={{ fontSize: 13, color: "#8892a4" }}>
                    Let's forge your trading profile
                </p>
            </div>

            {/* Progress Bar */}
            <div style={{ padding: "0 24px", marginBottom: 32 }}>
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 8,
                    }}
                >
                    <span
                        style={{
                            fontSize: 11,
                            color: "#8892a4",
                            fontFamily: monoFont,
                        }}
                    >
                        QUESTION {currentQ + 1} OF 10
                    </span>
                    <span
                        style={{
                            fontSize: 11,
                            color: GOLD,
                            fontFamily: monoFont,
                        }}
                    >
                        {Math.round(progress)}%
                    </span>
                </div>
                <div
                    style={{
                        height: 4,
                        background: "#1a1a2e",
                        borderRadius: 2,
                        overflow: "hidden",
                    }}
                >
                    <div
                        style={{
                            height: "100%",
                            width: `${progress}%`,
                            background: `linear-gradient(90deg, ${GOLD}, ${GOLD_LIGHT})`,
                            borderRadius: 2,
                            transition: "width 0.5s ease",
                        }}
                    />
                </div>
            </div>

            {/* Question */}
            <div
                style={{ padding: "0 24px", animation: "slideUp 0.4s ease" }}
                key={currentQ}
            >
                <h2
                    style={{
                        fontSize: 20,
                        fontWeight: 700,
                        color: "#f0ece2",
                        marginBottom: 24,
                        lineHeight: 1.4,
                    }}
                >
                    {q.question}
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {q.options.map((opt, idx) => {
                        const selected = answers[q.id] === opt;
                        return (
                            <button
                                key={idx}
                                onClick={() =>
                                    setAnswers((prev) => ({ ...prev, [q.id]: opt }))
                                }
                                style={{
                                    ...cardStyle,
                                    border: selected
                                        ? `2px solid ${GOLD}`
                                        : "1px solid rgba(201,168,76,0.15)",
                                    padding: "16px 20px",
                                    textAlign: "left",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    transition: "all 0.2s ease",
                                    background: selected
                                        ? "linear-gradient(135deg, rgba(201,168,76,0.1), rgba(201,168,76,0.05))"
                                        : cardStyle.background,
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: 15,
                                        color: selected ? "#f0ece2" : "#8892a4",
                                        fontWeight: selected ? 600 : 400,
                                    }}
                                >
                                    {opt}
                                </span>
                                {selected && <Check size={18} color={GOLD} />}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Navigation */}
            <div style={{ padding: "32px 24px 0", display: "flex", gap: 12 }}>
                {currentQ > 0 && (
                    <button
                        onClick={() => setCurrentQ((c) => c - 1)}
                        style={{
                            flex: 1,
                            padding: "14px",
                            borderRadius: 12,
                            border: "1px solid rgba(201,168,76,0.2)",
                            background: "transparent",
                            color: "#8892a4",
                            fontSize: 15,
                            fontWeight: 600,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 6,
                        }}
                    >
                        <ChevronLeft size={16} /> Back
                    </button>
                )}
                <button
                    onClick={() => {
                        if (currentQ < 9) setCurrentQ((c) => c + 1);
                        else completeOnboarding();
                    }}
                    disabled={!answers[q.id]}
                    style={{
                        flex: 2,
                        padding: "14px",
                        borderRadius: 12,
                        border: "none",
                        background: answers[q.id]
                            ? `linear-gradient(135deg, ${GOLD}, #a88832)`
                            : "#1a1a2e",
                        color: answers[q.id] ? "#0a0a1a" : "#555",
                        fontSize: 15,
                        fontWeight: 700,
                        cursor: answers[q.id] ? "pointer" : "not-allowed",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        boxShadow: answers[q.id]
                            ? `0 4px 20px rgba(201,168,76,0.3)`
                            : "none",
                    }}
                >
                    {currentQ === 9 ? "Forge My Profile" : "Next"}{" "}
                    {currentQ === 9 ? <Sparkles size={16} /> : <ChevronRight size={16} />}
                </button>
            </div>
        </div>
    );
};

export default OnboardingScreen;
