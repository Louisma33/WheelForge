import { useRef, useEffect } from "react";
import {
    BookOpen, Target, Shield, User, Bot, Send,
} from "lucide-react";
import {
    GOLD, cardStyle, monoFont, TEXT_SECONDARY, TEXT_MUTED, PURPLE,
} from "../constants";

const AdvisorView = ({
    chatMessages,
    chatLoading,
    chatInput,
    setChatInput,
    sendChat,
}) => {
    const chatEndRef = useRef(null);
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatMessages]);

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                height: "calc(100vh - 160px)",
                animation: "slideUp 0.4s ease",
            }}
        >
            {/* Quick Actions */}
            <div
                style={{
                    display: "flex",
                    gap: 8,
                    marginBottom: 12,
                    overflowX: "auto",
                    paddingBottom: 4,
                }}
            >
                {[
                    { label: "Explain my results", icon: BookOpen },
                    { label: "What should I trade?", icon: Target },
                    { label: "Am I too risky?", icon: Shield },
                ].map((a, i) => (
                    <button
                        key={i}
                        onClick={() => setChatInput(a.label)}
                        style={{
                            ...cardStyle,
                            padding: "8px 14px",
                            border: "1px solid rgba(201,168,76,0.2)",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            fontSize: 11,
                            color: TEXT_SECONDARY,
                            fontFamily: monoFont,
                            whiteSpace: "nowrap",
                            flexShrink: 0,
                            transition: "all 0.2s ease",
                        }}
                    >
                        <a.icon size={12} color={GOLD} /> {a.label}
                    </button>
                ))}
            </div>

            {/* Messages */}
            <div
                style={{
                    flex: 1,
                    overflowY: "auto",
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                    paddingBottom: 12,
                }}
            >
                {chatMessages.map((msg, i) => (
                    <div
                        key={i}
                        style={{
                            display: "flex",
                            gap: 10,
                            alignItems: msg.role === "user" ? "flex-end" : "flex-start",
                            flexDirection: msg.role === "user" ? "row-reverse" : "row",
                            animation: "slideUp 0.3s ease",
                        }}
                    >
                        <div
                            style={{
                                width: 32,
                                height: 32,
                                borderRadius: 10,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                                background:
                                    msg.role === "user"
                                        ? `rgba(99,102,241,0.2)`
                                        : `${GOLD}20`,
                            }}
                        >
                            {msg.role === "user" ? (
                                <User size={16} color={PURPLE} />
                            ) : (
                                <Bot size={16} color={GOLD} />
                            )}
                        </div>
                        <div
                            style={{
                                ...cardStyle,
                                padding: "12px 16px",
                                maxWidth: "85%",
                                border:
                                    msg.role === "user"
                                        ? `1px solid rgba(99,102,241,0.2)`
                                        : "1px solid rgba(201,168,76,0.15)",
                                background:
                                    msg.role === "user"
                                        ? "linear-gradient(135deg, rgba(99,102,241,0.1), rgba(99,102,241,0.05))"
                                        : cardStyle.background,
                            }}
                        >
                            <div
                                style={{
                                    fontSize: 13,
                                    color: TEXT_MUTED,
                                    lineHeight: 1.6,
                                    whiteSpace: "pre-wrap",
                                }}
                            >
                                {msg.content}
                            </div>
                        </div>
                    </div>
                ))}
                {chatLoading && (
                    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <div
                            style={{
                                width: 32,
                                height: 32,
                                borderRadius: 10,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background: `${GOLD}20`,
                            }}
                        >
                            <Bot size={16} color={GOLD} />
                        </div>
                        <div style={{ ...cardStyle, padding: "14px 20px" }}>
                            <div style={{ display: "flex", gap: 6 }}>
                                {[0, 1, 2].map((i) => (
                                    <div
                                        key={i}
                                        style={{
                                            width: 8,
                                            height: 8,
                                            borderRadius: 4,
                                            background: GOLD,
                                            animation: `dotPulse 1.4s ${i * 0.2}s infinite ease-in-out both`,
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div
                style={{
                    display: "flex",
                    gap: 8,
                    paddingTop: 8,
                    borderTop: "1px solid rgba(201,168,76,0.1)",
                }}
            >
                <input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendChat()}
                    placeholder="Ask about the wheel strategy..."
                    style={{
                        flex: 1,
                        padding: "12px 16px",
                        background: "#0d1117",
                        border: "1px solid rgba(201,168,76,0.2)",
                        borderRadius: 12,
                        color: "#f0ece2",
                        fontSize: 14,
                        outline: "none",
                    }}
                />
                <button
                    onClick={sendChat}
                    disabled={chatLoading || !chatInput.trim()}
                    style={{
                        background: `linear-gradient(135deg, ${GOLD}, #a88832)`,
                        border: "none",
                        borderRadius: 12,
                        padding: "0 16px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        opacity: chatLoading || !chatInput.trim() ? 0.5 : 1,
                    }}
                >
                    <Send size={18} color="#0a0a1a" />
                </button>
            </div>
        </div>
    );
};

export default AdvisorView;
