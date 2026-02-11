// ─── STOCK DATA ROUTES ───
import { Router } from "express";
import {
    getStockSnapshot,
    getPreviousClose,
    getHistoricalAggregates,
} from "../services/polygonClient.js";
import {
    mockStockSnapshot,
    mockPreviousClose,
    mockHistoricalAggregates,
} from "../services/mockData.js";

const router = Router();

const useMock = () => !process.env.POLYGON_API_KEY || process.env.POLYGON_API_KEY === "demo";
const apiKey = () => process.env.POLYGON_API_KEY;

// GET /api/stocks/:ticker/snapshot
router.get("/:ticker/snapshot", async (req, res) => {
    try {
        const { ticker } = req.params;
        const data = useMock()
            ? mockStockSnapshot(ticker)
            : await getStockSnapshot(ticker, apiKey());
        res.json({ success: true, data });
    } catch (err) {
        console.error(`Snapshot error for ${req.params.ticker}:`, err.message);
        // Fallback to mock on API error
        res.json({ success: true, data: mockStockSnapshot(req.params.ticker), _fallback: true });
    }
});

// GET /api/stocks/:ticker/prev-close
router.get("/:ticker/prev-close", async (req, res) => {
    try {
        const { ticker } = req.params;
        const data = useMock()
            ? mockPreviousClose(ticker)
            : await getPreviousClose(ticker, apiKey());
        res.json({ success: true, data });
    } catch (err) {
        console.error(`Prev close error for ${req.params.ticker}:`, err.message);
        res.json({ success: true, data: mockPreviousClose(req.params.ticker), _fallback: true });
    }
});

// GET /api/stocks/:ticker/history?from=YYYY-MM-DD&to=YYYY-MM-DD&timespan=day&multiplier=1
router.get("/:ticker/history", async (req, res) => {
    try {
        const { ticker } = req.params;
        const { from, to, timespan = "day", multiplier = "1" } = req.query;

        // Default: last 1 year
        const toDate = to || new Date().toISOString().split("T")[0];
        const fromDate = from || (() => {
            const d = new Date();
            d.setFullYear(d.getFullYear() - 1);
            return d.toISOString().split("T")[0];
        })();

        const data = useMock()
            ? mockHistoricalAggregates(ticker, fromDate, toDate)
            : await getHistoricalAggregates(ticker, fromDate, toDate, timespan, parseInt(multiplier), apiKey());
        res.json({ success: true, data });
    } catch (err) {
        console.error(`History error for ${req.params.ticker}:`, err.message);
        const toDate = req.query.to || new Date().toISOString().split("T")[0];
        const fromDate = req.query.from || (() => { const d = new Date(); d.setFullYear(d.getFullYear() - 1); return d.toISOString().split("T")[0]; })();
        res.json({ success: true, data: mockHistoricalAggregates(req.params.ticker, fromDate, toDate), _fallback: true });
    }
});

// GET /api/stocks/batch/snapshots?tickers=SPY,AAPL,TSLA
router.get("/batch/snapshots", async (req, res) => {
    try {
        const tickers = (req.query.tickers || "SPY").split(",").map((t) => t.trim().toUpperCase());
        const results = await Promise.all(
            tickers.map(async (t) => {
                try {
                    return useMock()
                        ? mockStockSnapshot(t)
                        : await getStockSnapshot(t, apiKey());
                } catch {
                    return mockStockSnapshot(t);
                }
            })
        );
        res.json({ success: true, data: results });
    } catch (err) {
        console.error("Batch snapshot error:", err.message);
        res.status(500).json({ success: false, error: "Failed to fetch batch snapshots" });
    }
});

export default router;
