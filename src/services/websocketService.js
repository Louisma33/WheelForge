// ─── WEBSOCKET STREAMING SERVICE ───
// Connects to backend WebSocket relay for delayed price streaming
// Auto-reconnect, heartbeat, and React-friendly subscription API

const WS_BASE = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3001")
    .replace(/^http/, "ws")
    .replace(/\/api$/, "");

const WS_URL = `${WS_BASE}/ws/prices`;

class WebSocketService {
    constructor() {
        this.ws = null;
        this.subscriptions = new Map(); // ticker → Set<callback>
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
        this.reconnectDelay = 1000;
        this.heartbeatInterval = null;
        this.isConnecting = false;
        this.isDestroyed = false;
        this._statusListeners = new Set();
        this.status = "disconnected"; // disconnected | connecting | connected | error
    }

    // ── Connection Management ──

    connect() {
        if (this.isDestroyed || this.isConnecting || this.ws?.readyState === WebSocket.OPEN) return;

        this.isConnecting = true;
        this._setStatus("connecting");

        try {
            this.ws = new WebSocket(WS_URL);

            this.ws.onopen = () => {
                this.isConnecting = false;
                this.reconnectAttempts = 0;
                this._setStatus("connected");

                // Re-subscribe to all active tickers
                for (const ticker of this.subscriptions.keys()) {
                    this._sendSubscribe(ticker);
                }

                // Start heartbeat
                this._startHeartbeat();
            };

            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this._handleMessage(data);
                } catch {
                    // Ignore malformed messages
                }
            };

            this.ws.onclose = (event) => {
                this.isConnecting = false;
                this._stopHeartbeat();

                if (!this.isDestroyed && event.code !== 1000) {
                    this._setStatus("disconnected");
                    this._scheduleReconnect();
                }
            };

            this.ws.onerror = () => {
                this.isConnecting = false;
                this._setStatus("error");
            };
        } catch {
            this.isConnecting = false;
            this._setStatus("error");
            this._scheduleReconnect();
        }
    }

    disconnect() {
        this.isDestroyed = true;
        this._stopHeartbeat();
        if (this.ws) {
            this.ws.close(1000, "Client disconnect");
            this.ws = null;
        }
        this._setStatus("disconnected");
    }

    _scheduleReconnect() {
        if (this.isDestroyed || this.reconnectAttempts >= this.maxReconnectAttempts) return;

        const delay = Math.min(
            this.reconnectDelay * Math.pow(2, this.reconnectAttempts),
            30000 // Max 30 seconds
        );

        this.reconnectAttempts++;
        setTimeout(() => this.connect(), delay);
    }

    _startHeartbeat() {
        this._stopHeartbeat();
        this.heartbeatInterval = setInterval(() => {
            if (this.ws?.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({ type: "ping" }));
            }
        }, 30000);
    }

    _stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    // ── Subscription Management ──

    subscribe(ticker, callback) {
        const upperTicker = ticker.toUpperCase();

        if (!this.subscriptions.has(upperTicker)) {
            this.subscriptions.set(upperTicker, new Set());
        }
        this.subscriptions.get(upperTicker).add(callback);

        // Connect if not connected
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            this.connect();
        } else {
            this._sendSubscribe(upperTicker);
        }

        // Return unsubscribe function
        return () => this.unsubscribe(upperTicker, callback);
    }

    unsubscribe(ticker, callback) {
        const upperTicker = ticker.toUpperCase();
        const callbacks = this.subscriptions.get(upperTicker);
        if (callbacks) {
            callbacks.delete(callback);
            if (callbacks.size === 0) {
                this.subscriptions.delete(upperTicker);
                this._sendUnsubscribe(upperTicker);
            }
        }

        // Disconnect if no subscriptions
        if (this.subscriptions.size === 0 && this.ws) {
            this.disconnect();
        }
    }

    _sendSubscribe(ticker) {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: "subscribe",
                tickers: [ticker],
            }));
        }
    }

    _sendUnsubscribe(ticker) {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: "unsubscribe",
                tickers: [ticker],
            }));
        }
    }

    // ── Message Handling ──

    _handleMessage(data) {
        switch (data.type) {
            case "price_update": {
                const { ticker, price, change, changePercent, volume, timestamp } = data;
                const callbacks = this.subscriptions.get(ticker);
                if (callbacks) {
                    const update = { ticker, price, change, changePercent, volume, timestamp };
                    callbacks.forEach((cb) => cb(update));
                }
                break;
            }
            case "pong":
                // Heartbeat acknowledged
                break;
            case "subscribed":
            case "unsubscribed":
                // Confirmation — no action needed
                break;
            case "error":
                console.warn("[WS] Server error:", data.message);
                break;
            default:
                break;
        }
    }

    // ── Status Listeners ──

    _setStatus(status) {
        this.status = status;
        this._statusListeners.forEach((cb) => cb(status));
    }

    onStatusChange(callback) {
        this._statusListeners.add(callback);
        return () => this._statusListeners.delete(callback);
    }

    getStatus() {
        return this.status;
    }

    getSubscribedTickers() {
        return Array.from(this.subscriptions.keys());
    }
}

// Singleton instance
export const wsService = new WebSocketService();

// ─── REACT HOOKS ───

import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Hook: Subscribe to live price updates for a ticker
 * Returns { price, change, changePercent, volume, connected }
 */
export const useLivePrice = (ticker, enabled = true) => {
    const [priceData, setPriceData] = useState(null);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        if (!ticker || !enabled) return;

        const handleUpdate = (update) => {
            setPriceData(update);
        };

        const handleStatus = (status) => {
            setConnected(status === "connected");
        };

        const unsubPrice = wsService.subscribe(ticker, handleUpdate);
        const unsubStatus = wsService.onStatusChange(handleStatus);
        setConnected(wsService.getStatus() === "connected");

        return () => {
            unsubPrice();
            unsubStatus();
        };
    }, [ticker, enabled]);

    return {
        price: priceData?.price ?? null,
        change: priceData?.change ?? null,
        changePercent: priceData?.changePercent ?? null,
        volume: priceData?.volume ?? null,
        timestamp: priceData?.timestamp ?? null,
        connected,
    };
};

/**
 * Hook: Subscribe to multiple tickers at once
 */
export const useLivePrices = (tickers = [], enabled = true) => {
    const [prices, setPrices] = useState({});
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        if (!tickers.length || !enabled) return;

        const unsubscribers = [];

        tickers.forEach((ticker) => {
            const unsubPrice = wsService.subscribe(ticker, (update) => {
                setPrices((prev) => ({
                    ...prev,
                    [update.ticker]: update,
                }));
            });
            unsubscribers.push(unsubPrice);
        });

        const unsubStatus = wsService.onStatusChange((status) => {
            setConnected(status === "connected");
        });
        unsubscribers.push(unsubStatus);
        setConnected(wsService.getStatus() === "connected");

        return () => unsubscribers.forEach((unsub) => unsub());
    }, [tickers.join(","), enabled]);

    return { prices, connected };
};

/**
 * Hook: WebSocket connection status
 */
export const useWebSocketStatus = () => {
    const [status, setStatus] = useState(wsService.getStatus());

    useEffect(() => {
        return wsService.onStatusChange(setStatus);
    }, []);

    return status;
};
