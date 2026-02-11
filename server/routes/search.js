// ─── SEARCH & REFERENCE ROUTES ───
import { Router } from "express";
import { searchTickers, getTickerDetails, getMarketStatus } from "../services/polygonClient.js";
import { mockSearchTickers, mockTickerDetails, mockMarketStatus } from "../services/mockData.js";

const router = Router();

const useMock = () => !process.env.POLYGON_API_KEY || process.env.POLYGON_API_KEY === "demo";
const apiKey = () => process.env.POLYGON_API_KEY;

// GET /api/search?q=apple&limit=20
router.get("/search", async (req, res) => {
    try {
        const { q, limit = "20" } = req.query;
        if (!q || q.length < 1) {
            return res.json({ success: true, data: { results: [] } });
        }
        const data = useMock()
            ? mockSearchTickers(q)
            : await searchTickers(q, apiKey(), parseInt(limit));
        res.json({ success: true, data });
    } catch (err) {
        console.error("Search error:", err.message);
        res.json({ success: true, data: mockSearchTickers(req.query.q || ""), _fallback: true });
    }
});

// GET /api/ticker/:ticker/details
router.get("/ticker/:ticker/details", async (req, res) => {
    try {
        const { ticker } = req.params;
        const data = useMock()
            ? mockTickerDetails(ticker)
            : await getTickerDetails(ticker, apiKey());
        res.json({ success: true, data });
    } catch (err) {
        console.error(`Ticker details error for ${req.params.ticker}:`, err.message);
        res.json({ success: true, data: mockTickerDetails(req.params.ticker), _fallback: true });
    }
});

// GET /api/market/status
router.get("/market/status", async (req, res) => {
    try {
        const data = useMock()
            ? mockMarketStatus()
            : await getMarketStatus(apiKey());
        res.json({ success: true, data });
    } catch (err) {
        console.error("Market status error:", err.message);
        res.json({ success: true, data: mockMarketStatus(), _fallback: true });
    }
});

export default router;
