import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Activity, BarChart3, Zap, MessageCircle,
  PieChart as PieIcon, Settings, Play, RefreshCw, Clock,
} from "lucide-react";

// Engine
import { generatePriceData } from "./engine";
import { simulateWheel } from "./engine";
import { predictOutcome } from "./engine";
import { TICKERS } from "./engine";

// Constants & Utils
import {
  GOLD, GOLD_LIGHT, cardStyle, monoFont, sansFont,
  ONBOARDING, TEXT_SECONDARY,
} from "./constants";
import {
  callClaude, fmt, fmtPct,
  saveToStorage, loadFromStorage, saveSimulation,
} from "./utils";

// Components
import Tab from "./components/Tab";

// Views
import OnboardingScreen from "./views/OnboardingScreen";
import DashboardView from "./views/DashboardView";
import PredictionsView from "./views/PredictionsView";
import AdvisorView from "./views/AdvisorView";
import PortfolioView from "./views/PortfolioView";
import TradesView from "./views/TradesView";
import HistoryView from "./views/HistoryView";

// ─── MAIN APP ───
export default function WheelForgeApp() {
  // ── Onboarding state ──
  const [onboarded, setOnboarded] = useState(() =>
    loadFromStorage("onboarded", false)
  );
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState(() =>
    loadFromStorage("answers", {})
  );
  const [profile, setProfile] = useState(() =>
    loadFromStorage("profile", null)
  );
  const [profileLoading, setProfileLoading] = useState(false);

  // ── App state ──
  const [tab, setTab] = useState("dashboard");
  const [ticker, setTicker] = useState(() =>
    loadFromStorage("ticker", "SPY")
  );
  const [initialCash, setInitialCash] = useState(() =>
    loadFromStorage("initialCash", 100000)
  );
  const [otmPct, setOtmPct] = useState(() =>
    loadFromStorage("otmPct", 5)
  );
  const [daysToExpiry, setDaysToExpiry] = useState(() =>
    loadFromStorage("daysToExpiry", 7)
  );
  const [contracts, setContracts] = useState(() =>
    loadFromStorage("contracts", 1)
  );
  const [riskFreeRate] = useState(0.05);
  const [simDays] = useState(252);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [priceData, setPriceData] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [simCount, setSimCount] = useState(0);

  // ── AI Chat state ──
  const [chatMessages, setChatMessages] = useState(() =>
    loadFromStorage("chatMessages", [])
  );
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  // ── AI Analysis state ──
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  // ── AI Recommendations state ──
  const [aiRecs, setAiRecs] = useState(null);
  const [recsLoading, setRecsLoading] = useState(false);

  // ── Persist settings changes ──
  useEffect(() => { saveToStorage("ticker", ticker); }, [ticker]);
  useEffect(() => { saveToStorage("initialCash", initialCash); }, [initialCash]);
  useEffect(() => { saveToStorage("otmPct", otmPct); }, [otmPct]);
  useEffect(() => { saveToStorage("daysToExpiry", daysToExpiry); }, [daysToExpiry]);
  useEffect(() => { saveToStorage("contracts", contracts); }, [contracts]);
  useEffect(() => { saveToStorage("chatMessages", chatMessages); }, [chatMessages]);

  const params = useMemo(
    () => ({
      initialCash,
      otmPct: otmPct / 100,
      daysToExpiry,
      riskFreeRate,
      contracts,
    }),
    [initialCash, otmPct, daysToExpiry, riskFreeRate, contracts]
  );

  const profileSummary = useMemo(() => {
    if (!answers || Object.keys(answers).length < 10) return "";
    return ONBOARDING.map((q) => `${q.question}: ${answers[q.id]}`).join("\n");
  }, [answers]);

  const systemPrompt = useMemo(
    () =>
      `You are the WheelForge AI Advisor — an expert options trading assistant specializing in the wheel strategy (selling cash-secured puts and covered calls). Your motto: "Cycle. Collect. Conquer." You provide clear, actionable guidance with a confident, forge-master tone.

USER PROFILE:
${profileSummary || "No profile yet."}

${profile ? `AI PROFILE ANALYSIS:\n${profile}` : ""}

CURRENT SIMULATION DATA:
- Ticker: ${ticker}
- Capital: $${initialCash.toLocaleString()}
- OTM%: ${otmPct}%
- Days to Expiry: ${daysToExpiry}
- Contracts: ${contracts}
${results
        ? `- Wheel Return: ${results.wheelReturn.toFixed(2)}%\n- Buy&Hold Return: ${results.bhReturn.toFixed(2)}%\n- Total Premium: $${results.totalPremium.toFixed(2)}\n- Puts Sold: ${results.putsSold} (${results.putsAssigned} assigned)\n- Calls Sold: ${results.callsSold} (${results.callsAssigned} assigned)`
        : ""
      }
${predictions
        ? `- Current Price: $${predictions.currentPrice.toFixed(2)}\n- Put Assignment Prob: ${(predictions.putAssignProb * 100).toFixed(1)}%\n- Call Assignment Prob: ${(predictions.callAssignProb * 100).toFixed(1)}%`
        : ""
      }

Keep responses concise (under 200 words), practical, and tailored to the user's experience level. Use plain English. If discussing risk, be honest but constructive. Never provide specific financial advice — frame as educational simulation analysis. Use $ and % formatting for numbers.`,
    [
      profileSummary,
      profile,
      ticker,
      initialCash,
      otmPct,
      daysToExpiry,
      contracts,
      results,
      predictions,
    ]
  );

  // ─── RUN SIMULATION ───
  const runSimulation = useCallback(() => {
    setRunning(true);
    setAiAnalysis(null);
    setAiRecs(null);
    setTimeout(() => {
      const pd = generatePriceData(ticker, simDays);
      setPriceData(pd);
      const res = simulateWheel(pd, params);
      setResults(res);
      const pred = predictOutcome(pd, params);
      setPredictions(pred);
      setRunning(false);
      setSimCount((c) => c + 1);

      // Save to history
      saveSimulation({
        ticker,
        initialCash: params.initialCash,
        otmPct: params.otmPct,
        daysToExpiry: params.daysToExpiry,
        contracts: params.contracts,
        wheelReturn: res.wheelReturn,
        bhReturn: res.bhReturn,
        totalPremium: res.totalPremium,
        putsSold: res.putsSold,
        callsSold: res.callsSold,
        putsAssigned: res.putsAssigned,
        callsAssigned: res.callsAssigned,
        finalValue: res.finalValue,
      });
    }, 500);
  }, [ticker, simDays, params]);

  useEffect(() => {
    if (onboarded && !results) runSimulation();
  }, [onboarded]);

  // ─── ONBOARDING COMPLETE → BUILD PROFILE ───
  const completeOnboarding = async () => {
    setProfileLoading(true);
    const summary = ONBOARDING.map(
      (q) => `${q.question}: ${answers[q.id]}`
    ).join("\n");
    const profileText = await callClaude(
      "You are the WheelForge profile analyst — a master strategist for the wheel options strategy. Your brand motto: 'Cycle. Collect. Conquer.' Based on onboarding answers, forge a concise trader profile (150 words max). Include: experience assessment, risk profile, recommended starting parameters (ticker, OTM%, DTE, capital allocation), and 2-3 key tips. Use confident, forge-themed language. Be encouraging but realistic.",
      `Here are my onboarding answers:\n\n${summary}\n\nForge my trading profile and recommend starting parameters for the wheel strategy simulator.`
    );
    setProfile(profileText);
    saveToStorage("profile", profileText);
    saveToStorage("answers", answers);

    // Auto-configure based on answers
    const capital = answers[4];
    if (capital === "Under $10,000") setInitialCash(10000);
    else if (capital === "$10,000 – $50,000") setInitialCash(25000);
    else if (capital === "$50,000 – $100,000") setInitialCash(75000);
    else setInitialCash(100000);

    const risk = answers[5];
    if (risk?.includes("Conservative")) {
      setOtmPct(7);
      setDaysToExpiry(14);
    } else if (risk?.includes("Aggressive")) {
      setOtmPct(3);
      setDaysToExpiry(5);
    } else if (risk?.includes("Very aggressive")) {
      setOtmPct(2);
      setDaysToExpiry(3);
    } else {
      setOtmPct(5);
      setDaysToExpiry(7);
    }

    const sector = answers[6];
    if (sector?.includes("Tech")) setTicker("AAPL");
    else if (sector?.includes("Growth")) setTicker("TSLA");
    else setTicker("SPY");

    const freq = answers[7];
    if (freq?.includes("Monthly")) setDaysToExpiry(30);
    else if (freq?.includes("Bi-weekly")) setDaysToExpiry(14);

    setProfileLoading(false);
    setOnboarded(true);
    saveToStorage("onboarded", true);

    setChatMessages([
      {
        role: "assistant",
        content: `Welcome to WheelForge 🔥⚒️\n\nCycle. Collect. Conquer.\n\nI've analyzed your profile and forged your simulator settings. Here's your blueprint:\n\n${profileText}\n\nHit "Simulate" to fire up your first backtest, or ask me anything about the wheel strategy!`,
      },
    ]);
  };

  // ─── AI ANALYSIS ───
  const getAiAnalysis = async () => {
    if (!results) return;
    setAnalysisLoading(true);
    const text = await callClaude(
      systemPrompt,
      `Analyze my latest simulation results in plain English. Cover: 1) Overall performance summary 2) How premiums contributed 3) Assignment patterns 4) Key risks I should watch 5) What I could adjust to improve. Keep it conversational and practical.`
    );
    setAiAnalysis(text);
    setAnalysisLoading(false);
  };

  // ─── AI RECOMMENDATIONS ───
  const getAiRecs = async () => {
    if (!results || !predictions) return;
    setRecsLoading(true);
    const text = await callClaude(
      systemPrompt,
      `Based on my simulation data and predictions, give me 3 specific actionable recommendations for my next trades. For each: what to do, why, and the expected outcome. Also suggest if I should adjust any parameters. Format as numbered recommendations.`
    );
    setAiRecs(text);
    setRecsLoading(false);
  };

  // ─── CHAT ───
  const sendChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const msg = chatInput.trim();
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", content: msg }]);
    setChatLoading(true);

    const history = chatMessages
      .slice(-6)
      .map(
        (m) =>
          `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`
      )
      .join("\n");
    const response = await callClaude(
      systemPrompt,
      `Recent chat:\n${history}\n\nUser: ${msg}`
    );
    setChatMessages((prev) => [
      ...prev,
      { role: "assistant", content: response },
    ]);
    setChatLoading(false);
  };

  // ════════════════════════════════════════
  // ─── ONBOARDING SCREEN ───
  // ════════════════════════════════════════
  if (!onboarded) {
    const q = ONBOARDING[currentQ];
    const progress =
      ((currentQ + (answers[q?.id] ? 1 : 0)) / 10) * 100;

    return (
      <>
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
          @keyframes slideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
          @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        `}</style>
        <OnboardingScreen
          currentQ={currentQ}
          setCurrentQ={setCurrentQ}
          answers={answers}
          setAnswers={setAnswers}
          question={q}
          progress={progress}
          profileLoading={profileLoading}
          completeOnboarding={completeOnboarding}
        />
      </>
    );
  }

  // ════════════════════════════════════════
  // ─── MAIN APP ───
  // ════════════════════════════════════════
  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #0a0a1a 0%, #0d1117 50%, #0a0a1a 100%)",
        color: "#f0ece2",
        fontFamily: sansFont,
        padding: "0 0 40px 0",
      }}
    >
      <style>{`
        * { box-sizing: border-box; margin:0; padding:0; }
        ::-webkit-scrollbar { width:6px; height:6px; }
        ::-webkit-scrollbar-track { background:#0a0a1a; }
        ::-webkit-scrollbar-thumb { background:#C9A84C44; border-radius:3px; }
        input, select, textarea { font-family: 'JetBrains Mono', monospace; }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
        @keyframes slideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes dotPulse { 0%,80%,100% { transform: scale(0); } 40% { transform: scale(1); } }
      `}</style>

      {/* HEADER */}
      <div
        style={{
          background:
            "linear-gradient(135deg, #0d1117 0%, #1a1a2e 50%, #0d1117 100%)",
          borderBottom: "1px solid rgba(201,168,76,0.15)",
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 100,
          backdropFilter: "blur(20px)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              background: `linear-gradient(135deg, ${GOLD}, #a88832)`,
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: `0 4px 16px rgba(201,168,76,0.3)`,
            }}
          >
            <Activity size={18} color="#0a0a1a" strokeWidth={2.5} />
          </div>
          <div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 800,
                letterSpacing: -0.5,
                background: `linear-gradient(90deg, ${GOLD}, ${GOLD_LIGHT})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              WHEELFORGE
            </div>
            <div
              style={{
                fontSize: 9,
                color: TEXT_SECONDARY,
                letterSpacing: 2,
                textTransform: "uppercase",
                fontFamily: monoFont,
              }}
            >
              Cycle · Collect · Conquer
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            onClick={() => setShowSettings(!showSettings)}
            style={{
              background: showSettings
                ? "rgba(201,168,76,0.2)"
                : "rgba(255,255,255,0.05)",
              border: "1px solid rgba(201,168,76,0.2)",
              borderRadius: 10,
              padding: "8px 10px",
              color: GOLD,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 11,
              fontFamily: monoFont,
            }}
          >
            <Settings size={13} />
          </button>
          <button
            onClick={runSimulation}
            disabled={running}
            style={{
              background: `linear-gradient(135deg, ${GOLD}, #a88832)`,
              border: "none",
              borderRadius: 10,
              padding: "8px 14px",
              color: "#0a0a1a",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: 11,
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontFamily: monoFont,
              opacity: running ? 0.7 : 1,
            }}
          >
            {running ? (
              <RefreshCw
                size={13}
                style={{ animation: "pulse 1s infinite" }}
              />
            ) : (
              <Play size={13} />
            )}
            {running ? "..." : "Simulate"}
          </button>
        </div>
      </div>

      {/* SETTINGS PANEL */}
      {showSettings && (
        <div
          style={{
            ...cardStyle,
            margin: "12px 16px",
            padding: 20,
            animation: "slideUp 0.3s ease",
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: GOLD,
              marginBottom: 16,
              fontFamily: monoFont,
              letterSpacing: 1,
            }}
          >
            ⚙ PARAMETERS
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
              gap: 10,
            }}
          >
            {[
              {
                label: "Ticker",
                value: ticker,
                set: setTicker,
                type: "select",
                options: TICKERS,
              },
              {
                label: "Capital",
                value: initialCash,
                set: setInitialCash,
                type: "number",
                step: 10000,
              },
              {
                label: "OTM %",
                value: otmPct,
                set: (v) => setOtmPct(parseFloat(v)),
                type: "number",
                step: 1,
              },
              {
                label: "DTE",
                value: daysToExpiry,
                set: (v) => setDaysToExpiry(parseInt(v)),
                type: "number",
                step: 1,
              },
              {
                label: "Contracts",
                value: contracts,
                set: (v) => setContracts(parseInt(v)),
                type: "number",
                step: 1,
              },
            ].map((f, i) => (
              <div key={i}>
                <label
                  style={{
                    fontSize: 10,
                    color: TEXT_SECONDARY,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    fontFamily: monoFont,
                  }}
                >
                  {f.label}
                </label>
                {f.type === "select" ? (
                  <select
                    value={f.value}
                    onChange={(e) => f.set(e.target.value)}
                    style={{
                      width: "100%",
                      marginTop: 4,
                      padding: "9px 10px",
                      background: "#0a0a1a",
                      border: "1px solid rgba(201,168,76,0.2)",
                      borderRadius: 8,
                      color: "#f0ece2",
                      fontSize: 13,
                    }}
                  >
                    {f.options.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="number"
                    value={f.value}
                    onChange={(e) => f.set(e.target.value)}
                    step={f.step}
                    style={{
                      width: "100%",
                      marginTop: 4,
                      padding: "9px 10px",
                      background: "#0a0a1a",
                      border: "1px solid rgba(201,168,76,0.2)",
                      borderRadius: 8,
                      color: "#f0ece2",
                      fontSize: 13,
                    }}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Sim Counter */}
          {simCount > 0 && (
            <div
              style={{
                marginTop: 14,
                fontSize: 10,
                color: TEXT_SECONDARY,
                fontFamily: monoFont,
                textAlign: "center",
              }}
            >
              ⚡ {simCount} simulation{simCount !== 1 ? "s" : ""} run this session
            </div>
          )}
        </div>
      )}

      {/* TABS */}
      <div
        style={{
          display: "flex",
          gap: 6,
          padding: "12px 16px",
          overflowX: "auto",
        }}
      >
        <Tab
          active={tab === "dashboard"}
          label="Dashboard"
          icon={BarChart3}
          onClick={() => setTab("dashboard")}
        />
        <Tab
          active={tab === "predictions"}
          label="Predict"
          icon={Zap}
          onClick={() => setTab("predictions")}
        />
        <Tab
          active={tab === "advisor"}
          label="AI Advisor"
          icon={MessageCircle}
          onClick={() => setTab("advisor")}
          badge={chatMessages.length > 1}
        />
        <Tab
          active={tab === "portfolio"}
          label="Portfolio"
          icon={PieIcon}
          onClick={() => setTab("portfolio")}
        />
        <Tab
          active={tab === "trades"}
          label="Trades"
          icon={Activity}
          onClick={() => setTab("trades")}
        />
        <Tab
          active={tab === "history"}
          label="History"
          icon={Clock}
          onClick={() => setTab("history")}
        />
      </div>

      <div style={{ padding: "0 16px" }}>
        {/* Dashboard */}
        {tab === "dashboard" && (
          <DashboardView
            results={results}
            predictions={predictions}
            aiAnalysis={aiAnalysis}
            analysisLoading={analysisLoading}
            getAiAnalysis={getAiAnalysis}
            aiRecs={aiRecs}
            recsLoading={recsLoading}
            getAiRecs={getAiRecs}
          />
        )}

        {/* Predictions */}
        {tab === "predictions" && (
          <PredictionsView
            predictions={predictions}
            daysToExpiry={daysToExpiry}
          />
        )}

        {/* AI Advisor */}
        {tab === "advisor" && (
          <AdvisorView
            chatMessages={chatMessages}
            chatLoading={chatLoading}
            chatInput={chatInput}
            setChatInput={setChatInput}
            sendChat={sendChat}
          />
        )}

        {/* Portfolio */}
        {tab === "portfolio" && (
          <PortfolioView
            results={results}
            priceData={priceData}
            ticker={ticker}
            initialCash={initialCash}
          />
        )}

        {/* Trades */}
        {tab === "trades" && <TradesView results={results} />}

        {/* History */}
        {tab === "history" && <HistoryView />}

        {/* Loading State */}
        {running && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: 60,
              gap: 16,
            }}
          >
            <RefreshCw
              size={28}
              color={GOLD}
              style={{ animation: "pulse 1s infinite" }}
            />
            <span
              style={{ fontSize: 13, color: GOLD, fontFamily: monoFont }}
            >
              Running simulation...
            </span>
          </div>
        )}
      </div>

      {/* DISCLAIMER */}
      <div
        style={{
          margin: "20px 16px 0",
          padding: 14,
          background: "rgba(248,113,113,0.05)",
          border: "1px solid rgba(248,113,113,0.15)",
          borderRadius: 12,
          fontSize: 10,
          color: TEXT_SECONDARY,
          fontFamily: monoFont,
          lineHeight: 1.6,
        }}
      >
        ⚠️ EDUCATIONAL ONLY. Uses simulated data & Black-Scholes estimates.
        Not financial advice. Past performance ≠ future results.
      </div>
    </div>
  );
}
