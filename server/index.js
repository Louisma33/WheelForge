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
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { mockStockSnapshot } from "./services/mockData.js";

const server = createServer(app);

server.listen(PORT, () => {
    const usingMock = !process.env.POLYGON_API_KEY || process.env.POLYGON_API_KEY === "demo";
    console.log(`\n🔧 WheelForge Server running on port ${PORT}`);
    console.log(`📊 Data source: ${usingMock ? "MOCK DATA (set POLYGON_API_KEY for live)" : "Polygon.io (live)"}`);
    console.log(`🌐 CORS origin: ${process.env.CORS_ORIGIN || "http://localhost:5173"}`);
    console.log(`📡 HTTP endpoints ready:`);
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
    console.log(`   GET  /api/health`);
    console.log(`🔌 WebSocket: ws://localhost:${PORT}/ws/prices\n`);
});

// ─── WEBSOCKET RELAY ───
const wss = new WebSocketServer({ server, path: "/ws/prices" });

// Track subscriptions per client
const clientSubscriptions = new Map();

// Simulated price updates (5-second intervals)
const priceIntervals = new Map(); // ticker → intervalId
const latestPrices = new Map();   // ticker → { price, change, ... }

const getSubscriberCount = (ticker) => {
    let count = 0;
    for (const subs of clientSubscriptions.values()) {
        if (subs.has(ticker)) count++;
    }
    return count;
};

const startPriceStream = (ticker) => {
    if (priceIntervals.has(ticker)) return;

    // Initialize base price from mock
    const snap = mockStockSnapshot(ticker);
    latestPrices.set(ticker, {
        price: snap.price,
        change: snap.change,
        changePercent: snap.changePercent,
        volume: snap.volume,
    });

    // Update every 5 seconds with small random walk
    const intervalId = setInterval(() => {
        const current = latestPrices.get(ticker);
        if (!current) return;

        // Small random walk (±0.15% per tick)
        const drift = (Math.random() - 0.48) * 0.003;
        const newPrice = parseFloat((current.price * (1 + drift)).toFixed(2));
        const change = parseFloat((newPrice - snap.price).toFixed(2));
        const changePercent = parseFloat(((change / snap.price) * 100).toFixed(2));

        const update = {
            price: newPrice,
            change,
            changePercent,
            volume: current.volume + Math.floor(Math.random() * 5000),
        };
        latestPrices.set(ticker, update);

        // Broadcast to all subscribers
        const message = JSON.stringify({
            type: "price_update",
            ticker,
            ...update,
            timestamp: Date.now(),
        });

        for (const [client, subs] of clientSubscriptions.entries()) {
            if (subs.has(ticker) && client.readyState === 1) {
                client.send(message);
            }
        }
    }, 5000);

    priceIntervals.set(ticker, intervalId);
};

const stopPriceStream = (ticker) => {
    if (getSubscriberCount(ticker) === 0) {
        const intervalId = priceIntervals.get(ticker);
        if (intervalId) {
            clearInterval(intervalId);
            priceIntervals.delete(ticker);
            latestPrices.delete(ticker);
        }
    }
};

wss.on("connection", (ws) => {
    clientSubscriptions.set(ws, new Set());

    ws.on("message", (rawData) => {
        try {
            const msg = JSON.parse(rawData.toString());

            switch (msg.type) {
                case "subscribe": {
                    const tickers = msg.tickers || [];
                    const subs = clientSubscriptions.get(ws);
                    tickers.forEach((t) => {
                        const upper = t.toUpperCase();
                        subs.add(upper);
                        startPriceStream(upper);

                        // Send immediate snapshot
                        const latest = latestPrices.get(upper);
                        if (latest) {
                            ws.send(JSON.stringify({
                                type: "price_update",
                                ticker: upper,
                                ...latest,
                                timestamp: Date.now(),
                            }));
                        }
                    });
                    ws.send(JSON.stringify({ type: "subscribed", tickers }));
                    break;
                }

                case "unsubscribe": {
                    const tickers = msg.tickers || [];
                    const subs = clientSubscriptions.get(ws);
                    tickers.forEach((t) => {
                        const upper = t.toUpperCase();
                        subs.delete(upper);
                        stopPriceStream(upper);
                    });
                    ws.send(JSON.stringify({ type: "unsubscribed", tickers }));
                    break;
                }

                case "ping":
                    ws.send(JSON.stringify({ type: "pong" }));
                    break;

                default:
                    break;
            }
        } catch {
            ws.send(JSON.stringify({ type: "error", message: "Invalid message format" }));
        }
    });

    ws.on("close", () => {
        const subs = clientSubscriptions.get(ws) || new Set();
        clientSubscriptions.delete(ws);

        // Clean up streams with no remaining subscribers
        subs.forEach((ticker) => stopPriceStream(ticker));
    });

    ws.on("error", () => {
        clientSubscriptions.delete(ws);
    });
});

