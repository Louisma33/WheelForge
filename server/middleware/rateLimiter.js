// ─── RATE LIMITER MIDDLEWARE ───
import rateLimit from "express-rate-limit";

// Global rate limiter — 100 requests per minute per IP
export const globalLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: "Too many requests. Please try again later." },
});

// Strict limiter for expensive endpoints (options chain, search)
export const strictLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: "Rate limit exceeded for this endpoint." },
});

// AI limiter — 10 requests per minute
export const aiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: "AI request limit reached. Please wait a moment." },
});
