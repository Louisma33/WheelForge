import { Component } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { GOLD, TEXT_PRIMARY, TEXT_SECONDARY, monoFont } from "../constants";

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ errorInfo });
        console.error("WheelForge Error:", error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div
                    style={{
                        minHeight: "100vh",
                        background: "linear-gradient(135deg, #0a0a1a 0%, #12121f 50%, #0a0a1a 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 24,
                        fontFamily: "'Inter', -apple-system, sans-serif",
                    }}
                >
                    <div
                        style={{
                            maxWidth: 440,
                            width: "100%",
                            background: "rgba(26, 26, 46, 0.8)",
                            backdropFilter: "blur(20px)",
                            border: "1px solid rgba(201,168,76,0.15)",
                            borderRadius: 20,
                            padding: 32,
                            textAlign: "center",
                        }}
                    >
                        <div
                            style={{
                                width: 64,
                                height: 64,
                                borderRadius: 16,
                                background: "rgba(239,68,68,0.1)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                margin: "0 auto 20px",
                            }}
                        >
                            <AlertTriangle size={32} color="#ef4444" />
                        </div>

                        <h2
                            style={{
                                fontSize: 20,
                                fontWeight: 700,
                                color: TEXT_PRIMARY,
                                marginBottom: 8,
                            }}
                        >
                            Something went wrong
                        </h2>

                        <p
                            style={{
                                fontSize: 14,
                                color: TEXT_SECONDARY,
                                lineHeight: 1.6,
                                marginBottom: 24,
                            }}
                        >
                            The forge hit an unexpected error. Your data is safe — try refreshing to continue.
                        </p>

                        {this.state.error && (
                            <div
                                style={{
                                    background: "#0a0a1a",
                                    border: "1px solid rgba(239,68,68,0.2)",
                                    borderRadius: 10,
                                    padding: 14,
                                    marginBottom: 24,
                                    textAlign: "left",
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: 10,
                                        fontWeight: 700,
                                        color: "#ef4444",
                                        fontFamily: monoFont,
                                        letterSpacing: 1,
                                        marginBottom: 6,
                                    }}
                                >
                                    ERROR DETAILS
                                </div>
                                <div
                                    style={{
                                        fontSize: 12,
                                        color: TEXT_SECONDARY,
                                        fontFamily: monoFont,
                                        lineHeight: 1.5,
                                        wordBreak: "break-word",
                                        maxHeight: 80,
                                        overflow: "auto",
                                    }}
                                >
                                    {this.state.error.toString()}
                                </div>
                            </div>
                        )}

                        <div style={{ display: "flex", gap: 12 }}>
                            <button
                                onClick={this.handleReset}
                                style={{
                                    flex: 1,
                                    padding: "12px 20px",
                                    borderRadius: 12,
                                    border: `1px solid ${GOLD}40`,
                                    background: `${GOLD}15`,
                                    color: GOLD,
                                    fontSize: 14,
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: 8,
                                    transition: "all 0.2s ease",
                                }}
                            >
                                <RefreshCw size={16} />
                                Try Again
                            </button>
                            <button
                                onClick={() => window.location.reload()}
                                style={{
                                    flex: 1,
                                    padding: "12px 20px",
                                    borderRadius: 12,
                                    border: "1px solid rgba(201,168,76,0.15)",
                                    background: "rgba(201,168,76,0.06)",
                                    color: TEXT_SECONDARY,
                                    fontSize: 14,
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    transition: "all 0.2s ease",
                                }}
                            >
                                Reload Page
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
