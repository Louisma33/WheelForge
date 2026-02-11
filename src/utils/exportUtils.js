// ─── EXPORT UTILITIES ───

/**
 * Export simulation trades as CSV and trigger download
 */
export const exportTradesCSV = (trades, ticker, params) => {
    const header = "Date,Action,Strike,Premium,Price\n";
    const rows = trades
        .map(
            (t) =>
                `${t.date},${t.type},${t.strike},${t.premium === "—" ? "" : t.premium},${t.price}`
        )
        .join("\n");

    const meta = `# WheelForge Trade Export\n# Ticker: ${ticker}\n# Capital: $${params.initialCash}\n# OTM: ${(params.otmPct * 100).toFixed(0)}%\n# DTE: ${params.daysToExpiry}\n# Contracts: ${params.contracts}\n# Generated: ${new Date().toISOString()}\n#\n`;
    const csv = meta + header + rows;
    downloadFile(csv, `wheelforge_${ticker}_trades.csv`, "text/csv");
};

/**
 * Export simulation summary as CSV
 */
export const exportSummaryCSV = (results, predictions, ticker, params) => {
    const lines = [
        "# WheelForge Simulation Summary",
        `# Generated: ${new Date().toISOString()}`,
        "#",
        "Metric,Value",
        `Ticker,${ticker}`,
        `Initial Capital,$${params.initialCash}`,
        `OTM%,${(params.otmPct * 100).toFixed(0)}%`,
        `DTE,${params.daysToExpiry}`,
        `Contracts,${params.contracts}`,
        "",
        `Final Value,$${results.finalValue.toFixed(2)}`,
        `Wheel Return,${results.wheelReturn.toFixed(2)}%`,
        `Buy & Hold Return,${results.bhReturn.toFixed(2)}%`,
        `Alpha,${(results.wheelReturn - results.bhReturn).toFixed(2)}%`,
        `Total Premium,$${results.totalPremium.toFixed(2)}`,
        "",
        `Puts Sold,${results.putsSold}`,
        `Puts Assigned,${results.putsAssigned}`,
        `Calls Sold,${results.callsSold}`,
        `Calls Assigned,${results.callsAssigned}`,
        `Current Cash,$${results.currentCash.toFixed(2)}`,
        `Current Shares,${results.currentShares}`,
    ];

    if (predictions) {
        lines.push(
            "",
            `Current Price,$${predictions.currentPrice.toFixed(2)}`,
            `Predicted Price,$${predictions.predictedPrice.toFixed(2)}`,
            `Put Assignment Prob,${(predictions.putAssignProb * 100).toFixed(1)}%`,
            `Call Assignment Prob,${(predictions.callAssignProb * 100).toFixed(1)}%`,
            `Put Premium,$${predictions.putPremium.toFixed(2)}`,
            `Call Premium,$${predictions.callPremium.toFixed(2)}`
        );
    }

    const csv = lines.join("\n");
    downloadFile(csv, `wheelforge_${ticker}_summary.csv`, "text/csv");
};

/**
 * Export portfolio history as CSV
 */
export const exportHistoryCSV = (history, ticker) => {
    const header = "Date,Portfolio Value,Cash,Shares\n";
    const rows = history
        .map((h) => `${h.date},${h.value},${h.cash},${h.shares}`)
        .join("\n");
    const csv = header + rows;
    downloadFile(csv, `wheelforge_${ticker}_portfolio_history.csv`, "text/csv");
};

/**
 * Export optimizer results as CSV
 */
export const exportOptimizerCSV = (results, ticker) => {
    const header =
        "OTM%,DTE,Wheel Return,B&H Return,Alpha,Avg Premium,Avg Trades,Risk Score\n";
    const rows = results
        .map(
            (r) =>
                `${r.otmPctDisplay},${r.dte},${r.wheelReturn}%,${r.bhReturn}%,${r.alpha}%,$${r.avgPremium},${r.avgTrades},${r.riskScore}%`
        )
        .join("\n");
    const csv = `# WheelForge Optimizer Results — ${ticker}\n# Generated: ${new Date().toISOString()}\n#\n` + header + rows;
    downloadFile(csv, `wheelforge_${ticker}_optimizer.csv`, "text/csv");
};

// Internal download helper
function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
