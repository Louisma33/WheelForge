// ─── AI PROXY ROUTE ───
// Proxies Claude API calls through the backend to protect the Anthropic API key

import { Router } from "express";

const router = Router();

// POST /api/ai/chat
router.post("/chat", async (req, res) => {
    try {
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
            return res.status(503).json({
                success: false,
                error: "AI service not configured. Set ANTHROPIC_API_KEY on the server.",
            });
        }

        const { systemPrompt, userMessage, maxTokens = 1000 } = req.body;

        if (!userMessage) {
            return res.status(400).json({ success: false, error: "userMessage is required" });
        }

        const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": apiKey,
                "anthropic-version": "2023-06-01",
            },
            body: JSON.stringify({
                model: "claude-sonnet-4-20250514",
                max_tokens: maxTokens,
                system: systemPrompt || "You are a helpful options trading assistant.",
                messages: [{ role: "user", content: userMessage }],
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Claude API error:", data);
            return res.status(response.status).json({
                success: false,
                error: data.error?.message || "AI service error",
            });
        }

        const text = data.content?.map((b) => b.text || "").join("\n") || "No response generated.";
        res.json({ success: true, data: { response: text } });
    } catch (err) {
        console.error("AI proxy error:", err.message);
        res.status(500).json({ success: false, error: "Failed to reach AI service" });
    }
});

export default router;
