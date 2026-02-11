// ─── BLACK-SCHOLES ENGINE ───
// Rational approximation of the cumulative normal distribution
export const normalCDF = (x) => {
    const a1 = 0.254829592,
        a2 = -0.284496736,
        a3 = 1.421413741,
        a4 = -1.453152027,
        a5 = 1.061405429,
        p = 0.3275911;
    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x) / Math.sqrt(2);
    const t = 1.0 / (1.0 + p * x);
    const y =
        1.0 -
        ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    return 0.5 * (1.0 + sign * y);
};

// Black-Scholes option pricing model
export const blackScholes = (S, K, T, r, sigma, type = "put") => {
    if (T <= 0 || sigma <= 0) return 0;
    const d1 =
        (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) /
        (sigma * Math.sqrt(T));
    const d2 = d1 - sigma * Math.sqrt(T);
    if (type === "call")
        return S * normalCDF(d1) - K * Math.exp(-r * T) * normalCDF(d2);
    return K * Math.exp(-r * T) * normalCDF(-d2) - S * normalCDF(-d1);
};
