#!/usr/bin/env tsx
/**
 * Script to populate historical forex data for ML training
 * Fetches live rates and stores them in HistoricalData table
 */

import { PrismaClient } from '@prisma/client';
import { getRealTimeRate } from '../src/services/forex.service';

const prisma = new PrismaClient();

const CURRENCY_PAIRS = [
    { from: 'EUR', to: 'USD', pair: 'EUR-USD' },
    { from: 'GBP', to: 'USD', pair: 'GBP-USD' },
    { from: 'USD', to: 'JPY', pair: 'USD-JPY' },
    { from: 'AUD', to: 'USD', pair: 'AUD-USD' },
    { from: 'USD', to: 'CAD', pair: 'USD-CAD' },
];

async function populateHistoricalData() {
    console.log('🚀 Starting historical data population...\n');

    for (const { from, to, pair } of CURRENCY_PAIRS) {
        try {
            console.log(`📊 Fetching rate for ${pair}...`);

            // Fetch current live rate
            const rate = await getRealTimeRate(from, to);

            // Store in HistoricalData table
            await prisma.historicalData.create({
                data: {
                    currencyPair: pair,
                    date: new Date(),
                    open: rate,
                    high: rate * 1.001, // Slight variation for OHLC
                    low: rate * 0.999,
                    close: rate,
                    volume: Math.floor(Math.random() * 1000000),
                },
            });

            console.log(`✅ ${pair}: ${rate.toFixed(4)} - Stored successfully`);

            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error: any) {
            console.error(`❌ Failed to fetch ${pair}:`, error.message);
        }
    }

    // Check total records
    const count = await prisma.historicalData.count();
    console.log(`\n✅ Total historical records: ${count}`);
    console.log('\n💡 Tip: Run this script regularly (e.g., hourly via cron) to build historical data for ML training');
}

populateHistoricalData()
    .then(() => {
        console.log('\n🎉 Data population complete!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Error:', error);
        process.exit(1);
    })
    .finally(() => {
        prisma.$disconnect();
    });
