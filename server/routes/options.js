// ─── OPTIONS DATA ROUTES ───
import { Router } from "express";
import { getOptionsChain, getOptionsContract } from "../services/polygonClient.js";
import { mockOptionsChain } from "../services/mockData.js";

const router = Router();

const useMock = () => !process.env.POLYGON_API_KEY || process.env.POLYGON_API_KEY === "demo";
const apiKey = () => process.env.POLYGON_API_KEY;

// GET /api/options/:ticker/chain?expDate=YYYY-MM-DD&contractType=put|call
router.get("/:ticker/chain", async (req, res) => {
    try {
        const { ticker } = req.params;
        const { expDate, contractType, strikePrice } = req.query;

        const params = {};
        if (expDate) params.expDate = expDate;
        if (contractType) params.contractType = contractType;
        if (strikePrice) params.strikePrice = parseFloat(strikePrice);

        const data = useMock()
            ? mockOptionsChain(ticker, params)
            : await getOptionsChain(ticker, apiKey(), params);
        res.json({ success: true, data });
    } catch (err) {
        console.error(`Options chain error for ${req.params.ticker}:`, err.message);
        res.json({
            success: true,
            data: mockOptionsChain(req.params.ticker, req.query),
            _fallback: true,
        });
    }
});

// GET /api/options/contract/:contractTicker
router.get("/contract/:contractTicker", async (req, res) => {
    try {
        const { contractTicker } = req.params;
        if (useMock()) {
            return res.json({
                success: true,
                data: { contractTicker, _mock: true, message: "Contract details not available in mock mode" },
            });
        }
        const data = await getOptionsContract(contractTicker, apiKey());
        res.json({ success: true, data });
    } catch (err) {
        console.error(`Options contract error:`, err.message);
        res.status(500).json({ success: false, error: "Failed to fetch contract details" });
    }
});

// GET /api/options/:ticker/expirations — get unique expiration dates
router.get("/:ticker/expirations", async (req, res) => {
    try {
        const { ticker } = req.params;
        const data = useMock()
            ? mockOptionsChain(ticker)
            : await getOptionsChain(ticker, apiKey());

        const expirations = [...new Set(data.contracts.map((c) => c.expirationDate))].sort();
        res.json({ success: true, data: { ticker: ticker.toUpperCase(), expirations } });
    } catch (err) {
        console.error(`Expirations error for ${req.params.ticker}:`, err.message);
        res.status(500).json({ success: false, error: "Failed to fetch expirations" });
    }
});

export default router;
