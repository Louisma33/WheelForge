// ─── WHEELFORGE BACKEND SERVER ───
// Proxies Polygon.io API calls, caches data, and serves market data to the frontend

import "dotenv/config";
import express from "express";
import cors from "cors";
import { globalLimiter, strictLimiter, aiLimiter } from "./middleware/rateLimiter.js";
import stocksRouter from "./routes/stocks.js";
import optionsRouter from "./routes/options.js";
import searchRouter from "./routes/search.js";
import aiRouter from "./routes/ai.js";
import { getCacheStats, flushCache } from "./services/polygonClient.js";

const app = express();
const PORT = process.env.PORT || 3001;

// ─── MIDDLEWARE ───
app.use(cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
}));
app.use(express.json());
app.use(globalLimiter);

// ─── REQUEST LOGGING ───
app.use((req, _res, next) => {
    const timestamp = new Date().toISOString().split("T")[1].split(".")[0];
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    next();
});

// ─── ROUTES ───
app.use("/api/stocks", stocksRouter);
app.use("/api/options", strictLimiter, optionsRouter);
app.use("/api", searchRouter);        // /api/search, /api/ticker/:ticker/details, /api/market/status
app.use("/api/ai", aiLimiter, aiRouter);

// ─── HEALTH & ADMIN ───
app.get("/api/health", (_req, res) => {
    const usingMock = !process.env.POLYGON_API_KEY || process.env.POLYGON_API_KEY === "demo";
    res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        dataSource: usingMock ? "mock" : "polygon.io",
        cache: getCacheStats(),
        version: "1.0.0",
    });
});

app.post("/api/admin/cache/flush", (_req, res) => {
    flushCache();
    res.json({ success: true, message: "Cache flushed" });
});

// ─── 404 ───
app.use((_req, res) => {
    res.status(404).json({ success: false, error: "Endpoint not found" });
});

// ─── ERROR HANDLER ───
app.use((err, _req, res, _next) => {
    console.error("Server error:", err);
    res.status(500).json({ success: false, error: "Internal server error" });
});

// ─── START ───
app.listen(PORT, () => {
    const usingMock = !process.env.POLYGON_API_KEY || process.env.POLYGON_API_KEY === "demo";
    console.log(`\n🔧 WheelForge Server running on port ${PORT}`);
    console.log(`📊 Data source: ${usingMock ? "MOCK DATA (set POLYGON_API_KEY for live)" : "Polygon.io (live)"}`);
    console.log(`🌐 CORS origin: ${process.env.CORS_ORIGIN || "http://localhost:5173"}`);
    console.log(`📡 Endpoints ready:\n`);
    console.log(`   GET  /api/stocks/:ticker/snapshot`);
    console.log(`   GET  /api/stocks/:ticker/prev-close`);
    console.log(`   GET  /api/stocks/:ticker/history`);
    console.log(`   GET  /api/stocks/batch/snapshots`);
    console.log(`   GET  /api/options/:ticker/chain`);
    console.log(`   GET  /api/options/:ticker/expirations`);
    console.log(`   GET  /api/options/contract/:id`);
    console.log(`   GET  /api/search?q=`);
    console.log(`   GET  /api/ticker/:ticker/details`);
    console.log(`   GET  /api/market/status`);
    console.log(`   POST /api/ai/chat`);
    console.log(`   GET  /api/health\n`);
});
