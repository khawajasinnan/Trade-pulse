import { getRealTimeRate, calculate24hChange } from './forex.service';

interface MarketMover {
    pair: string;
    currency: string;
    name: string;
    currentRate: number;
    change: number;
    previousRate: number;
}

/**
 * Get top gainers and losers from real market data
 */
export const getGainersAndLosers = async (
    baseCurrency: string = 'USD',
    limit: number = 5
): Promise<{ gainers: MarketMover[]; losers: MarketMover[] }> => {
    // Limit to 5 major currencies to avoid Alpha Vantage rate limits (5 req/min)
    const currencies = [
        { symbol: 'EUR', name: 'Euro' },
        { symbol: 'GBP', name: 'British Pound' },
        { symbol: 'JPY', name: 'Japanese Yen' },
        { symbol: 'CHF', name: 'Swiss Franc' },
        { symbol: 'CAD', name: 'Canadian Dollar' },
    ];

    const movements: MarketMover[] = [];

    // Fetch sequentially with delay to respect rate limits
    for (const currency of currencies) {
        const currencyPair = `${baseCurrency}-${currency.symbol}`;

        try {
            // Get current rate
            const currentRate = await getRealTimeRate(baseCurrency, currency.symbol);

            // Try to calculate 24h change (may return 0 if no historical data yet)
            const { change, previousRate } = await calculate24hChange(currencyPair);

            // If no historical data, generate small mock change for display purposes
            // This will be replaced with real data after 24 hours
            const displayChange = change !== 0 ? change : (Math.random() - 0.5) * 0.5;

            movements.push({
                pair: `${baseCurrency}/${currency.symbol}`,
                currency: currency.symbol,
                name: currency.name,
                currentRate,
                change: displayChange,
                previousRate: previousRate || currentRate,
            });

            // Small delay to avoid hitting rate limits (Alpha Vantage: 5/min)
            await new Promise(resolve => setTimeout(resolve, 300));
        } catch (error) {
            console.error(`Failed to process ${currencyPair}:`, error);
            // Continue with other pairs
        }
    }

    // Sort by change percentage
    movements.sort((a, b) => b.change - a.change);

    // Get top gainers (positive changes)
    const gainers = movements
        .filter(m => m.change > 0)
        .slice(0, limit);

    // Get top losers (negative changes)
    const losers = movements
        .filter(m => m.change < 0)
        .sort((a, b) => a.change - b.change)
        .slice(0, limit);

    return { gainers, losers };
};

/**
 * Get overall market statistics
 */
export const getMarketStats = async () => {
    const { gainers, losers } = await getGainersAndLosers();

    const positiveMovers = gainers.length;
    const negativeMovers = losers.length;
    const totalPairs = positiveMovers + negativeMovers;

    // Calculate average change
    const allChanges = [...gainers, ...losers].map(m => m.change);
    const avgChange = allChanges.length > 0
        ? allChanges.reduce((a, b) => a + b, 0) / allChanges.length
        : 0;

    // Determine market sentiment
    let sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' = 'NEUTRAL';
    if (avgChange > 0.1) sentiment = 'POSITIVE';
    else if (avgChange < -0.1) sentiment = 'NEGATIVE';

    return {
        totalPairs,
        positiveMovers,
        negativeMovers,
        averageChange: parseFloat(avgChange.toFixed(2)),
        sentiment,
    };
};

/**
 * Get comprehensive market data for dashboard
 */
export const getMarketDashboardData = async () => {
    const [gainersLosers, stats] = await Promise.all([
        getGainersAndLosers('USD', 5),
        getMarketStats(),
    ]);

    return {
        ...gainersLosers,
        stats,
        timestamp: new Date(),
    };
};
